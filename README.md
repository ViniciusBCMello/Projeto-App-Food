# Sistema White-Label B2B — Flask

Sistema de pedidos isolado por instalação, com controle de licença, RBAC e auditoria.

---

## 🚀 Setup Inicial

```bash
# 1. Clone e entre no projeto
cd whitelabel

# 2. Crie o ambiente virtual
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 3. Instale as dependências
pip install -r requirements.txt

# 4. Configure o ambiente
cp .env.example .env
# Edite .env com suas configurações

# 5. Inicialize o banco de dados
flask db init
flask db migrate -m "initial"
flask db upgrade

# 6. Instale a licença
flask licenca instalar

# 7. Popule dados iniciais (status de pedido, usuário dono)
flask setup seed

# 8. Rode o servidor
flask run
```

Acesse: http://localhost:5000
Login: admin@sistema.com / admin1234 ⚠️ *Troque a senha!*

---

## 🏗 Estrutura

```
app/
├── __init__.py          # App factory
├── auth/                # Login, logout, troca de senha
├── users/               # CRUD de usuários + papéis
├── produtos/            # CRUD de produtos e categorias
├── pedidos/             # Criação e gestão de pedidos
├── configuracoes/       # White-label (logo, cores, CNPJ)
├── relatorios/          # Vendas e auditoria
├── core/                # Dashboard, decorators, context processors
├── services/            # Lógica de negócio isolada
│   ├── audit_service.py
│   ├── licenca_service.py
│   └── pedido_service.py
├── models/              # Todos os modelos SQLAlchemy
└── templates/           # Templates Jinja2
```

---

## 🛡 Segurança

| Recurso | Implementação |
|---|---|
| Hash de senha | Flask-Bcrypt |
| RBAC | `@requer_papel("gerente")` |
| CSRF | Flask-WTF (automático) |
| Rate limit login | 10 req/min por IP |
| Auditoria | Tabela `audit_logs` |
| Sessão segura | `SESSION_COOKIE_HTTPONLY=True` |

## 👥 Papéis (hierarquia)

| Papel | Pode fazer |
|---|---|
| `dono` | Tudo, incluindo usuários e configurações |
| `gerente` | Produtos, pedidos, cancelamentos, usuários (view) |
| `financeiro` | Relatórios de vendas |
| `atendente` | Criar e acompanhar pedidos |

## 🏷 Licença

```bash
flask licenca status    # Ver status atual
flask licenca instalar  # Instalar nova licença
```

## 📊 Numeração de Pedidos

Formato automático: `YYYYMMDD-XXXX`  
Exemplo: `20250615-0042`
