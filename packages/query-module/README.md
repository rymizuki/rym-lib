# query-module

## Installation

```
npm i @rym-lib/query-module
npm i @rym-lib/query-module-driver-sequelize
```

## Usage

```ts
import { QueryDriverSequelize } from '@rym-lib/query-module-driver-sequelize'

import { driver } from '~/my-query-driver'

type Data = {
  id: string
  name: string
  displayName: string
  email: string
  thumbnailUrl: string
}

const userQuery = defineQuery<Data, QueryDriverSequelize>(driver, {
  source: (builder) =>
    builder
      .column('id')
      .column('profile.name', 'name')
      .column('profile.display_name', 'displayName')
      .column('email')
      .column('profile.thumbnail_url', 'thumbnailUrl')
      .from('users', 'user')
      .leftJoin('user_profiles', 'profile', 'user.id = profile.user_id'),
  rules: {
    id: 'user.id',
    name: 'profile.name',
    displayName: 'profile.display_name',
    email: 'user.email',
  },
})

// filter by any column value.
// can operate eq, ne, contains, gt, gte, lt, lte, in
const userList = await userQuery.many({
  filter: {
    displayName: {
      contains: 'abc',
    },
  },
})
console.log(userList.items)

// lookup single row or null
const user = await userQuery.one({
  filter: {
    id: {
      eq: '12345',
    },
  },
})
console.log(user)
```

## Docs

### Methods

#### `.many(params = {})`

filter by params, and return matching rows array or empty array.

```ts
const rows = query.many()
```

#### `.one(params = {})`

finding a record by params, when missing result, return null.

```ts
const row = query.one({
  filter: {
    id: {
      eq: 'id_1234',
    },
  },
})

if (row === null) {
  throw new Error('row not found')
}
```

### Finding parameters

The implementation of these parameters is left to the driver.

#### filter

Filter data by defined property names.

```ts
const result = await query.many({
  filter: {},
})
```

Support operators are

- eq
- ne
- contains
- not_contains
- lte
- lt
- gte
- gt
- in
- raw_eq
- raw_ne
- raw_in

#### orderBy

Specify sort order.

```ts
const result = await query.many({
  orderBy: ['created_at:desc', 'name:asc'],
})
```

#### take

Specify take rows count.

```ts
const result = await query.many({
  take: 10,
})

if (rows.length <= 10) {
  // true
}
```

#### skip

Specify thr first item to be retrieved

```ts
const result = await query.many({
  skip: 10,
})
```

## Drivers

- [sequelize](https://www.npmjs.com/package/@rym-lib/query-module-driver-sequelize)

### Raw SQL Operators

For complex expressions like CASE-WHEN statements, you can use raw SQL operators:

```ts
const query = defineQuery<Data, QueryDriverPrisma>(driver, {
  source: (builder) =>
    builder
      .from('room_message', 'm')
      .leftJoin('room_message_assistant', 'ma', 'm.id = ma.room_message_id')
      .leftJoin('room_message_user', 'mu', 'm.id = mu.room_message_id')
      .column('m.id')
      .column(
        unescape(`
        CASE
          WHEN ma.room_message_id IS NOT NULL THEN 'assistant'
          WHEN mu.room_message_id IS NOT NULL THEN 'user'
          ELSE 'developer'
        END
        `),
        'role',
      ),
  rules: {
    id: 'm.id',
    // Use CASE-WHEN expression as a filter target
    role: unescape(`
      CASE
        WHEN ma.room_message_id IS NOT NULL THEN 'assistant'
        WHEN mu.room_message_id IS NOT NULL THEN 'user'
        ELSE 'developer'
      END
    `),
  },
})

// Filter by CASE-WHEN result
const assistantMessages = await query.many({
  filter: {
    role: { raw_eq: 'assistant' }, // Filter where role is 'assistant'
  },
})

// Filter with multiple values
const activeMessages = await query.many({
  filter: {
    role: { raw_in: ['assistant', 'user'] }, // Filter where role is 'assistant' or 'user'
  },
})
```

#### Raw Operators

- `raw_eq`: Raw SQL expression equals comparison
- `raw_ne`: Raw SQL expression not equals comparison  
- `raw_in`: Raw SQL expression IN clause comparison

**Note**: When using raw operators, the field name in the filter should contain the raw SQL expression (as defined in `rules`), and the operator will wrap it in parentheses for safe SQL generation.

## Middleware

- [pagination](https://www.npmjs.com/package/@rym-lib/query-module-pagination)
