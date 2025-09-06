# @rym-lib/rdb-command

A lightweight database abstraction layer providing unified CRUD operations for relational databases.

## Installation

```bash
npm install @rym-lib/rdb-command coral-sql
```

For Prisma connector:
```bash
npm install @prisma/client
```

## Quick Start

```typescript
import { DataBase } from '@rym-lib/rdb-command'
import { PrismaConnector } from '@rym-lib/rdb-command/connector/prisma'
import { PrismaClient } from '@prisma/client'

// Setup
const prisma = new PrismaClient()
const connector = new PrismaConnector(prisma)
const logger = {
  debug: console.log,
  info: console.info,
  warning: console.warn,
  error: console.error,
  critical: console.error,
}

const db = new DataBase(connector, logger)

// Basic CRUD operations
type User = {
  id: string
  name: string
  email: string
}

// Create a record
await db.create('users', {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com'
})

// Find a record
const user = await db.find<User>('users', { id: 'user-1' })
console.log(user) // { id: 'user-1', name: 'John Doe', email: 'john@example.com' }

// Update a record
await db.update('users', { id: 'user-1' }, { name: 'Jane Doe' })

// Delete a record
await db.delete('users', { id: 'user-1' })
```

## Advanced Usage

### findOrCreate

Find a record or create it if it doesn't exist:

```typescript
const user = await db.findOrCreate<User>(
  'users',
  { email: 'john@example.com' }, // search condition
  { 
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com'
  } // data to create if not found
)
```

### updateOrCreate

Update a record or create it if it doesn't exist:

```typescript
await db.updateOrCreate(
  'users',
  { id: 'user-1' }, // search condition
  { name: 'Updated Name' }, // update data
  { 
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com'
  } // create data if not found
)
```

### Transactions

Execute multiple operations in a transaction:

```typescript
await db.txn(async (txDb) => {
  await txDb.create('orders', {
    id: 'order-1',
    userId: 'user-1',
    total: 100
  })
  
  await txDb.update('users', { id: 'user-1' }, { 
    lastOrderDate: new Date()
  })
})
```

### Middleware

Add custom middleware to preprocess SQL queries:

```typescript
const loggingMiddleware = {
  preprocess: async (payload, options, context) => {
    context.logger.info(`Executing: ${payload.sql}`)
    return payload
  }
}

db.use(loggingMiddleware)
```

## API Reference

### DataBase Class

The main class providing database operations.

#### Constructor

```typescript
new DataBase(connector: DataBaseConnectorPort, logger: DataBaseLogger, options?: SQLBuilderToSQLInputOptions)
```

- `connector`: Database connector implementation
- `logger`: Logger instance for debugging
- `options`: SQL builder options (e.g., `{ quote: null }` to disable column quoting)

#### Methods

##### `find<Row>(table: string, where: WhereType, options?: DataBaseCommandOptionsPartial): Promise<Row | null>`

Find a single record matching the where condition.

##### `create(table: string, data: Record<string, unknown>, options?: DataBaseCommandOptionsPartial): Promise<void>`

Create a new record.

##### `update(table: string, where: WhereType, data: Record<string, unknown>, options?: DataBaseCommandOptionsPartial): Promise<void>`

Update records matching the where condition.

##### `delete(table: string, where: WhereType, options?: DataBaseCommandOptionsPartial): Promise<void>`

Delete records matching the where condition.

##### `findOrCreate<Row>(table: string, where: WhereType, data: Record<string, unknown>, options?: DataBaseCommandOptionsPartial): Promise<Row>`

Find a record or create it if not found.

##### `updateOrCreate(table: string, where: WhereType, update: Record<string, unknown>, create: Record<string, unknown>, options?: DataBaseCommandOptionsPartial): Promise<void>`

Update a record or create it if not found.

##### `txn<T>(fn: (db: DataBasePort) => Promise<T>): Promise<T>`

Execute operations within a transaction.

##### `use(middleware: DataBaseMiddleware): this`

Add middleware to the database instance.

### Connectors

#### PrismaConnector

Connector for Prisma ORM integration.

```typescript
import { PrismaConnector } from '@rym-lib/rdb-command/connector/prisma'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const connector = new PrismaConnector(prisma)
```

### Custom Connectors

Implement the `DataBaseConnectorPort` interface to create custom connectors:

```typescript
interface DataBaseConnectorPort {
  execute(sql: string, replacements: unknown[]): Promise<void>
  query<T>(sql: string, replacements: unknown[]): Promise<T[]>
  transaction(exec: TransactionCallback): Promise<void>
}
```

## Configuration

### SQL Builder Options

You can configure SQL generation behavior:

```typescript
const db = new DataBase(connector, logger, {
  quote: null, // Disable column quoting
  placeholder: '?' // Use ? instead of $1, $2, etc.
})
```

## Dependencies

- **coral-sql**: SQL query builder library
- **@prisma/client**: Required when using PrismaConnector (peer dependency)

## License

MIT