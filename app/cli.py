import click
import secrets
from datetime import date, timedelta
from flask.cli import with_appcontext
from app import db

def registrar_comandos(app):
    app.cli.add_command(licenca, name="licenca")
    app.cli.add_command(setup, name="setup")

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