# query-module-pagination

## Installation

```
npm i @rym-lib/query-module-pagination
```

## Usage

### for Spec

```ts
import { defineQuery } from '@rym-lib/query-module'
import { pagination } from '@rym-lib/query-module-patination'

import { driver, Driver } from '~/your-driver'

type Data = {}

export const query = defineQuery<Data, Driver>(driver, {
  source: (builder) => builder.from('user'),
  rules: {},
  middleware: [
    pagination({
      defaultRows: 20,
    }),
  ],
})
```

### for finding

```ts
const result = await query.many({
  page: 1,
  rows: 20,
})

console.log(result.items)
console.log(result.pagination) // { current: 1, rows: 20, hasNext: true or false }
```
