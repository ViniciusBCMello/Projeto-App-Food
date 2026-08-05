"""integracao 99food: credenciais, dedup de eventos e rastreio no pedido

Revision ID: food99_integracao
Revises: ifood_integracao
Create Date: 2026-07-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "food99_integracao"
down_revision = "ifood_integracao"
branch_labels = None
depends_on = None


def upgrade():
    # ── Credenciais / token do 99Food (Open Delivery) ──────────
    op.create_table(
        "food99_credenciais",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.String(length=150), nullable=False),
        sa.Column("client_secret", sa.String(length=255), nullable=False),
        sa.Column("merchant_id", sa.String(length=64), nullable=False),
        sa.Column("base_url", sa.String(length=255), nullable=False),
        sa.Column("access_token", sa.Text(), nullable=True),
        sa.Column("token_expira_em", sa.DateTime(), nullable=True),
        sa.Column("ativa", sa.Boolean(), nullable=True),
        sa.Column("ultimo_polling_em", sa.DateTime(), nullable=True),
        sa.Column("criado_em", sa.DateTime(), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── Deduplicação de eventos ─────────────────────────────────
    op.create_table(
        "food99_eventos_processados",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("evento_id", sa.String(length=64), nullable=False),
        sa.Column("tipo", sa.String(length=50), nullable=True),
        sa.Column("order_id", sa.String(length=64), nullable=True),
        sa.Column("processado_em", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("evento_id"),
    )

    # ── Pedido: vínculo com o pedido no 99Food ──────────────────
    with op.batch_alter_table("pedidos", schema=None) as batch_op:
        batch_op.add_column(sa.Column("food99_order_id", sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column("food99_display_id", sa.String(length=20), nullable=True))
        batch_op.create_unique_constraint("uq_pedidos_food99_order_id", ["food99_order_id"])


def downgrade():
    with op.batch_alter_table("pedidos", schema=None) as batch_op:
        batch_op.drop_constraint("uq_pedidos_food99_order_id", type_="unique")
        batch_op.drop_column("food99_display_id")
        batch_op.drop_column("food99_order_id")

    op.drop_table("food99_eventos_processados")
    op.drop_table("food99_credenciais")
