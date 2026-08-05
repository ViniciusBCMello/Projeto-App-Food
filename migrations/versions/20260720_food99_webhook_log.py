"""adiciona log bruto de webhooks do 99food (diagnostico ate confirmarmos o payload real)

Revision ID: food99_webhook_log
Revises: food99_integracao_v2
Create Date: 2026-07-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "food99_webhook_log"
down_revision = "food99_integracao_v2"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "food99_webhook_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("headers", sa.Text(), nullable=True),
        sa.Column("corpo_bruto", sa.Text(), nullable=True),
        sa.Column("recebido_em", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("food99_webhook_logs")