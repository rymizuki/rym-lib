export interface Item {
  label: string
  value: string
}

export interface LoaderFunction {
  (value: string): Promise<Item[]>
}

export interface CandidateTextFieldChangeHandler {
  (item: Item): void
}

export type { Item as CandidateTextFieldChangeValue }
