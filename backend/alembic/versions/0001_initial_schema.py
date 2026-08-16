"""initial schema — users, events, pdf_documents

Revision ID: 0001
Revises:
Create Date: 2026-07-17

This is the starting point for Alembic-managed migrations. It mirrors
the schema that Base.metadata.create_all() was producing already, so
running this against a fresh database gives you exactly what the app
expects. From here on, schema changes should go through
`alembic revision --autogenerate -m "..."` + `alembic upgrade head`
instead of relying on create_all() alone (which can only add new
tables, never alter existing ones).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    anxiety_level = sa.Enum("low", "medium", "high", name="anxietyleveldb")
    study_period = sa.Enum("semester", "internship", "vacation", "personal", name="studyperioddb")
    event_type = sa.Enum("assignment", "exam", "project", "meeting", "personal", "reminder", name="eventtypedb")
    priority = sa.Enum("low", "medium", "high", "urgent", name="prioritydb")

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("anxiety_level", anxiety_level, nullable=True, server_default="medium"),
        sa.Column("current_period", study_period, nullable=True, server_default="semester"),
        sa.Column("preferred_reminder_days", sa.Integer(), nullable=True, server_default="3"),
        sa.Column("productive_hours_start", sa.Integer(), nullable=True, server_default="9"),
        sa.Column("productive_hours_end", sa.Integer(), nullable=True, server_default="17"),
        sa.Column("max_daily_tasks", sa.Integer(), nullable=True, server_default="5"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("event_type", event_type, nullable=True, server_default="assignment"),
        sa.Column("priority", priority, nullable=True, server_default="medium"),
        sa.Column("deadline", sa.DateTime(), nullable=False),
        sa.Column("course", sa.String(), nullable=True),
        sa.Column("reminder_sent", sa.Boolean(), nullable=True, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE")),
    )

    op.create_table(
        "pdf_documents",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(), nullable=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True),
    )


def downgrade() -> None:
    op.drop_table("pdf_documents")
    op.drop_table("events")
    op.drop_table("users")
    sa.Enum(name="prioritydb").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="eventtypedb").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="studyperioddb").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="anxietyleveldb").drop(op.get_bind(), checkfirst=True)