# @rym-lib/exception

It's Exception base class.

## Installation

```
npm i @rym-lib/exception
```

## Usage

```ts
import { Exception } from '@rym-lib/exception'

export class NotFoundPageException extends Exception {
  constructor(public uri: string) {
    super(`Not found page "${uri}".`)
  }
}
```
