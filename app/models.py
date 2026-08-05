from datetime import datetime, timezone
from flask_login import UserMixin
from app import db, bcrypt


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    senha = db.Column(db.String(128), nullable=False)
    cargo = db.Column(db.String(50), nullable=False, default="cliente")
    # cargos: dono | administracao | gerente | atendente | motoboy | cliente
    telefone = db.Column(db.String(20))
    cpf = db.Column(db.String(14), nullable=False, unique=True)
    nascimento = db.Column(db.Date, nullable=True)
    ativo = db.Column(db.Boolean, default=True)
    criado_em = db.Column(db.DateTime, default=datetime.now(timezone.utc))


    pedidos = db.relationship("Pedido", foreign_keys="Pedido.user_id", backref="cliente", lazy=True)
    enderecos = db.relationship("Endereco", backref="usuario", lazy=True)
    

    def set_senha(self, senha_texto):
        self.senha = bcrypt.generate_password_hash(senha_texto).decode("utf-8")

    def check_senha(self, senha_texto):
        return bcrypt.check_password_hash(self.senha, senha_texto)
    
    def eh_funcionario(self):
        return self.cargo in ["dono","administração","gerente","atendente","motoboy"]
    
    def tem_permissao(self, cargo_minino):
        hierarquia = ["cliente", "motoboy","atendente", "gerente", "administracao", "dono"]
        return hierarquia.index(self.cargo) >= hierarquia.index(cargo_minino)
    
    def __repr__(self):
        return f"User {self.email} [{self.cargo}]"
    

class Endereco(db.Model):
    __tablename__ = "enderecos"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    apelido = db.Column(db.String(50))   # "Casa", "Trabalho", "Casa da mãe"...
    cep = db.Column(db.String(9),    nullable=False)
    logradouro = db.Column(db.String(255),  nullable=False)
    numero= db.Column(db.String(10),   nullable=False)
    complemento = db.Column(db.String(120),  nullable=True)
    bairro = db.Column(db.String(120),  nullable=False)
    cidade = db.Column(db.String(120),  nullable=False)
    estado = db.Column(db.String(2),    nullable=False)
    referencia = db.Column(db.String(255),  nullable=True)
    principal = db.Column(db.Boolean,      default=False)
    # principal = True → endereço padrão do cliente

    def __repr__(self):
        return f"<Endereco {self.apelido} - {self.logradouro}, {self.numero}>"   


class Categoria(db.Model):
    __tablename__ = "categorias"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(80), nullable=False)
    ativa = db.Column(db.Boolean, default=True)

    produtos = db.relationship("Produto", backref="categoria", lazy=True)


class Produto(db.Model):
    __tablename__ = "produtos"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), nullable=False)
    descricao = db.Column(db.Text)
    preco = db.Column(db.Numeric(10, 2), nullable=False)
    disponivel = db.Column(db.Boolean, default=True)
    categoria_id = db.Column(db.Integer, db.ForeignKey("categorias.id"))
    imagem_url = db.Column(db.String(255), nullable=True)
    criado_em = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Produto {self.nome}>"
    
class ProdutoCusto(db.Model):
    """
    Histórico de custos de cada produto.
    Cada vez que o custo muda, cria-se um novo registro com nova vigência.
    O custo vigente é sempre o de maior data_vigencia <= hoje.
    """
    __tablename__ = "produto_custos"
 
    id             = db.Column(db.Integer, primary_key=True)
    produto_id     = db.Column(db.Integer, db.ForeignKey("produtos.id"), nullable=False)
    custo_unitario = db.Column(db.Numeric(10, 2), nullable=False)
    data_vigencia  = db.Column(db.Date, nullable=False)   # a partir de quando vale
    observacao     = db.Column(db.String(255))            # ex: "Reajuste fornecedor Ago/26"
    criado_em      = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
 
    produto = db.relationship("Produto", backref=db.backref("custos", lazy=True, order_by="ProdutoCusto.data_vigencia.desc()"))
 
    

