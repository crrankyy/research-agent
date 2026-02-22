"""
SQLAlchemy ORM models for the research agent.

Tables:
  - users:         registered user accounts
  - research_runs: tracks overarching research jobs (scoped per user)
  - agent_logs:    append-only observability feed
  - citations:     extracted sources per run
"""
import uuid
from datetime import datetime, timezone

from werkzeug.security import generate_password_hash, check_password_hash
from database import db


def _utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    openrouter_api_key = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=_utcnow)

    # Relationships
    runs = db.relationship(
        "ResearchRun", backref="owner", lazy="dynamic", cascade="all, delete-orphan"
    )

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ResearchRun(db.Model):
    __tablename__ = "research_runs"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, index=True
    )
    user_query = db.Column(db.Text, nullable=False)
    status = db.Column(
        db.String(20),
        nullable=False,
        default="QUEUED",
    )  # QUEUED | IN_PROGRESS | COMPLETED | FAILED
    final_report = db.Column(db.Text, nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=_utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=_utcnow, onupdate=_utcnow)

    # Relationships
    logs = db.relationship(
        "AgentLog", backref="run", lazy="dynamic", cascade="all, delete-orphan"
    )
    citations = db.relationship(
        "Citation", backref="run", lazy="dynamic", cascade="all, delete-orphan"
    )
    follow_ups = db.relationship(
        "FollowUpMessage", backref="run", lazy="dynamic",
        cascade="all, delete-orphan", order_by="FollowUpMessage.created_at.asc()"
    )

    def to_dict(self, include_report=False):
        d = {
            "id": self.id,
            "user_query": self.user_query,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_report:
            d["final_report"] = self.final_report
            d["error_message"] = self.error_message
            d["citations"] = [c.to_dict() for c in self.citations.all()]
        return d


class AgentLog(db.Model):
    __tablename__ = "agent_logs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    run_id = db.Column(
        db.String(36), db.ForeignKey("research_runs.id"), nullable=False, index=True
    )
    action_type = db.Column(db.String(30), nullable=False)
    details = db.Column(db.Text, nullable=True)  # JSON-encoded details
    created_at = db.Column(db.DateTime, nullable=False, default=_utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "run_id": self.run_id,
            "action_type": self.action_type,
            "details": self.details,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Citation(db.Model):
    __tablename__ = "citations"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    run_id = db.Column(
        db.String(36), db.ForeignKey("research_runs.id"), nullable=False, index=True
    )
    title = db.Column(db.String(500), nullable=False)
    url = db.Column(db.String(2000), nullable=False)
    source_type = db.Column(db.String(10), nullable=False, default="WEB")  # WEB | ARXIV | PDF

    def to_dict(self):
        return {
            "id": self.id,
            "run_id": self.run_id,
            "title": self.title,
            "url": self.url,
            "source_type": self.source_type,
        }


class FollowUpMessage(db.Model):
    __tablename__ = "follow_up_messages"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    run_id = db.Column(
        db.String(36), db.ForeignKey("research_runs.id"), nullable=False, index=True
    )
    role = db.Column(db.String(10), nullable=False)  # 'user' or 'agent'
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=_utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "run_id": self.run_id,
            "role": self.role,
            "content": self.content,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

