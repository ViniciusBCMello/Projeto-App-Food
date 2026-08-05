import os

import click
import secrets
from datetime import date, timedelta
from flask.cli import with_appcontext
from app import db

def registrar_comandos(app):
    app.cli.add_command(licenca, name="licenca")
    app.cli.add_command(setup, name="setup")
    app.cli.add_command(ifood, name="ifood")
    app.cli.add_command(food99, name="99food")

# ─── flask licenca ─────────────────────────────
@click.group()
def licenca():
    """Gerencia as licenças de uso do sistema."""
    pass

@licenca.command("instalar")
@click.option("--empresa", prompt="Nome da empresa")
@click.option("--plano", prompt="Plano (basico/profissional/enterprise)", default="basico")
@click.option("--dias", prompt="Dias de validade", default=365, type=int)
@with_appcontext
def licenca_instalar(empresa, plano, dias):
    """Instala a licença desta instalação."""
    from app.models import Licenca

    chave    = secrets.token_urlsafe(32)
    validade = date.today() + timedelta(days=dias)

    db.session.add(Licenca(
        chave=chave,
        empresa=empresa,
        plano=plano,
        validade=validade,
        ativa=True
    ))
    db.session.commit()

    click.echo(f"\n✅ Licença instalada!")
    click.echo(f"   Empresa : {empresa}")
    click.echo(f"   Plano   : {plano}")
    click.echo(f"   Validade: {validade}")
    click.echo(f"   Chave   : {chave}\n")


@licenca.command("status")
@with_appcontext
def licenca_status():
    """Exibe o status atual da licença."""
    from app.models import Licenca

    l = Licenca.query.first()
    if not l:
        click.echo("❌ Nenhuma licença instalada.")
        return

    click.echo(f"\n  Empresa : {l.empresa}")
    click.echo(f"  Plano   : {l.plano}")
    click.echo(f"  Validade: {l.validade}")
    click.echo(f"  Ativa   : {'Sim' if l.ativa else 'Não'}")
    click.echo(f"  Expirada: {'Sim' if l.expirada else 'Não'}\n")

# ─── flask setup ───────────────────────────────
@click.group()
def setup():
    """Comandos de setup do sistema."""
    pass


@setup.command("seed")
@with_appcontext
def setup_seed():
    """Cria o usuário dono inicial."""
    from app.models import User

    if User.query.filter_by(cargo="dono").first():
        click.echo("ℹ️  Usuário dono já existe.")
        return

    cpf = os.environ.get("ADMIN_CPF")
    if not cpf:
        cpf = click.prompt("CPF do administrador")   

    dono = User(
        nome="Administrador",
        email="admin@sistema.com",
        cargo="dono",
        cpf=cpf,
        ativo=True
    )
    dono.set_senha("admin1234")
    db.session.add(dono)
    db.session.commit()

    click.echo("\n✅ Usuário dono criado!")
    click.echo("   Email: admin@sistema.com")
    click.echo("   Senha: admin1234")
    click.echo("⚠️  Troque a senha após o primeiro login!\n")

# ─── flask setup faker ───────────────────────────────
@setup.command("faker")
@with_appcontext
def setup_faker():
    """Popula o banco com dados falsos para testes."""
    from app.seeds.faker_seed import popular_banco
    popular_banco()

# ─── flask ifood ────────────────────────────────
@click.group()
def ifood():
    """Comandos da integração com o iFood."""
    pass


@ifood.command("polling")
@with_appcontext
def ifood_polling():
    """
    Executa uma rodada de polling de eventos do iFood (fallback do webhook).
    Pensado para ser chamado por um agendador externo (cron) a cada 30s-1min.
    """
    from app.models import IfoodCredencial
    from app.ifood import service, client

    cred = IfoodCredencial.query.filter_by(ativa=True).first()
    if not cred:
        click.echo("ℹ️  Integração iFood não configurada. Nada a fazer.")
        return

    try:
        quantidade = service.executar_polling(cred)
        click.echo(f"✅ Polling concluído. {quantidade} evento(s) processado(s).")
    except client.IfoodApiError as e:
        click.echo(f"❌ Erro no polling do iFood: {e}")


# ─── flask 99food ───────────────────────────────
@click.group()
def food99():
    """Comandos da integração com o 99Food."""
    pass


@food99.command("sincronizar")
@click.argument("order_id")
@with_appcontext
def food99_sincronizar(order_id):
    """
    Busca um pedido pelo order_id e cria o Pedido local, caso ainda não
    exista. Uso manual/temporário até confirmarmos com o suporte do 99Food
    o mecanismo automático de notificação de pedidos novos (o swagger.yaml
    oficial não documenta polling nem webhook de pedido).
    """
    from app.models import Food99Credencial
    from app.food99 import service, client

    cred = Food99Credencial.query.filter_by(ativa=True).first()
    if not cred:
        click.echo("ℹ️  Integração 99Food não configurada. Nada a fazer.")
        return

    try:
        pedido = service.sincronizar_pedido(cred, order_id)
        click.echo(f"✅ Pedido sincronizado: {pedido.numero} (id={pedido.id})")
    except client.Food99ApiError as e:
        click.echo(f"❌ Erro ao sincronizar pedido {order_id}: {e}")