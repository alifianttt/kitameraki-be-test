# TaskApp — Azure Functions Back-End

A TypeScript Azure Functions v4 back-end that manages **Tasks** and **Form Settings** using Azure Cosmos DB.

---

## Project Structure

```
src/
├── index.ts                   # Entry point — registers all functions
├── functions/                 # One file per HTTP trigger (or logical group)
│   ├── GetTasks.ts
│   ├── GetTask.ts
│   ├── InsertTask.ts
│   ├── UpdateTask.ts
│   ├── DeleteTask.ts
│   ├── BulkDeleteTasks.ts
│   └── FormSettings.ts        # GetFormSettings, UpsertFormSettings, DeleteFormSettings
├── services/                  # Business logic & data access
│   ├── cosmosClient.ts        # Singleton CosmosDB client
│   ├── taskService.ts
│   └── formSettingsService.ts
├── middleware/                # Cross-cutting concerns
│   ├── response.ts            # HTTP response helpers + error handler wrapper
│   └── validation.ts          # Query param & body validation
├── models/                    # TypeScript domain types
│   ├── task.ts
│   └── formSettings.ts
└── utils/
    └── config.ts              # Environment variable loading (fails fast if missing)
```

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18 LTS or 20 LTS | Required by Azure Functions v4 |
| Azure Functions Core Tools | v4 | `npm install -g azure-functions-core-tools@4 --unsafe-perm true` |
| Azure Cosmos DB Emulator | Latest | For local development |

---

## Running Locally

### 1 — Install dependencies

```bash
npm install
```

### 2 — Start the Cosmos DB Emulator

#### Windows
Launch **Azure Cosmos DB Emulator** from the Start menu, or run:
```powershell
& "C:\Program Files\Azure Cosmos DB Emulator\Microsoft.Azure.Cosmos.Emulator.exe"
```

#### macOS / Linux (Docker)
```bash
docker run \
  --name cosmos-emulator \
  -p 8081:8081 \
  -p 10250-10255:10250-10255 \
  -e AZURE_COSMOS_EMULATOR_PARTITION_COUNT=3 \
  -e AZURE_COSMOS_EMULATOR_ENABLE_DATA_PERSISTENCE=true \
  mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator
```

> **Important (Docker):** The emulator uses a self-signed TLS certificate.  
> `NODE_TLS_REJECT_UNAUTHORIZED=0` in `local.settings.json` disables certificate validation for local development only. **Remove this in production.**

### 3 — Create the Cosmos DB database and containers

Once the emulator is running, open the **Data Explorer** at `https://localhost:8081/_explorer/index.html` and create:

| Database | Container | Partition Key |
|----------|-----------|---------------|
| `TaskApp` | `Tasks` | `/organizationId` |
| `TaskApp` | `FormSettings` | `/organizationId` |

Or use the Azure CLI / Cosmos SDK in a setup script.

### 4 — Configure environment variables

`local.settings.json` is pre-populated for the emulator and is already in `.gitignore`. No changes needed for local dev.

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "NODE_TLS_REJECT_UNAUTHORIZED": "0",
    "COSMOS_ENDPOINT": "https://localhost:8081",
    "COSMOS_KEY": "<emulator-key>",
    "COSMOS_DATABASE": "TaskApp",
    "COSMOS_TASKS_CONTAINER": "Tasks",
    "COSMOS_SETTINGS_CONTAINER": "FormSettings"
  }
}
```

> For **production**, set these values as Application Settings in the Azure Portal — never commit real credentials.

### 5 — Start the Functions host

```bash
npm start
```

This runs `npm run clean && npm run build && func start` automatically.

You should see output like:
```
Functions:
  GetTasks:            [GET]  http://localhost:7071/api/GetTasks
  GetTask:             [GET]  http://localhost:7071/api/GetTask
  InsertTask:          [POST] http://localhost:7071/api/InsertTask
  UpdateTask:          [PATCH] http://localhost:7071/api/UpdateTask
  DeleteTask:          [DELETE] http://localhost:7071/api/DeleteTask
  BulkDeleteTasks:     [DELETE] http://localhost:7071/api/BulkDeleteTasks
  GetFormSettings:     [GET]  http://localhost:7071/api/GetFormSettings
  UpsertFormSettings:  [POST] http://localhost:7071/api/UpsertFormSettings
  DeleteFormSettings:  [DELETE] http://localhost:7071/api/DeleteFormSettings
