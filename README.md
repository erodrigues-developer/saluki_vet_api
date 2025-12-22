# Saluki Vet API

API em NestJS para gestão da clínica veterinária. Inclui CRUDs versionados, validação global, Swagger em `/docs` e seeds para subir dados de exemplo rapidamente.

## Migrations e seeds

- Subir schema: `npm run migrate` (inclui `src/database/migrations/1720560000002-CreateSpeciesTable.ts`, `src/database/migrations/1720560000003-CreateBreedsTable.ts` e `src/database/migrations/1720560000004-CreatePetsTable.ts`).
- Popular dados iniciais: `npm run seed` (insere clientes, espécies, raças e pets vinculados).
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

## CRUD de Breeds

Base path: `/api/v1/breeds`

- `POST /api/v1/breeds` – cria raça. Body:
  ```json
  { "name": "Bulldog", "speciesId": 1 }
  ```
- `GET /api/v1/breeds` – lista com filtros, ordenação e paginação. Query:
  - `name` (string, busca parcial case-insensitive)
  - `speciesId` (number)
  - `page` (number, default 1)
  - `limit` (number, default 10)
  - `sortBy` (`name | speciesId | createdAt | updatedAt`, default `createdAt`)
  - `sortDirection` (`asc | desc`, default `desc`)
  Exemplo: `GET /api/v1/breeds?speciesId=1&name=bull&sortBy=name&sortDirection=asc&page=1&limit=5`
  Resposta:
  ```json
  {
    "data": [
      {
        "id": 2,
        "name": "Bulldog Francês",
        "speciesId": 1,
        "species": { "id": 1, "name": "Cachorro" },
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "meta": { "total": 1, "page": 1, "limit": 5 }
  }
  ```
- `GET /api/v1/breeds/:id` – retorna raça por ID (inclui `species` com `id` e `name`).
- `PATCH /api/v1/breeds/:id` – atualiza campos (`name`, `speciesId`), retornando raça com `species` populado.
- `DELETE /api/v1/breeds/:id` – remove a raça (HTTP 204 em caso de sucesso).

## CRUD de Pets

Base path: `/api/v1/pets`

- `POST /api/v1/pets` – cria pet. Body:
  ```json
  { "name": "Thor", "clientId": 1, "speciesId": 1, "breedId": 1, "microchipCode": "MC-THOR-001" }
  ```
- `GET /api/v1/pets` – lista com filtros, ordenação e paginação. Query:
  - `name` (string, busca parcial case-insensitive)
  - `clientId` (number)
  - `microchipCode` (string, busca parcial)
  - `page` (number, default 1)
  - `limit` (number, default 10)
  - `sortBy` (`name | clientId | microchipCode | createdAt | updatedAt`, default `createdAt`)
  - `sortDirection` (`asc | desc`, default `desc`)
  Exemplo: `GET /api/v1/pets?clientId=1&name=th&sortBy=name&sortDirection=asc&page=1&limit=5`
  Resposta:
  ```json
  {
    "data": [
      {
        "id": 1,
        "name": "Thor",
        "clientId": 1,
        "speciesId": 1,
        "breedId": 1,
        "microchipCode": "MC-THOR-001",
        "client": { "id": 1, "name": "Maria Souza" },
        "species": { "id": 1, "name": "Cachorro" },
        "breed": { "id": 1, "name": "Vira-lata" }
      }
    ],
    "meta": { "total": 1, "page": 1, "limit": 5 }
  }
  ```
- `GET /api/v1/pets/:id` – retorna pet por ID (inclui `client`, `species` e `breed`).
- `PATCH /api/v1/pets/:id` – atualiza campos e retorna pet com `client`, `species` e `breed`.
- `DELETE /api/v1/pets/:id` – remove o pet (soft delete, HTTP 204).

## Testes

- Rodar specs das features: `npm test -- --runInBand species breeds pets`
- Jest roda em `src/**/*.spec.ts`.
