# query-module-driver-sequelize

Query module's Driver for [Sequelize](https://github.com/sequelize/sequelize)

## Installation

```
npm i @rym-lib/query-module
npm i @rym-lib/query-module-driver-sequelize
```

## Usage

```ts
import { SequelizeQueryDriver } from '@rym-lib/query-module-driver-sequelize'

import { sequelize } from '~/sequelize'

export const driver = new SequelizeQueryDriver(sequelize)
```
