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

- eq (automatically handles raw SQL expressions)
- ne (automatically handles raw SQL expressions)
- contains
- not_contains
- lte
- lt
- gte
- gt
- in (automatically handles raw SQL expressions)

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

### Automatic Raw SQL Expression Support

The query module automatically detects and handles raw SQL expressions in filter conditions. You can use CASE-WHEN statements and other complex SQL expressions with standard operators:

```ts
const query = defineQuery<Data, QueryDriverPrisma>(driver, {
  source: (builder) =>
    builder
      .from('users', 'u')
      .leftJoin('user_profiles', 'p', 'u.id = p.user_id')
      .column('u.id')
      .column('u.name')
      .column('u.status')
      .column(
        unescape(`
        CASE
          WHEN u.status = 'active' THEN 'Active User'
          WHEN u.status = 'pending' THEN 'Pending User'
          ELSE 'Inactive User'
        END
        `),
        'status_display',
      )
      .column(
        unescape(`
        CASE
          WHEN p.category = 'premium' AND u.status = 'active' THEN 'gold'
          WHEN p.category = 'premium' THEN 'silver'
          ELSE 'bronze'
        END
        `),
        'user_tier',
      ),
  rules: {
    id: 'u.id',
    name: 'u.name',
    status: 'u.status',
    // Use CASE-WHEN expressions as filter targets
    status_display: unescape(`
      CASE
        WHEN u.status = 'active' THEN 'Active User'
        WHEN u.status = 'pending' THEN 'Pending User'
        ELSE 'Inactive User'
      END
    `),
    user_tier: unescape(`
      CASE
        WHEN p.category = 'premium' AND u.status = 'active' THEN 'gold'
        WHEN p.category = 'premium' THEN 'silver'
        ELSE 'bronze'
      END
    `),
  },
})

// Filter by CASE-WHEN result using standard operators
const activeUsers = await query.many({
  filter: {
    status_display: { eq: 'Active User' }, // Automatically handles raw SQL expression
  },
})

// Filter with multiple values
const premiumUsers = await query.many({
  filter: {
    user_tier: { in: ['gold', 'silver'] }, // Automatically handles raw SQL expression
  },
})

// Combine with regular filters
const activeBasicUsers = await query.many({
  filter: {
    status_display: { eq: 'Active User' }, // Raw SQL expression
    name: { contains: 'John' }, // Regular field filter
  },
})
```

#### Automatic Detection

The query module automatically detects raw SQL expressions by checking for SQL keywords such as:
- `CASE`, `WHEN`, `THEN`, `ELSE`, `END`
- Function names like `CONCAT`, `COALESCE`, `SUBSTRING`, `LENGTH`
- Aggregate functions like `COUNT`, `SUM`, `AVG`, `MAX`, `MIN`
- String functions like `UPPER`, `LOWER`, `TRIM`
- Operators and parentheses `(`, `)`, `+`, `-`, `*`, `/`

When a raw SQL expression is detected, the field is automatically wrapped in parentheses for safe SQL generation. Regular field names are handled normally without additional wrapping.

## Middleware

- [pagination](https://www.npmjs.com/package/@rym-lib/query-module-pagination)
