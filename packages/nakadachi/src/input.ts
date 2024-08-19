import { InputPort } from './interfaces'

export class Input implements InputPort {
  constructor(private _attr: InputPort) {}

  get params() {
    return this._attr.params
  }

  get queries() {
    return this._attr.queries
  }

  get body() {
    return this._attr.body
  }

  get method() {
    return this._attr.method
  }

  get url() {
    return this._attr.url
  }

  get headers() {
    return this._attr.headers
  }
}