class Pedido(db.Model):
    __tablename__ = "pedidos"

    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.String(20), nullable=False, unique=True)
    cliente_nome = db.Column(db.String(120))
    total = db.Column(db.Numeric(10, 2), default=0)
    forma_pagamento = db.Column(db.String(30))
    observacoes = db.Column(db.String(255), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    criado_em = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # ─── Origem do pedido (interno x marketplaces) ─────────────
    origem = db.Column(db.String(20), nullable=False, default="interno")
    # origem: interno | ifood
    ifood_order_id = db.Column(db.String(64), nullable=True, unique=True)
    ifood_display_id = db.Column(db.String(20), nullable=True)

    # ─── 99Food ─────────────────────────────────
    food99_order_id = db.Column(db.String(64), nullable=True, unique=True)
    food99_display_id = db.Column(db.String(20), nullable=True)

    status = db.Column(db.String(30), default="aguardando")
    # aguardando | em_preparo | pronto | saiu_entrega | cheguei

    entregue = db.Column(db.Boolean, default=None, nullable=True)
    motivo_nao_entrega = db.Column(db.String(255), nullable=True)

    endereco_cep = db.Column(db.String(9))
    endereco_logradouro = db.Column(db.String(255))
    endereco_numero = db.Column(db.String(10))
    endereco_complemento = db.Column(db.String(120))
    endereco_bairro = db.Column(db.String(120))
    endereco_cidade = db.Column(db.String(120))
    endereco_estado = db.Column(db.String(2))
    endereco_referencia = db.Column(db.String(255))
    
    itens = db.relationship("ItemPedido", backref="pedido", lazy=True)

    motoboy_id             = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    distancia_km           = db.Column(db.Numeric(6, 2), nullable=True)
    taxa_entrega_cobrada   = db.Column(db.Numeric(10, 2), nullable=True)
    valor_repasse_motoboy  = db.Column(db.Numeric(10, 2), nullable=True)

    # Relacionamento
    motoboy = db.relationship("User", foreign_keys=[motoboy_id])


class ItemPedido(db.Model):
    __tablename__ = "itens_pedido"

    id = db.Column(db.Integer, primary_key=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey("pedidos.id"), nullable=False)
    produto_id = db.Column(db.Integer, db.ForeignKey("produtos.id"), nullable=True)
    quantidade = db.Column(db.Integer, nullable=False, default=1)
    preco_unitario = db.Column(db.Numeric(10, 2), nullable=False)

    # Usado quando o item vem de um marketplace e ainda não tem
    # correspondência com um Produto do catálogo interno.
    nome_externo = db.Column(db.String(200), nullable=True)

    produto = db.relationship("Produto")

    @property
    def nome(self):
        return self.produto.nome if self.produto else (self.nome_externo or "Item sem descrição")

    @property
    def subtotal(self):
        return self.quantidade * self.preco_unitario
    

class Licenca(db.Model):
    __tablename__ = "licencas"

    id       = db.Column(db.Integer, primary_key=True)
    chave    = db.Column(db.String(64), unique=True, nullable=False)
    empresa  = db.Column(db.String(120), nullable=False)
    validade = db.Column(db.Date, nullable=False)
    plano    = db.Column(db.String(30), nullable=False, default="basico")
    # planos: basico | profissional | enterprise
    ativa    = db.Column(db.Boolean, default=True)
    criada_em = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def expirada(self):
        from datetime import date
        return date.today() > self.validade

    def __repr__(self):
        return f"<Licenca {self.empresa} - {self.validade}>"
    

class Empresa(db.Model):
    """Cadastro central dos dados do restaurante/comércio (Dados Empresa)."""
    __tablename__ = "empresas"

    id            = db.Column(db.Integer, primary_key=True)
    razao_social  = db.Column(db.String(200), nullable=False)
    nome_fantasia = db.Column(db.String(150), nullable=False)
    cnpj          = db.Column(db.String(18), nullable=False, unique=True)
    telefone      = db.Column(db.String(20))
    email         = db.Column(db.String(120))
    cep           = db.Column(db.String(9))
    logradouro    = db.Column(db.String(255))
    numero        = db.Column(db.String(10))
    bairro        = db.Column(db.String(120))
    cidade        = db.Column(db.String(120))
    estado        = db.Column(db.String(2))
    taxa_por_km   = db.Column(db.Numeric(10, 2), default=0.00)
    ativo         = db.Column(db.Boolean, default=True)

    # White-label
    wl_nome_sistema   = db.Column(db.String(100))
    wl_cor_primaria   = db.Column(db.String(7), default="#C41E1E")
    wl_cor_secundaria = db.Column(db.String(7), default="#0F0A0A")
    wl_logo_url       = db.Column(db.String(255))
    wl_dominio        = db.Column(db.String(100))
    wl_suporte_email  = db.Column(db.String(120))
    wl_suporte_fone   = db.Column(db.String(20))
    wl_rodape_texto   = db.Column(db.String(255))


class MotoboyDetalhe(db.Model):
    """Cadastro de Motoboy (Dados complementares para users com cargo 'motoboy')."""
    __tablename__ = "motoboy_detalhes"

    id             = db.Column(db.Integer, primary_key=True)
    user_id        = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    cnh            = db.Column(db.String(20), unique=True)
    placa_veiculo  = db.Column(db.String(10))
    modelo_veiculo = db.Column(db.String(50))

    usuario = db.relationship("User", backref=db.backref("detalhes_motoboy", uselist=False))


class FormaPagamento(db.Model):
    """Cadastro de Meio de Pagamento (Pix, Cartão, Dinheiro)."""
    __tablename__ = "formas_pagamento"

    id                        = db.Column(db.Integer, primary_key=True)
    nome                      = db.Column(db.String(50), nullable=False)
    taxa_operadora_percentual = db.Column(db.Numeric(5, 2), default=0)
    dias_para_recebimento     = db.Column(db.Integer, default=0)
    ativo                     = db.Column(db.Boolean, default=True)


class Banco(db.Model):
    """Cadastro de Bancos."""
    __tablename__ = "bancos"

    id              = db.Column(db.Integer, primary_key=True)
    nome            = db.Column(db.String(100), nullable=False)
    codigo_febraban = db.Column(db.String(10), nullable=True)


class Fornecedor(db.Model):
    """Cadastro de Fornecedores."""
    __tablename__ = "fornecedores"

    id       = db.Column(db.Integer, primary_key=True)
    nome     = db.Column(db.String(150), nullable=False)
    telefone = db.Column(db.String(20), nullable=True)
    email    = db.Column(db.String(120), nullable=True)
    cnpj     = db.Column(db.String(18), nullable=True, unique=True)
    ativo    = db.Column(db.Boolean, default=True)


class TransacaoFinanceira(db.Model):
    """Centraliza Contas a Pagar, Contas a Receber, Despesas e Receitas. Alimenta todo o módulo de relatórios financeiros do ERP."""
    __tablename__ = "transacoes_financeiras"

    id                 = db.Column(db.Integer, primary_key=True)
    tipo               = db.Column(db.String(20), nullable=False)
    # 'RECEITA' ou 'DESPESA'
    categoria          = db.Column(db.String(50), nullable=False)
    descricao          = db.Column(db.String(255), nullable=False)
    valor_total        = db.Column(db.Numeric(10, 2), nullable=False)
    data_vencimento    = db.Column(db.Date, nullable=False)
    data_pagamento     = db.Column(db.Date, nullable=True)
    status             = db.Column(db.String(20), default="pendente")
    # 'pendente' | 'pago' | 'cancelado'
    pedido_id          = db.Column(db.Integer, db.ForeignKey("pedidos.id"), nullable=True)
    forma_pagamento_id = db.Column(db.Integer, db.ForeignKey("formas_pagamento.id"), nullable=True)
    banco_id           = db.Column(db.Integer, db.ForeignKey("bancos.id"), nullable=True)
    fornecedor_id      = db.Column(db.Integer, db.ForeignKey("fornecedores.id"), nullable=True)
    favorecido_id      = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    criado_em          = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    favorecido         = db.relationship("User", foreign_keys=[favorecido_id])


class IfoodCredencial(db.Model):
    """
    Credenciais e token de acesso da integração com o iFood (Merchant API).
    Uma instalação (empresa) tem uma única loja/merchant conectada.
    """
    __tablename__ = "ifood_credenciais"

    id               = db.Column(db.Integer, primary_key=True)
    client_id        = db.Column(db.String(120), nullable=False)
    client_secret    = db.Column(db.String(255), nullable=False)
    merchant_id      = db.Column(db.String(64), nullable=False)

    access_token     = db.Column(db.Text, nullable=True)
    token_expira_em  = db.Column(db.DateTime, nullable=True)

    ativa            = db.Column(db.Boolean, default=True)
    ultimo_polling_em = db.Column(db.DateTime, nullable=True)
    criado_em        = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    atualizado_em    = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    @property
    def token_valido(self):
        if not self.access_token or not self.token_expira_em:
            return False
        expira = self.token_expira_em
        if expira.tzinfo is None:
            # SQLite não preserva timezone: o valor volta "naive" do banco
            # depois de um commit, mesmo tendo sido salvo como UTC-aware.
            expira = expira.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) < expira

    def __repr__(self):
        return f"<IfoodCredencial merchant={self.merchant_id}>"


