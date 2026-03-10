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
    criador_em = db.Column(db.DateTime, default=datetime.now(timezone.utc))


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
    

class Pedido(db.Model):
    __tablename__ = "pedidos"

    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.String(20), nullable=False, unique=True)
    cliente_nome = db.Column(db.String(120))
    total = db.Column(db.Numeric(10, 2), default=0)
    forma_pagamento = db.Column(db.String(30))
    observacoes = db.Column(db.String(255), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    criado_em = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

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
    produto_id = db.Column(db.Integer, db.ForeignKey("produtos.id"), nullable=False)
    quantidade = db.Column(db.Integer, nullable=False, default=1)
    preco_unitario = db.Column(db.Numeric(10, 2), nullable=False)

    produto = db.relationship("Produto")

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