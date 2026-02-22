"""
Flask application — REST API for the AI Research Agent.

Auth endpoints (public):
  POST   /api/signup              → create account
  POST   /api/login               → get JWT token

Research endpoints (JWT-protected, multi-tenant):
  POST   /api/research            → start a new research job
  GET    /api/research             → list current user's runs
  GET    /api/research/<id>        → get run status + report + citations
  GET    /api/research/<id>/logs   → get chronological action feed
"""
import os
import json
import re
import threading
from datetime import datetime, timezone, timedelta

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from pydantic import ValidationError
from dotenv import load_dotenv

from database import db, init_db
from models import User, ResearchRun, AgentLog, Citation, FollowUpMessage
from schemas import QueryRequest, SignupRequest, LoginRequest
from agent import ResearchAgent
from followup_agent import ask_follow_up

load_dotenv()

# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

app = Flask(__name__, instance_relative_config=True)

# Ensure instance folder exists for SQLite
os.makedirs(app.instance_path, exist_ok=True)

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"sqlite:///{os.path.join(app.instance_path, 'research.db')}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# JWT configuration
app.config["JWT_SECRET_KEY"] = os.environ.get(
    "JWT_SECRET_KEY", "research-agent-dev-secret-key-change-in-production"
)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

jwt = JWTManager(app)

# CORS for Vite dev server
CORS(
    app,
    origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5176",
        "http://localhost:5001",
        "http://127.0.0.1:5001",
    ],
)

init_db(app)


# ---------------------------------------------------------------------------
# Background agent runner
# ---------------------------------------------------------------------------


def _extract_citations(report_text: str):
    """Extract markdown-style [title](url) citations from the report."""
    pattern = r'\[([^\]]+)\]\((https?://[^\)]+)\)'
    matches = re.findall(pattern, report_text)
    seen_urls = set()
    citations = []
    for title, url in matches:
        if url not in seen_urls:
            seen_urls.add(url)
            if "arxiv" in url.lower():
                source_type = "ARXIV"
            else:
                source_type = "WEB"
            citations.append({"title": title, "url": url, "source_type": source_type})
    return citations


def _run_agent(run_id: str, query: str, api_key: str):
    """
    Execute the research agent in a background thread.
    Uses the authenticated user's API key.
    """
    with app.app_context():
        run = db.session.get(ResearchRun, run_id)
        if not run:
            return

        try:
            run.status = "IN_PROGRESS"
            db.session.commit()

            agent = ResearchAgent(api_key=api_key)
            report_chunks = []

            for event in agent.research(query):
                event_type = event.get("type", "unknown")

                log = AgentLog(
                    run_id=run_id,
                    action_type=event_type,
                    details=json.dumps(event),
                )
                db.session.add(log)
                db.session.commit()

                if event_type == "response_chunk":
                    report_chunks.append(event.get("content", ""))

            final_report = "".join(report_chunks)
            run.final_report = final_report
            run.status = "COMPLETED"
            run.updated_at = datetime.now(timezone.utc)
            db.session.commit()

            citation_items = _extract_citations(final_report)
            for c in citation_items:
                cit = Citation(
                    run_id=run_id,
                    title=c["title"],
                    url=c["url"],
                    source_type=c["source_type"],
                )
                db.session.add(cit)
            db.session.commit()

        except Exception as exc:
            db.session.rollback()
            run = db.session.get(ResearchRun, run_id)
            if run:
                run.status = "FAILED"
                run.error_message = str(exc)
                run.updated_at = datetime.now(timezone.utc)
                db.session.commit()

                error_log = AgentLog(
                    run_id=run_id,
                    action_type="error",
                    details=json.dumps({"type": "error", "message": str(exc)}),
                )
                db.session.add(error_log)
                db.session.commit()


# ---------------------------------------------------------------------------
# Auth routes (public)
# ---------------------------------------------------------------------------


@app.get("/")
def root():
    return jsonify({"message": "AI Research Agent Backend is running"})


