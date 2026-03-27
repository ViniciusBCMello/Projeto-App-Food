# 📋 Documentação da API — ZentraFood

**Base URL produção:** `https://projeto-app-food.onrender.com`  
**Base URL local:** `http://127.0.0.1:5000`

Todas as rotas (exceto `/auth/login`) exigem o header:
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## 🔐 1. Autenticação — `/auth`

### POST `/auth/login`
Realiza o login e retorna o token JWT.

**Body:**
```json
{
    "email": "admin@sistema.com",
    "senha": "admin1234"
}
```

**Resposta 200:**
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
        "id": 1,
        "nome": "Administrador",
        "email": "admin@sistema.com",
        "cargo": "dono"
    }
}
```

**Resposta 401:**
```json
{ "erro": "E-mail ou senha incorretos." }
```

---

### GET `/auth/me`
Retorna os dados do usuário logado.

**Resposta 200:**
```json
{
    "id": 1,
    "nome": "Administrador",
    "email": "admin@sistema.com",
    "cargo": "dono"
}
```

---

## 👥 2. Usuários — `/usuarios`

### GET `/usuarios/`
Lista todos os usuários. Filtro opcional por cargo.

**Permissão:** `dono`, `gerente`, `administracao`

**Query params:** `?cargo=motoboy`

**Cargos disponíveis:** `dono` `administracao` `gerente` `atendente` `motoboy` `cliente`

**Resposta 200:**
```json
[
    {
        "id": 1,
        "nome": "Administrador",
        "email": "admin@sistema.com",
        "cargo": "dono",
        "telefone": "71999990000",
        "cpf": "00000000000",
        "ativo": true,
        "criado_em": "2026-03-01T00:00:00"
    }
]
```

---

### GET `/usuarios/<id>`
Detalhe de um usuário.

**Permissão:** `dono`, `gerente`, `administracao`

**Resposta 200:**
```json
{
    "id": 2,
    "nome": "Carlos Motoboy",
    "email": "carlos@restaurante.com",
    "cargo": "motoboy",
    "telefone": "71988880000",
    "cpf": "98765432100",
    "ativo": true,
    "criado_em": "2026-03-01T00:00:00",
    "motoboy": {
        "cnh": "12345678900",
        "placa_veiculo": "ABC-1234",
        "modelo_veiculo": "Honda CG 160"
    }
}
```

---

### POST `/usuarios/`
Cria um novo funcionário.

**Permissão:** `dono`

**Body:**
```json
{
    "nome": "João Atendente",
    "email": "joao@restaurante.com",
    "senha": "senha123",
    "cpf": "123.456.789-00",
    "cargo": "atendente",
    "telefone": "71999990000"
}
```

**Body para motoboy** (campos adicionais):
```json
{
    "nome": "Carlos Motoboy",
    "email": "carlos@restaurante.com",
    "senha": "senha123",
    "cpf": "987.654.321-00",
    "cargo": "motoboy",
    "telefone": "71988880000",
    "cnh": "12345678900",
    "placa_veiculo": "ABC-1234",
    "modelo_veiculo": "Honda CG 160"
}
```

**Resposta 201:** objeto completo do usuário criado.

**Erros comuns:**
```json
{ "erro": "CPF inválido." }
{ "erro": "E-mail inválido." }
{ "erro": "E-mail já cadastrado." }
{ "erro": "Senha deve ter ao menos 8 caracteres." }
```

---

### PUT `/usuarios/<id>`
Edita um usuário.

**Permissão:** `dono`

**Body** (todos opcionais):
```json
{
    "nome": "João Silva",
    "telefone": "71999990001",
    "cargo": "gerente",
    "senha": "novasenha123",
    "ativo": true
}
```

**Resposta 200:** objeto completo atualizado.

---

### PATCH `/usuarios/<id>/toggle-ativo`
Ativa ou desativa um usuário.

**Permissão:** `dono`

**Resposta 200:**
```json
{ "mensagem": "Usuário desativado.", "ativo": false }
```

---

### GET `/usuarios/perfil`
Ver o próprio perfil.

**Permissão:** qualquer usuário logado.

**Resposta 200:** objeto do usuário logado.

---

### PUT `/usuarios/perfil`
Editar o próprio perfil.

**Permissão:** qualquer usuário logado.

**Body** (todos opcionais):
```json
{
    "nome": "Novo Nome",
    "telefone": "71999990000",
    "senha": "novasenha123"
}
```

**Resposta 200:** objeto atualizado do usuário.

---

## 🗂️ 3. Categorias — `/produtos/categorias`

### GET `/produtos/categorias`
Lista todas as categorias ativas.

**Permissão:** qualquer usuário logado.

**Resposta 200:**
```json
[
    { "id": 1, "nome": "Lanches", "ativa": true },
    { "id": 2, "nome": "Bebidas", "ativa": true }
]
```

---

### POST `/produtos/categorias`
Cria uma categoria.

**Permissão:** `dono`, `gerente`

**Body:**
```json
{ "nome": "Sobremesas" }
```

**Resposta 201:**
```json
{ "id": 3, "nome": "Sobremesas" }
```

**Resposta 400:**
```json
{ "erro": "Categoria já existe." }
```

---

### PUT `/produtos/categorias/<id>`
Edita uma categoria.

**Permissão:** `dono`, `gerente`

**Body:**
```json
{
    "nome": "Sobremesas e Doces",
    "ativa": true
}
```

**Resposta 200:**
```json
{ "id": 3, "nome": "Sobremesas e Doces" }
```

---

### DELETE `/produtos/categorias/<id>`
Exclui uma categoria.

**Permissão:** `dono`

**Resposta 200:**
```json
{ "mensagem": "Categoria excluída." }
```

**Resposta 400:**
```json
{ "erro": "Categoria possui produtos vinculados." }
```

---

## 📦 4. Produtos — `/produtos`

### GET `/produtos/`
Lista todos os produtos.

**Permissão:** qualquer usuário logado.

**Query params:** `?categoria_id=1`

**Resposta 200:**
```json
[
    {
        "id": 1,
        "nome": "Hamburguer Clássico",
        "descricao": "Pão, carne 180g e queijo",
        "preco": 25.90,
        "disponivel": true,
        "categoria_id": 1,
        "categoria": "Lanches",
        "imagem_url": "/produtos/uploads/abc123.jpg"
    }
]
```

---

### GET `/produtos/<id>`
Detalhe de um produto.

**Permissão:** qualquer usuário logado.

**Resposta 200:** objeto completo do produto.

**Resposta 404:**
```json
{ "erro": "Produto não encontrado." }
```

---

### POST `/produtos/`
Cria um produto.

**Permissão:** `dono`, `gerente`

**Body:** `multipart/form-data` (não JSON)

| Campo | Tipo | Obrigatório |
|---|---|---|
| nome | Text | ✅ |
| preco | Text | ✅ |
| descricao | Text | ❌ |
| categoria_id | Text | ❌ |
| disponivel | Text (`true`/`false`) | ❌ |
| imagem | File | ❌ |

**Resposta 201:**
```json
{ "id": 1, "nome": "Hamburguer Clássico" }
```

---

### PUT `/produtos/<id>`
Edita um produto.

**Permissão:** `dono`, `gerente`

**Body:** `multipart/form-data` — mesmos campos do POST, todos opcionais.

**Resposta 200:**
```json
{ "id": 1, "nome": "Hamburguer Duplo" }
```

---

### DELETE `/produtos/<id>`
Exclui um produto.

**Permissão:** `dono`

**Resposta 200:**
```json
{ "mensagem": "Produto excluído." }
```

---

### GET `/produtos/uploads/<filename>`
Retorna a imagem do produto.

**Permissão:** pública, sem token.

---

## 📍 5. Endereços — `/enderecos`

### GET `/enderecos/`
Lista os endereços do usuário logado.

**Resposta 200:**
```json
[
    {
        "id": 1,
        "apelido": "Casa",
        "cep": "41000-000",
        "logradouro": "Rua das Flores",
        "numero": "123",
        "complemento": "Apto 201",
        "bairro": "Centro",
        "cidade": "Salvador",
        "estado": "BA",
        "referencia": "Próximo ao mercado",
        "principal": true
    }
]
```

---

### POST `/enderecos/`
Adiciona um novo endereço.

**Body:**
```json
{
    "apelido":     "Casa",
    "cep":         "41000-000",
    "logradouro":  "Rua das Flores",
    "numero":      "123",
    "complemento": "Apto 201",
    "bairro":      "Centro",
    "cidade":      "Salvador",
    "estado":      "BA",
    "referencia":  "Próximo ao mercado",
    "principal":   true
}
```

**Campos obrigatórios:** `cep`, `logradouro`, `numero`, `bairro`, `cidade`, `estado`

**Resposta 201:**
```json
{
    "id": 1,
    "apelido": "Casa",
    "logradouro": "Rua das Flores",
    "numero": "123",
    "principal": true
}
```

---

### PUT `/enderecos/<id>`
Edita um endereço.

**Body:** qualquer campo do POST, todos opcionais.

**Resposta 200:**
```json
{ "id": 1, "apelido": "Casa Nova" }
```

---

### DELETE `/enderecos/<id>`
Remove um endereço. Não é possível remover o principal.

**Resposta 200:**
```json
{ "mensagem": "Endereço excluído." }
```

**Resposta 400:**
```json
{ "erro": "Não é possível excluir o endereço principal." }
```

---

### PATCH `/enderecos/<id>/principal`
Define como endereço principal.

**Resposta 200:**
```json
{ "mensagem": "Endereço principal atualizado." }
```

---

## 🛒 6. Pedidos — `/pedidos`

### POST `/pedidos/`
Cria um novo pedido.

**Permissão:** `cliente`

**Body:**
```json
{
    "endereco_id": 1,
    "forma_pagamento": "pix",
    "observacoes": "Sem cebola",
    "itens": [
        { "produto_id": 1, "quantidade": 2 },
        { "produto_id": 3, "quantidade": 1 }
    ]
}
```

**Resposta 201:**
```json
{
    "id": 1,
    "numero": "20260305-0001",
    "status": "aguardando",
    "total": 77.70,
    "forma_pagamento": "pix",
    "observacoes": "Sem cebola",
    "entregue": null,
    "motivo_nao_entrega": null,
    "endereco": {
        "logradouro": "Rua das Flores",
        "numero": "123",
        "complemento": "Apto 201",
        "bairro": "Centro",
        "cidade": "Salvador",
        "estado": "BA",
        "referencia": "Próximo ao mercado"
    },
    "cliente": {
        "id": 2,
        "nome": "João Silva",
        "telefone": "71999990000"
    },
    "itens": [
        {
            "id": 1,
            "produto_id": 1,
            "produto_nome": "Hamburguer",
            "quantidade": 2,
            "preco_unitario": 25.90,
            "subtotal": 51.80
        }
    ],
    "criado_em": "2026-03-05T21:00:00"
}
```

**Erros comuns:**
```json
{ "erro": "O pedido precisa ter ao menos um item." }
{ "erro": "Forma de pagamento é obrigatória." }
{ "erro": "Produto id=2 indisponível." }
```

---

### GET `/pedidos/`
Lista pedidos. Cliente vê só os seus, funcionários veem todos.

**Query params:** `?status=aguardando`

**Status disponíveis:** `aguardando` `em_preparo` `pronto` `saiu_entrega` `cheguei` `cancelado`

**Resposta 200:** lista de objetos no mesmo formato do POST.

---

### GET `/pedidos/<id>`
Detalhe de um pedido.

**Resposta 200:** objeto completo do pedido.

**Resposta 404:**
```json
{ "erro": "Pedido não encontrado." }
```

---

### PATCH `/pedidos/<id>/status`
Atualiza o status do pedido.

**Permissão:** funcionários

**Body:**
```json
{ "status": "em_preparo" }
```

**Resposta 200:** objeto completo atualizado.

---

### PATCH `/pedidos/<id>/entrega`
Finaliza a entrega.

**Permissão:** `motoboy`, `dono`, `gerente`

**Body — entregue:**
```json
{ "entregue": true }
```

**Body — não entregue:**
```json
{
    "entregue": false,
    "motivo": "Cliente não atendeu"
}
```

**Resposta 200:** objeto completo com `entregue` e `motivo_nao_entrega` atualizados.

---

### PATCH `/pedidos/<id>/cancelar`
Cancela um pedido.

**Regras:** cliente só cancela o próprio com status `aguardando`. Funcionários cancelam qualquer um.

**Resposta 200:**
```json
{
    "mensagem": "Pedido cancelado.",
    "numero": "20260305-0001"
}
```

---

## 🏢 7. Empresa — `/empresa`

### GET `/empresa/`
Dados da empresa e configurações white-label.

**Permissão:** qualquer usuário logado.

**Resposta 200:**
```json
{
    "id": 1,
    "razao_social": "Restaurante Exemplo LTDA",
    "nome_fantasia": "Restaurante Exemplo",
    "cnpj": "00.000.000/0001-00",
    "telefone": "71999990000",
    "email": "contato@restaurante.com",
    "taxa_por_km": 1.50,
    "distancia_gratuita": 1.0,
    "ativo": true,
    "wl_nome_sistema": "MeuDelivery",
    "wl_cor_primaria": "#C41E1E",
    "wl_cor_secundaria": "#0F0A0A",
    "wl_logo_url": "https://cdn.exemplo.com/logo.png",
    "wl_dominio": "meudelivery.com.br",
    "wl_suporte_email": "suporte@meudelivery.com.br",
    "wl_suporte_fone": "71999990000",
    "wl_rodape_texto": "© 2026 Restaurante Exemplo."
}
```

---

### POST `/empresa/`
Cadastro inicial — onboarding.

**Permissão:** `dono`, `administracao`

**Body:**
```json
{
    "razao_social":  "Restaurante Exemplo LTDA",
    "nome_fantasia": "Restaurante Exemplo",
    "cnpj":          "00.000.000/0001-00",
    "email":         "contato@restaurante.com",
    "telefone":      "71999990000",
    "cep":           "41000-000",
    "logradouro":    "Rua das Flores",
    "numero":        "100",
    "bairro":        "Centro",
    "cidade":        "Salvador",
    "estado":        "BA",
    "taxa_por_km":   1.50
}
```

**Resposta 201:** objeto completo da empresa.

---

### PUT `/empresa/`
Edita os dados da empresa.

**Permissão:** `dono`, `administracao`

**Body:** qualquer campo do POST, todos opcionais.

**Resposta 200:** objeto completo atualizado.

---

### PUT `/empresa/white-label`
Configura identidade visual — time comercial Zentra.

**Permissão:** `dono`, `administracao`

**Body** (todos opcionais):
```json
{
    "wl_nome_sistema":   "MeuDelivery",
    "wl_cor_primaria":   "#C41E1E",
    "wl_cor_secundaria": "#0F0A0A",
    "wl_logo_url":       "https://cdn.exemplo.com/logo.png",
    "wl_dominio":        "meudelivery.com.br",
    "wl_suporte_email":  "suporte@meudelivery.com.br",
    "wl_suporte_fone":   "71999990000",
    "wl_rodape_texto":   "© 2026 Restaurante Exemplo."
}
```

**Resposta 200:** objeto completo com white-label atualizado.

---

### GET `/empresa/taxa-entrega`
Retorna taxa configurada. Com `distancia_km` calcula o valor da entrega.

**Query params:** `?distancia_km=3.5`

**Resposta 200:**
```json
{
    "taxa_por_km": 1.50,
    "distancia_gratuita": 1.0,
    "distancia_km": 3.5,
    "valor_entrega": 5.25,
    "calculo": "3.5km × R$1.50 = R$5.25",
    "info": "Entregas até 1.0km são gratuitas."
}
```

---

### PUT `/empresa/taxa-entrega`
Atualiza a taxa por km.

**Permissão:** `dono`, `gerente`

**Body:**
```json
{ "taxa_por_km": 2.00 }
```

**Resposta 200:**
```json
{
    "mensagem": "Taxa atualizada com sucesso.",
    "taxa_por_km": 2.00,
    "info": "Entregas abaixo de 1.0km continuam gratuitas."
}
```

---

### GET `/empresa/formas-pagamento`
Lista formas de pagamento configuradas.

**Resposta 200:**
```json
[
    {
        "id": 1,
        "nome": "Pix",
        "taxa_operadora_percentual": 0.99,
        "dias_para_recebimento": 0,
        "ativo": true
    }
]
```

---

### POST `/empresa/formas-pagamento`
Cria uma forma de pagamento.

**Permissão:** `dono`, `administracao`

**Body:**
```json
{
    "nome": "Pix",
    "taxa_operadora_percentual": 0.99,
    "dias_para_recebimento": 0
}
```

**Resposta 201:** objeto da forma criada.

---

### PUT `/empresa/formas-pagamento/<id>`
Edita uma forma de pagamento.

**Permissão:** `dono`, `administracao`

**Body** (todos opcionais):
```json
{
    "nome": "Pix Instantâneo",
    "taxa_operadora_percentual": 0.79,
    "dias_para_recebimento": 0,
    "ativo": true
}
```

**Resposta 200:** objeto atualizado.

---

### DELETE `/empresa/formas-pagamento/<id>`
Exclui uma forma de pagamento.

**Permissão:** `dono`, `administracao`

**Resposta 200:**
```json
{ "mensagem": "Forma de pagamento excluída." }
```

---

## 💰 8. Financeiro — `/financeiro`

### GET `/financeiro/receitas`
Lista receitas com filtros.

**Permissão:** `dono`, `gerente`, `administracao`

**Query params:** `?status=pendente&categoria=Pedido&de=2026-03-01&ate=2026-03-31`

**Resposta 200:**
```json
{
    "total": 1250.00,
    "quantidade": 15,
    "categorias": ["Pedido", "Outros"],
    "itens": [
        {
            "id": 1,
            "tipo": "RECEITA",
            "categoria": "Pedido",
            "descricao": "Pedido #20260305-0001",
            "valor_total": 77.70,
            "data_vencimento": "2026-03-05",
            "data_pagamento": "2026-03-05",
            "status": "pago",
            "pedido_id": 1,
            "favorecido_nome": null,
            "criado_em": "2026-03-05T21:00:00"
        }
    ]
}
```

---

### POST `/financeiro/receitas`
Cadastra uma receita.

**Permissão:** `dono`, `gerente`, `administracao`

**Body:**
```json
{
    "descricao": "Venda balcão",
    "valor_total": 150.00,
    "categoria": "Outros",
    "data_vencimento": "2026-03-27",
    "data_pagamento": "2026-03-27",
    "status": "pago",
    "forma_pagamento_id": 1
}
```

**Categorias válidas:** `Pedido`, `Outros`

**Resposta 201:** objeto completo da transação.

---

### GET `/financeiro/despesas`
Lista despesas com filtros.

**Permissão:** `dono`, `gerente`, `administracao`

**Query params:** `?status=pendente&categoria=Aluguel&de=2026-03-01&ate=2026-03-31`

**Resposta 200:**
```json
{
    "total": 3500.00,
    "quantidade": 8,
    "categorias": ["Acerto Motoboy", "Compra Insumos", "Aluguel", "Funcionário", "Manutenção", "Marketing", "Outros"],
    "itens": [...]
}
```

---

### POST `/financeiro/despesas`
Cadastra uma despesa.

**Permissão:** `dono`, `gerente`, `administracao`

**Body:**
```json
{
    "descricao": "Aluguel março 2026",
    "valor_total": 2500.00,
    "categoria": "Aluguel",
    "data_vencimento": "2026-03-10",
    "status": "pendente"
}
```

**Categorias válidas:** `Acerto Motoboy`, `Compra Insumos`, `Aluguel`, `Funcionário`, `Manutenção`, `Marketing`, `Outros`

**Resposta 201:** objeto completo da transação.

---

### GET `/financeiro/movimentos`
Visão consolidada com saldo.

**Permissão:** `dono`, `gerente`, `administracao`

**Query params:** `?tipo=DESPESA&status=pendente&de=2026-03-01&ate=2026-03-31`

**Resposta 200:**
```json
{
    "resumo": {
        "receitas": 5000.00,
        "despesas": 3200.00,
        "saldo": 1800.00,
        "situacao": "positivo"
    },
    "quantidade": 23,
    "itens": [...]
}
```

---

### GET `/financeiro/movimentos/<id>`
Detalhe de uma transação.

**Resposta 404:**
```json
{ "erro": "Transação não encontrada." }
```

---

### PUT `/financeiro/movimentos/<id>`
Edita uma transação.

**Permissão:** `dono`, `administracao`

**Body** (todos opcionais):
```json
{
    "descricao": "Aluguel março — corrigido",
    "valor_total": 2600.00,
    "categoria": "Aluguel",
    "data_vencimento": "2026-03-15"
}
```

---

### PATCH `/financeiro/movimentos/<id>/pagar`
Marca como paga.

**Permissão:** `dono`, `gerente`, `administracao`

**Body** (opcional):
```json
{
    "data_pagamento": "2026-03-27",
    "banco_id": 1
}
```

**Resposta 200:** objeto com `status: "pago"` atualizado.

---

### PATCH `/financeiro/movimentos/<id>/cancelar`
Cancela uma transação.

**Permissão:** `dono`, `administracao`

**Resposta 200:**
```json
{ "mensagem": "Transação cancelada.", "id": 1 }
```

---

### GET `/financeiro/movimentos/<id>/recibo`
Gera recibo em JSON. Apenas transações pagas. Base para PDF futuro.

**Permissão:** `dono`, `gerente`, `administracao`

**Resposta 200:**
```json
{
    "recibo": {
        "numero": "REC-000001",
        "emitido_em": "2026-03-27T19:00:00",
        "tipo": "RECEITA",
        "status": "pago"
    },
    "emitente": {
        "razao_social": "Restaurante Exemplo LTDA",
        "nome_fantasia": "Restaurante Exemplo",
        "cnpj": "00.000.000/0001-00",
        "endereco": "Rua das Flores, 100 — Salvador/BA"
    },
    "transacao": {
        "id": 1,
        "categoria": "Pedido",
        "descricao": "Pedido #20260305-0001",
        "valor_total": 77.70,
        "data_vencimento": "2026-03-05",
        "data_pagamento": "2026-03-05"
    },
    "favorecido": { "nome": "João Silva" },
    "observacao": "Documento gerado eletronicamente. Válido como comprovante de pagamento."
}
```

**Resposta 400:**
```json
{ "erro": "Recibo só pode ser gerado para transações pagas." }
```

---

### GET `/financeiro/acerto-motoboy`
Lista acertos de motoboy registrados.

**Permissão:** `dono`, `gerente`, `administracao`

**Resposta 200:** lista de transações `DESPESA / Acerto Motoboy`.

---

### POST `/financeiro/acerto-motoboy`
Calcula e registra o repasse com base nas entregas do período.

**Permissão:** `dono`, `gerente`, `administracao`

**Body:**
```json
{
    "motoboy_id": 3,
    "de": "2026-03-01",
    "ate": "2026-03-27"
}
```

**Resposta 201:**
```json
{
    "transacao_id": 12,
    "motoboy": "Carlos Motoboy",
    "periodo": { "de": "2026-03-01", "ate": "2026-03-27" },
    "total_entregas": 42,
    "total_km": 187.50,
    "taxa_por_km": 1.50,
    "total_repasse": 281.25,
    "status": "pendente",
    "detalhes": [
        {
            "pedido_numero": "20260305-0001",
            "distancia_km": 3.5,
            "valor_repasse": 5.25
        }
    ]
}
```

---

### GET `/financeiro/resumo`
Saldo do período com breakdown por categoria.

**Permissão:** `dono`, `gerente`, `administracao`

**Query params:** `?de=2026-03-01&ate=2026-03-31`

> Padrão: mês atual.

**Resposta 200:**
```json
{
    "periodo": { "de": "2026-03-01", "ate": "2026-03-31" },
    "receitas": {
        "pagas":    5000.00,
        "pendente": 800.00,
        "total":    5800.00
    },
    "despesas": {
        "pagas":    3200.00,
        "pendente": 600.00,
        "total":    3800.00,
        "por_categoria": {
            "Aluguel":        2500.00,
            "Acerto Motoboy":  400.00,
            "Compra Insumos":  300.00
        }
    },
    "saldo": {
        "realizado": 1800.00,
        "previsto":  200.00,
        "situacao":  "positivo"
    }
}
```

---

## 🔒 9. Permissões por cargo

| Recurso | cliente | atendente | motoboy | gerente | administracao | dono |
|---|---|---|---|---|---|---|
| Login | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver produtos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Criar/editar produto | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Excluir produto | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Criar pedido | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver pedidos | próprios | todos | todos | todos | todos | todos |
| Atualizar status pedido | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Finalizar entrega | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Cancelar pedido | próprio* | ✅ | ❌ | ✅ | ✅ | ✅ |
| Gerenciar endereços | próprios | ❌ | ❌ | ❌ | ❌ | ❌ |
| Criar usuários | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Ver usuários | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Dados da empresa | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Editar empresa / white-label | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Atualizar taxa entrega | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Financeiro — ver | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Financeiro — criar/editar | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Financeiro — cancelar | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Acerto motoboy | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

> *cliente só cancela pedido próprio com status `aguardando`

---

## 📌 Fluxo de Status do Pedido

```
aguardando → em_preparo → pronto → saiu_entrega → cheguei
     ↓
  cancelado (qualquer etapa, por funcionário)
```

## 📌 Fluxo de Status Financeiro

```
pendente → pago
pendente → cancelado
pago     → cancelado  (apenas dono / administracao)
```