# 📋 Documentação da API — Mesa Verde

Base URL: `http://localhost:5000`

Todas as rotas (exceto `/auth/login`) exigem o header:
```
Authorization: Bearer <token>
```

---

## 🔐 Autenticação — `/auth`

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

## 📦 Produtos — `/produtos`

### GET `/produtos/`
Lista todos os produtos. Filtro opcional por categoria.

**Query params:** `?categoria_id=1`

**Resposta 200:**
```json
[
    {
        "id": 1,
        "nome": "Hamburguer",
        "descricao": "Pão, carne e queijo",
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
Retorna detalhe de um produto.

**Resposta 200:**
```json
{
    "id": 1,
    "nome": "Hamburguer",
    "descricao": "Pão, carne e queijo",
    "preco": 25.90,
    "disponivel": true,
    "categoria_id": 1,
    "categoria": "Lanches",
    "imagem_url": "/produtos/uploads/abc123.jpg"
}
```

**Resposta 404:**
```json
{ "erro": "Produto não encontrado." }
```

---

### POST `/produtos/`
Cria um novo produto. Requer cargo: `dono` ou `gerente`.

**Body (form-data):**
| Campo | Tipo | Obrigatório |
|---|---|---|
| nome | Text | ✅ |
| preco | Text | ✅ |
| descricao | Text | ❌ |
| categoria_id | Text | ❌ |
| disponivel | Text (true/false) | ❌ |
| imagem | File | ❌ |

**Resposta 201:**
```json
{ "id": 1, "nome": "Hamburguer" }
```

---

### PUT `/produtos/<id>`
Edita um produto. Requer cargo: `dono` ou `gerente`.

**Body (form-data):** mesmos campos do POST.

**Resposta 200:**
```json
{ "id": 1, "nome": "Hamburguer Duplo" }
```

---

### DELETE `/produtos/<id>`
Exclui um produto. Requer cargo: `dono`.

**Resposta 200:**
```json
{ "mensagem": "Produto excluído." }
```

---

### GET `/produtos/uploads/<filename>`
Retorna a imagem do produto. Rota pública, sem token.

---

## 🗂️ Categorias — `/produtos/categorias`

### GET `/produtos/categorias`
Lista todas as categorias ativas.

**Resposta 200:**
```json
[
    { "id": 1, "nome": "Lanches" },
    { "id": 2, "nome": "Bebidas" }
]
```

---

### POST `/produtos/categorias`
Cria uma categoria. Requer cargo: `dono` ou `gerente`.

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
Edita uma categoria. Requer cargo: `dono` ou `gerente`.

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
Exclui uma categoria. Requer cargo: `dono`.

**Resposta 200:**
```json
{ "mensagem": "Categoria excluída." }
```

**Resposta 400:**
```json
{ "erro": "Categoria possui produtos vinculados." }
```

---

## 📍 Endereços — `/enderecos`

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
Adiciona um novo endereço para o usuário logado.

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

Campos obrigatórios: `cep`, `logradouro`, `numero`, `bairro`, `cidade`, `estado`.

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
Edita um endereço do usuário logado.

**Body:** qualquer campo do POST.

**Resposta 200:**
```json
{ "id": 1, "apelido": "Casa Nova" }
```

---

### DELETE `/enderecos/<id>`
Remove um endereço. Não é possível remover o endereço principal.

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
Define um endereço como principal. Desmarca o anterior automaticamente.

**Resposta 200:**
```json
{ "mensagem": "Endereço principal atualizado." }
```

---

## 🛒 Pedidos — `/pedidos`

### POST `/pedidos/`
Cria um novo pedido. Apenas clientes.

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
        },
        {
            "id": 2,
            "produto_id": 3,
            "produto_nome": "Refrigerante",
            "quantidade": 1,
            "preco_unitario": 7.90,
            "subtotal": 7.90
        }
    ],
    "criado_em": "2026-03-05T21:00:00"
}
```

---

### GET `/pedidos/`
Lista pedidos. Cliente vê só os seus. Funcionários veem todos.

**Query params:** `?status=aguardando`

**Status disponíveis:** `aguardando` `em_preparo` `pronto` `saiu_entrega` `cheguei` `cancelado`

**Resposta 200:** lista de objetos no mesmo formato do POST acima.

---

### GET `/pedidos/<id>`
Detalhe de um pedido. Cliente só vê o próprio.

**Resposta 200:** objeto no mesmo formato do POST acima.

**Resposta 404:**
```json
{ "erro": "Pedido não encontrado." }
```

---

### PATCH `/pedidos/<id>/status`
Atualiza o status do pedido. Apenas funcionários.

**Body:**
```json
{ "status": "em_preparo" }
```

**Resposta 200:** objeto completo do pedido atualizado.

**Resposta 400:**
```json
{ "erro": "Status inválido. Use: ['aguardando', 'em_preparo', 'pronto', 'saiu_entrega', 'cheguei']" }
```

---

### PATCH `/pedidos/<id>/entrega`
Finaliza a entrega. Apenas motoboy.

**Body — entrega realizada:**
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

**Resposta 200:** objeto completo do pedido atualizado.

---

### PATCH `/pedidos/<id>/cancelar`
Cancela um pedido.
- Cliente: só cancela o próprio pedido e apenas com status `aguardando`.
- Funcionários: cancelam qualquer pedido.

**Resposta 200:**
```json
{
    "mensagem": "Pedido cancelado.",
    "numero": "20260305-0001"
}
```

**Resposta 400:**
```json
{ "erro": "Pedido não pode mais ser cancelado." }
```

---

## 🔒 Permissões por cargo

| Rota | cliente | atendente | gerente | dono |
|---|---|---|---|---|
| Login | ✅ | ✅ | ✅ | ✅ |
| Ver produtos | ✅ | ✅ | ✅ | ✅ |
| Criar/editar produto | ❌ | ❌ | ✅ | ✅ |
| Excluir produto | ❌ | ❌ | ❌ | ✅ |
| Criar pedido | ✅ | ❌ | ❌ | ❌ |
| Ver pedidos | próprios | todos | todos | todos |
| Atualizar status pedido | ❌ | ✅ | ✅ | ✅ |
| Finalizar entrega | ❌ (motoboy) | ❌ | ❌ | ❌ |
| Cancelar pedido | próprio (aguardando) | ✅ | ✅ | ✅ |
| Gerenciar endereços | próprios | ❌ | ❌ | ❌ |