class IfoodEventoProcessado(db.Model):
    """
    Registro de deduplicação: cada evento do iFood (webhook ou polling) só
    deve gerar efeito uma vez no sistema, mesmo se for entregue mais de uma vez.
    """
    __tablename__ = "ifood_eventos_processados"

    id           = db.Column(db.Integer, primary_key=True)
    evento_id    = db.Column(db.String(64), nullable=False, unique=True)
    tipo         = db.Column(db.String(50), nullable=True)
    order_id     = db.Column(db.String(64), nullable=True)
    processado_em = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


class Food99Credencial(db.Model):
    """
    Credenciais e token de acesso da integração com o 99Food.

    ⚠️ Modelo de autenticação real da DiDi/99Food (confirmado via swagger.yaml
    oficial, NÃO é o padrão Open Delivery que havíamos assumido antes):
    - app_id + app_secret: credenciais do APLICATIVO, cadastradas no portal
      developer-food.99app.com.
    - app_shop_id: identificador da LOJA escolhido por nós (livre, é o "seu"
      identificador da loja no seu sistema).
    - Antes de qualquer chamada funcionar, a loja precisa AUTORIZAR o app:
      o dono acessa a URL retornada por /v1/auth/authorizationpage/getUrl e
      confirma manualmente o vínculo. Só depois disso o auth_token pode ser
      obtido via /v1/auth/authtoken/get.
    - auth_token é passado em toda chamada (query param em GET, campo no
      body em POST) — NÃO é um header "Authorization: Bearer ..." como no
      iFood.
    """
    __tablename__ = "food99_credenciais"

    id               = db.Column(db.Integer, primary_key=True)
    app_id           = db.Column(db.String(50), nullable=False)
    app_secret       = db.Column(db.String(255), nullable=False)
    app_shop_id      = db.Column(db.String(255), nullable=False)
    base_url         = db.Column(db.String(255), nullable=False,
                                  default="https://openapi.didi-food.com")

    auth_token       = db.Column(db.Text, nullable=True)
    token_expira_em  = db.Column(db.DateTime, nullable=True)
    autorizada       = db.Column(db.Boolean, default=False)

    ativa            = db.Column(db.Boolean, default=True)
    criado_em        = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    atualizado_em    = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    @property
    def token_valido(self):
        if not self.auth_token or not self.token_expira_em:
            return False
        expira = self.token_expira_em
        if expira.tzinfo is None:
            expira = expira.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) < expira



class Food99EventoProcessado(db.Model):
    """
    Deduplicação de eventos/notificações do 99Food.
    """
    __tablename__ = "food99_eventos_processados"

    id            = db.Column(db.Integer, primary_key=True)
    evento_id     = db.Column(db.String(64), nullable=False, unique=True)
    tipo          = db.Column(db.String(50), nullable=True)
    order_id      = db.Column(db.String(64), nullable=True)
    processado_em = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


class Food99WebhookLog(db.Model):
    """
    Log bruto de tudo que chegar em POST /99food/webhook.

    ⚠️ Temporário/diagnóstico: ainda não sabemos o formato real do payload
    que o 99Food envia (não documentado no swagger.yaml). Este model guarda
    o corpo cru de cada chamada para inspecionarmos assim que o primeiro
    webhook real chegar, e então adaptarmos app/food99/service.py para
    processar automaticamente em vez de só logar.
    """
    __tablename__ = "food99_webhook_logs"

    id          = db.Column(db.Integer, primary_key=True)
    headers     = db.Column(db.Text, nullable=True)
    corpo_bruto = db.Column(db.Text, nullable=True)
    recebido_em = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))    