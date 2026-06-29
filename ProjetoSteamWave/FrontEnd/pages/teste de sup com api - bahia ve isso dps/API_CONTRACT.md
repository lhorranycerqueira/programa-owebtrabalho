# SteamWave Suporte — Contrato de API (Go + MongoDB)

Documento de referência para o time de backend.  
O frontend (`scriptSuporte.js`) chama estes endpoints exatamente como descrito aqui.

---

## Configuração

| Item | Valor |
|---|---|
| Base URL (dev) | `http://localhost:8080` |
| Base URL (prod) | `window.__STEAMWAVE_API_URL__` (injetado pelo servidor) |
| Autenticação | `Authorization: Bearer <JWT>` em toda rota autenticada |
| Content-Type | `application/json` |
| Banco de dados | MongoDB — coleção `tickets`, banco `steamwave` |

---

## Estrutura MongoDB

### Coleção: `tickets`

```json
{
  "_id":        "ObjectId",
  "ticket_ref": "SW-20240601-00042",   // gerado pelo Go (data + sequência)
  "user_id":    "ObjectId",            // injetado pelo middleware de auth
  "subject":    "string",
  "category":   "string",             // slug: "conta", "reembolso", etc.
  "status":     "aberto",             // "aberto" | "em-andamento" | "resolvido" | "fechado"
  "messages": [
    {
      "_id":         "ObjectId",
      "author":      "user",           // "user" | "support"
      "author_name": "string",
      "text":        "string",
      "created_at":  "ISODate"
    }
  ],
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

**Índices recomendados:**
- `{ user_id: 1, created_at: -1 }`  — listagem do usuário ordenada por data
- `{ ticket_ref: 1 }` (único)       — busca por referência
- `{ status: 1 }`                   — filtro por status

---

## Endpoints

### `POST /api/v1/tickets`
Abre um novo ticket.

**Middleware:** autenticação JWT obrigatória — `user_id` extraído do token.

**Request body:**
```json
{
  "subject":  "string (3–120 chars, required)",
  "message":  "string (10–1000 chars, required)",
  "category": "string (slug, required)"
}
```

**Response 201 Created:**
```json
{
  "id":         "64fa1c2e3b4a5c6d7e8f9012",
  "ticket_ref": "SW-20240601-00042",
  "subject":    "Problema com pagamento",
  "status":     "aberto",
  "created_at": "2024-06-01T14:32:00Z"
}
```

**Erros:**
- `400` — validação falhou → `{ "message": "O assunto deve ter pelo menos 3 caracteres." }`
- `401` — não autenticado
- `500` — erro interno

**Lógica Go:**
1. Valida o body (subject, message, category).
2. Extrai `user_id` do JWT.
3. Gera `ticket_ref`: formato `SW-YYYYMMDD-NNNNN` (sequencial, pode usar um counter no MongoDB).
4. Cria o documento com `status: "aberto"` e a primeira mensagem no array `messages`.
5. Retorna o documento criado (sem o array de mensagens completo para economizar payload).

---

### `GET /api/v1/tickets`
Lista os tickets do usuário autenticado.

**Middleware:** autenticação JWT obrigatória.

**Query params:**
| Param | Tipo | Default | Descrição |
|---|---|---|---|
| `status` | string | `""` | Filtra por status. Vazio = todos. |
| `search` | string | `""` | Busca parcial em `subject` (regex, case-insensitive). |
| `page` | int | `1` | Paginação 1-based. |
| `per_page` | int | `20` | Itens por página. |

**Response 200 OK:**
```json
{
  "tickets": [
    {
      "id":         "64fa1c2e3b4a5c6d7e8f9012",
      "ticket_ref": "SW-20240601-00042",
      "subject":    "Problema com pagamento",
      "category":   "pagamento",
      "status":     "aberto",
      "created_at": "2024-06-01T14:32:00Z",
      "updated_at": "2024-06-01T14:32:00Z"
    }
  ],
  "total": 3,
  "page":  1,
  "pages": 1
}
```

**Nota:** Não retorne o array `messages` neste endpoint — apenas metadados. O frontend só busca as mensagens em `GET /tickets/:id`.

---

### `GET /api/v1/tickets/:id`
Retorna um ticket completo (com histórico de mensagens).

**Middleware:** autenticação JWT — valide que `user_id` do token é dono do ticket.

**Parâmetro de rota:** `:id` — ObjectId hex string.

**Response 200 OK:**
```json
{
  "id":         "64fa1c2e3b4a5c6d7e8f9012",
  "ticket_ref": "SW-20240601-00042",
  "subject":    "Problema com pagamento",
  "category":   "pagamento",
  "status":     "aberto",
  "created_at": "2024-06-01T14:32:00Z",
  "updated_at": "2024-06-01T15:10:00Z",
  "messages": [
    {
      "id":          "64fa1c2e3b4a5c6d7e8f9013",
      "author":      "user",
      "author_name": "Jogador123",
      "text":        "Fui cobrado duas vezes no cartão.",
      "created_at":  "2024-06-01T14:32:00Z"
    },
    {
      "id":          "64fa1c2e3b4a5c6d7e8f9014",
      "author":      "support",
      "author_name": "Suporte SteamWave",
      "text":        "Olá! Já identificamos o problema e vamos processar o estorno.",
      "created_at":  "2024-06-01T15:10:00Z"
    }
  ]
}
```

**Erros:**
- `400` — `:id` não é um ObjectId válido
- `401` — não autenticado
- `403` — ticket pertence a outro usuário
- `404` — ticket não encontrado

---

### `POST /api/v1/tickets/:id/messages`
Adiciona uma nova mensagem a um ticket existente.

**Middleware:** autenticação JWT — valide que `user_id` do token é dono do ticket.

**Request body:**
```json
{
  "text": "string (1–1000 chars, required)"
}
```

**Response 201 Created:**
```json
{
  "message": {
    "id":          "64fa1c2e3b4a5c6d7e8f9015",
    "author":      "user",
    "author_name": "Jogador123",
    "text":        "Ainda não recebi o estorno.",
    "created_at":  "2024-06-02T09:00:00Z"
  }
}
```

**Lógica Go:**
1. Valida `text` (não vazio, ≤ 1000 chars).
2. Verifica que o ticket não está `resolvido` ou `fechado` — se estiver, retorna `409 Conflict`.
3. Usa `$push` no MongoDB para adicionar ao array `messages` e atualiza `updated_at`.

**Erros:**
- `400` — validação
- `401` — não autenticado
- `403` — não é o dono
- `404` — ticket não encontrado
- `409` — ticket fechado/resolvido (não aceita mais respostas)

---

### `GET /api/v1/tickets/categories`
Retorna as categorias disponíveis.

**Middleware:** nenhum (público) ou autenticado, a critério do time.

**Response 200 OK:**
```json
{
  "categories": [
    { "slug": "conta",     "label": "Conta e Acesso" },
    { "slug": "pagamento", "label": "Pagamento" },
    { "slug": "reembolso", "label": "Reembolso" },
    { "slug": "jogo",      "label": "Problema em Jogo" },
    { "slug": "tecnico",   "label": "Suporte Técnico" },
    { "slug": "outro",     "label": "Outro" }
  ]
}
```

**Nota:** Pode ser um array estático no Go (hardcoded) ou vir de uma coleção `categories` no MongoDB para permitir gerenciamento via painel admin futuramente. O frontend tem um fallback local caso o endpoint ainda não exista.

---

## Observações gerais

### Geração de `ticket_ref`
Sugestão de implementação Go com contador atômico no MongoDB:
```
// coleção: counters — documento: { _id: "ticket_seq", seq: <número> }
// usar FindOneAndUpdate com $inc e upsert:true
// ticket_ref = fmt.Sprintf("SW-%s-%05d", time.Now().Format("20060102"), seq)
```

### JWT e `user_id`
O campo `user_id` **nunca deve vir do body da request** — sempre do token JWT decodificado pelo middleware de autenticação Go. O frontend não envia `user_id`.

### Paginação
O frontend não implementa paginação na UI ainda, mas a API já deve suportá-la para não precisar de refactor futuro. Por padrão, `per_page=20` já é suficiente para o MVP.

### CORS
Configure o servidor Go para aceitar requisições de `localhost` em dev e do domínio de produção em prod.

### Status transitions
Recomendação de máquina de estados:
```
aberto → em-andamento → resolvido → fechado
                      ↑
              (pode voltar de resolvido para em-andamento se usuário responder)
```