```
PLEASE INSERT TASK FIRST BECAUSE IT NEED ORGANIZATION ID
---

## API Reference

All endpoints are relative to `http://localhost:7071/api`.

### Tasks

#### `GET /GetTasks?organizationId={id}`
Returns all tasks for an organisation.

**Response `200`**
```json
[
  {
    "id": "uuid",
    "organizationId": "uuid",
    "title": "Fix login bug",
    "status": "in-progress",
    "priority": "high",
    "tags": ["backend"]
  }
]
```

---

#### `GET /GetTask?id={taskId}&organizationId={id}`
Returns a single task.

**Response `200`** — task object  
**Response `404`** — task not found

---

#### `POST /InsertTask`
Creates a new task. `id` is auto-generated (UUID v4).

**Body**
```json
{
  "organizationId": "uuid",
  "title": "Write unit tests",
  "status": "todo",
  "priority": "medium",
  "dueDate": "2025-12-31T23:59:00Z",
  "tags": ["testing"]
}
```

**Required fields:** `organizationId`, `title`, `status`  
**Response `201`** — created task object

---

#### `PATCH /UpdateTask?id={taskId}&organizationId={id}`
Partially updates a task (only the provided fields are changed).

**Body**
```json
{
  "status": "completed",
  "priority": "low"
}
```

**Response `200`** — updated task object

---

#### `DELETE /DeleteTask?id={taskId}&organizationId={id}`
Deletes a single task.

**Response `200`**

---

#### `DELETE /BulkDeleteTasks?organizationId={id}`
Deletes multiple tasks concurrently.

**Body**
```json
["task-uuid-1", "task-uuid-2", "task-uuid-3"]
```

**Response `200`**

---

### Form Settings

Settings are stored per organisation (one document per `organizationId`).

#### `GET /GetFormSettings?organizationId={id}`
Returns the form settings for an organisation.

**Response `200`**
```json
{
  "id": "org-uuid",
  "organizationId": "org-uuid",
  "settings": {
    "theme": "dark",
    "defaultPriority": "medium"
  },
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

**Response `404`** — no settings found

---

#### `POST /UpsertFormSettings?organizationId={id}`
Creates or replaces form settings for an organisation.

**Body**
```json
{
  "settings": {
    "theme": "dark",
    "defaultPriority": "medium",
    "allowedStatuses": ["todo", "in-progress", "completed"]
  }
}
```

**Response `201`** — upserted settings object

---

#### `DELETE /DeleteFormSettings?organizationId={id}`
Deletes the form settings document for an organisation.

**Response `200`**

---

## Key Improvements Over Original

| Area | Before | After |
|------|--------|-------|
| **Security** | Connection string hard-coded in source | All secrets read from environment variables via `config.ts`; app fails fast if any are missing |
| **SQL Injection** | String interpolation in Cosmos query | Parameterised query (`@orgId`) |
| **Concurrency** | `forEach` + `async` (fire-and-forget, errors silently dropped) | `Promise.all` in `bulkDeleteTasks` — all errors are surfaced |
| **Error handling** | Unhandled rejections crash the function | `withErrorHandler` wrapper catches all errors; client always gets a structured response |
| **Validation** | None | `requireQueryParams` and `requireJsonBody` return `400` with a clear message |
| **HTTP methods** | `UpdateTask` used `POST` | Changed to `PATCH` (semantically correct for partial updates) |
| **ID generation** | Client must supply `id` on insert | Server auto-generates UUID v4 |
| **CosmosDB client** | New `CosmosClient` on every invocation | Singleton — reuses TCP connection across warm invocations |
| **Separation of concerns** | Logic mixed into handler | Handlers → Services → CosmosClient layers |
| **New feature** | — | Full CRUD for `FormSettings` (`GetFormSettings`, `UpsertFormSettings`, `DeleteFormSettings`) |