@app.post("/api/signup")
def signup():
    """Create a new user account."""
    body = request.get_json(silent=True) or {}
    try:
        payload = SignupRequest(**body)
    except ValidationError as e:
        errors = e.errors()
        msg = "; ".join(err.get("msg", "Validation error") for err in errors)
        return jsonify({"error": msg}), 400

    # Check if username taken
    if User.query.filter_by(username=payload.username).first():
        return jsonify({"error": "Username already taken"}), 409

    user = User(
        username=payload.username,
        openrouter_api_key=payload.openrouter_api_key,
    )
    user.set_password(payload.password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Account created successfully"}), 201


@app.post("/api/login")
def login():
    """Authenticate and return a JWT access token."""
    body = request.get_json(silent=True) or {}
    try:
        payload = LoginRequest(**body)
    except ValidationError as e:
        errors = e.errors()
        msg = "; ".join(err.get("msg", "Validation error") for err in errors)
        return jsonify({"error": msg}), 400

    user = User.query.filter_by(username=payload.username).first()
    if not user or not user.check_password(payload.password):
        return jsonify({"error": "Invalid username or password"}), 401

    access_token = create_access_token(identity=user.id)
    return jsonify({
        "access_token": access_token,
        "user": user.to_dict(),
    })


# ---------------------------------------------------------------------------
# Research routes (JWT-protected, multi-tenant)
# ---------------------------------------------------------------------------


@app.post("/api/research")
@jwt_required()
def start_research():
    """Start a new research job scoped to the authenticated user."""
    body = request.get_json(silent=True) or {}
    try:
        payload = QueryRequest(**body)
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 400

    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    run = ResearchRun(user_id=user_id, user_query=payload.query, status="QUEUED")
    db.session.add(run)
    db.session.commit()

    run_id = run.id

    # Use the user's personal API key
    thread = threading.Thread(
        target=_run_agent,
        args=(run_id, payload.query, user.openrouter_api_key),
        daemon=True,
    )
    thread.start()

    return jsonify({"id": run_id, "status": "QUEUED"}), 201


@app.get("/api/research")
@jwt_required()
def list_runs():
    """List the authenticated user's research runs only."""
    user_id = get_jwt_identity()
    runs = (
        ResearchRun.query
        .filter_by(user_id=user_id)
        .order_by(ResearchRun.created_at.desc())
        .all()
    )
    return jsonify([r.to_dict() for r in runs])


@app.get("/api/research/<run_id>")
@jwt_required()
def get_run(run_id: str):
    """Get a single run — only if owned by the authenticated user."""
    user_id = get_jwt_identity()
    run = ResearchRun.query.filter_by(id=run_id, user_id=user_id).first()
    if not run:
        return jsonify({"error": "Run not found"}), 404
    return jsonify(run.to_dict(include_report=True))


@app.get("/api/research/<run_id>/logs")
@jwt_required()
def get_logs(run_id: str):
    """Get the chronological action feed — only if run is owned by user."""
    user_id = get_jwt_identity()
    run = ResearchRun.query.filter_by(id=run_id, user_id=user_id).first()
    if not run:
        return jsonify({"error": "Run not found"}), 404

    logs = AgentLog.query.filter_by(run_id=run_id).order_by(AgentLog.created_at.asc()).all()
    return jsonify([log.to_dict() for log in logs])


# ---------------------------------------------------------------------------
# Settings routes (JWT-protected)
# ---------------------------------------------------------------------------


@app.put("/api/settings/password")
@jwt_required()
def change_password():
    """Change the authenticated user's password."""
    body = request.get_json(silent=True) or {}
    old_password = body.get("old_password", "")
    new_password = body.get("new_password", "")
    confirm_password = body.get("confirm_password", "")

    if not old_password or not new_password or not confirm_password:
        return jsonify({"error": "All password fields are required"}), 400
    if len(new_password) < 8:
        return jsonify({"error": "New password must be at least 8 characters"}), 400
    if new_password != confirm_password:
        return jsonify({"error": "New passwords do not match"}), 400

    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not user.check_password(old_password):
        return jsonify({"error": "Current password is incorrect"}), 401

    user.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "Password updated successfully"})


@app.put("/api/settings/api-key")
@jwt_required()
def change_api_key():
    """Update the authenticated user's OpenRouter API key."""
    body = request.get_json(silent=True) or {}
    new_key = (body.get("openrouter_api_key") or "").strip()

    if not new_key:
        return jsonify({"error": "API key cannot be empty"}), 400

    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.openrouter_api_key = new_key
    db.session.commit()
    return jsonify({"message": "API key updated successfully"})


# ---------------------------------------------------------------------------
# Follow-up chat routes (JWT-protected)
# ---------------------------------------------------------------------------


@app.post("/api/research/<run_id>/chat")
@jwt_required()
def send_follow_up(run_id: str):
    """Send a follow-up question about a completed research run."""
    user_id = get_jwt_identity()
    run = ResearchRun.query.filter_by(id=run_id, user_id=user_id).first()
    if not run:
        return jsonify({"error": "Run not found"}), 404
    if run.status != "COMPLETED":
        return jsonify({"error": "Run is not completed yet"}), 400
    if not run.final_report:
        return jsonify({"error": "No report available for this run"}), 400

    body = request.get_json(silent=True) or {}
    message = (body.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Message cannot be empty"}), 400

    # Get conversation history
    history = [
        {"role": m.role, "content": m.content}
        for m in FollowUpMessage.query.filter_by(run_id=run_id)
            .order_by(FollowUpMessage.created_at.asc()).all()
    ]

    # Get user's API key
    user = db.session.get(User, user_id)
    api_key = user.openrouter_api_key if user else None

    # Call the isolated follow-up agent
    try:
        agent_response = ask_follow_up(
            api_key=api_key,
            report=run.final_report,
            history=history,
            question=message,
        )
    except Exception as e:
        return jsonify({"error": f"Agent error: {str(e)}"}), 500

    # Save both messages
    user_msg = FollowUpMessage(run_id=run_id, role="user", content=message)
    agent_msg = FollowUpMessage(run_id=run_id, role="agent", content=agent_response)
    db.session.add(user_msg)
    db.session.add(agent_msg)
    db.session.commit()

    return jsonify({"messages": [user_msg.to_dict(), agent_msg.to_dict()]})


@app.get("/api/research/<run_id>/chat")
@jwt_required()
def get_follow_ups(run_id: str):
    """Get all follow-up messages for a completed research run."""
    user_id = get_jwt_identity()
    run = ResearchRun.query.filter_by(id=run_id, user_id=user_id).first()
    if not run:
        return jsonify({"error": "Run not found"}), 404

    messages = (
        FollowUpMessage.query.filter_by(run_id=run_id)
        .order_by(FollowUpMessage.created_at.asc())
        .all()
    )
    return jsonify([m.to_dict() for m in messages])


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
