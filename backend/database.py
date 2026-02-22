"""
SQLAlchemy database engine and session configuration.
"""
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def init_db(app):
    """Bind SQLAlchemy to the Flask app and create all tables."""
    db.init_app(app)
    with app.app_context():
        # Import models so they register with SQLAlchemy metadata
        import models  # noqa: F401
        db.create_all()
