export type Events = { [name: string]: any }

export type AsyncObserverCallback<Props extends { [prop: string]: any } = any> =
  (props: Props) => Promise<void>

export class EventEmitter<E extends Events = any> {
  private listeners: { name: keyof E; fn: AsyncObserverCallback }[] = []

  async emit<N extends keyof E = keyof E, P extends E[N] = E[N]>(
    name: N,
    props: P,
  ) {
    for await (const listener of this.listeners) {
      if (listener.name !== name) continue
      await listener.fn(props)
    }
  }

  public on<N extends keyof E = keyof E, P extends E[N] = E[N]>(
    name: N,
    fn: AsyncObserverCallback<P>,
  ) {
    this.listeners.push({ name, fn })
    return this
  }
}
