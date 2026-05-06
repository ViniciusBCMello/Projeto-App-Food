"""fase7_produto_custos

Revision ID: fase7_produto_custos
Revises: <substitua pelo ID da última migration>
Create Date: 2026-04-14
"""
from alembic import op
import sqlalchemy as sa

revision = "fase7_produto_custos"
down_revision = '44699e242725'   # ← substitua pelo ID da sua última migration
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "produto_custos",
        sa.Column("id",             sa.Integer(),      primary_key=True),
        sa.Column("produto_id",     sa.Integer(),      sa.ForeignKey("produtos.id", name="fk_produto_custos_produto"), nullable=False),
        sa.Column("custo_unitario", sa.Numeric(10, 2), nullable=False),
        sa.Column("data_vigencia",  sa.Date(),         nullable=False),
        sa.Column("observacao",     sa.String(255)),
        sa.Column("criado_em",      sa.DateTime(),     server_default=sa.func.now()),
        if_not_exists=True,
    )
    op.create_index("ix_produto_custos_produto_vigencia", "produto_custos", ["produto_id", "data_vigencia"])


def downgrade():
    op.drop_index("ix_produto_custos_produto_vigencia", table_name="produto_custos")
    op.drop_table("produto_custos")