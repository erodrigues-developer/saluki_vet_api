# Saluki Vet API

API em NestJS para gestão da clínica veterinária. Inclui CRUDs versionados, validação global, Swagger em `/docs` e seeds para subir dados de exemplo rapidamente.

## Migrations e seeds

- Subir schema: `npm run migrate` (inclui `src/database/migrations/1720560000002-CreateSpeciesTable.ts`).
- Popular dados iniciais: `npm run seed` (insere clientes e espécies: Cachorro, Gato, Coelho).
- Configuração do datasource: `src/database/datasource.ts`.

## CRUD de Species

Base path: `/api/v1/species`

- `POST /api/v1/species` – cria espécie. Body:
  ```json
  { "name": "Cachorro" }
  ```
- `GET /api/v1/species` – lista com filtros, ordenação e paginação. Query:
  - `name` (string, busca parcial case-insensitive)
  - `page` (number, default 1)
  - `limit` (number, default 10)
  - `sortBy` (`name | createdAt | updatedAt`, default `createdAt`)
  - `sortDirection` (`asc | desc`, default `desc`)
  Exemplo: `GET /api/v1/species?name=ga&sortBy=name&sortDirection=asc&page=1&limit=5`
  Resposta:
  ```json
  {
    "data": [{ "id": 2, "name": "Gato", "createdAt": "...", "updatedAt": "..." }],
    "meta": { "total": 1, "page": 1, "limit": 5 }
  }
  ```
- `GET /api/v1/species/:id` – retorna espécie por ID.
- `PATCH /api/v1/species/:id` – atualiza campos (hoje apenas `name`).
- `DELETE /api/v1/species/:id` – remove a espécie (HTTP 204 em caso de sucesso).

## Testes

- Rodar specs da feature: `npm test -- --runInBand species`
- Jest roda em `src/**/*.spec.ts`.
