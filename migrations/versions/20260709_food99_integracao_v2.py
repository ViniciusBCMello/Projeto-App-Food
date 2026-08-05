"""corrige schema 99food: autenticacao real da DiDi (app_id/app_secret/app_shop_id)

A primeira versão da integração 99Food (migration food99_integracao) foi
construída sobre a suposição errada de que o 99Food seguia o padrão Open
Delivery. O swagger.yaml oficial confirmou um modelo de autenticação
diferente (app_id + app_secret + app_shop_id -> auth_token, com fluxo de
autorização prévio da loja). Esta migration corrige a tabela de credenciais.

Se você ainda não rodou "flask db upgrade" com a revisão food99_integracao
em nenhum banco (nem local nem produção), pode ignorar esta migration e eu
simplesmente reescrevo a anterior — me avise que ajusto.

Revision ID: food99_integracao_v2
Revises: food99_integracao
Create Date: 2026-07-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "food99_integracao_v2"
down_revision = "food99_integracao"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table("food99_credenciais")

    op.create_table(
        "food99_credenciais",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("app_id", sa.String(length=50), nullable=False),
        sa.Column("app_secret", sa.String(length=255), nullable=False),
        sa.Column("app_shop_id", sa.String(length=255), nullable=False),
        sa.Column("base_url", sa.String(length=255), nullable=False),
        sa.Column("auth_token", sa.Text(), nullable=True),
        sa.Column("token_expira_em", sa.DateTime(), nullable=True),
        sa.Column("autorizada", sa.Boolean(), nullable=True),
        sa.Column("ativa", sa.Boolean(), nullable=True),
        sa.Column("criado_em", sa.DateTime(), nullable=True),
        sa.Column("atualizado_em", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("food99_credenciais")

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
