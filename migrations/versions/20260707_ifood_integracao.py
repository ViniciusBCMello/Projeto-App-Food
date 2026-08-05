"""integracao ifood: credenciais, dedup de eventos e origem do pedido

Revision ID: ifood_integracao
Revises: fase7_produto_custos
Create Date: 2026-07-07 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "ifood_integracao"
down_revision = "fase7_produto_custos"
branch_labels = None
depends_on = None


def upgrade():
    # ── Credenciais / token do iFood ───────────────────────────
    op.create_table(
        "ifood_credenciais",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.String(length=120), nullable=False),
        sa.Column("client_secret", sa.String(length=255), nullable=False),
        sa.Column("merchant_id", sa.String(length=64), nullable=False),
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
        "ifood_eventos_processados",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("evento_id", sa.String(length=64), nullable=False),
        sa.Column("tipo", sa.String(length=50), nullable=True),
        sa.Column("order_id", sa.String(length=64), nullable=True),
        sa.Column("processado_em", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("evento_id"),
    )

    # ── Pedido: origem e vínculo com o pedido no iFood ──────────
    with op.batch_alter_table("pedidos", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("origem", sa.String(length=20), nullable=False, server_default="interno")
        )
        batch_op.add_column(sa.Column("ifood_order_id", sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column("ifood_display_id", sa.String(length=20), nullable=True))
        batch_op.create_unique_constraint("uq_pedidos_ifood_order_id", ["ifood_order_id"])
        batch_op.alter_column("user_id", existing_type=sa.Integer(), nullable=True)

    # ── ItemPedido: produto opcional + nome externo (marketplace) ─
    with op.batch_alter_table("itens_pedido", schema=None) as batch_op:
        batch_op.alter_column("produto_id", existing_type=sa.Integer(), nullable=True)
        batch_op.add_column(sa.Column("nome_externo", sa.String(length=200), nullable=True))


def downgrade():
    with op.batch_alter_table("itens_pedido", schema=None) as batch_op:
        batch_op.drop_column("nome_externo")
        batch_op.alter_column("produto_id", existing_type=sa.Integer(), nullable=False)

    with op.batch_alter_table("pedidos", schema=None) as batch_op:
        batch_op.alter_column("user_id", existing_type=sa.Integer(), nullable=False)
        batch_op.drop_constraint("uq_pedidos_ifood_order_id", type_="unique")
        batch_op.drop_column("ifood_display_id")
        batch_op.drop_column("ifood_order_id")
        batch_op.drop_column("origem")

    op.drop_table("ifood_eventos_processados")
    op.drop_table("ifood_credenciais")
