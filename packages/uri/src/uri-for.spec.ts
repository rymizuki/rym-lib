import { describe, expect, it } from 'vitest'

import { uriFor } from './uri-for'

describe('uriFor', () => {
  describe('プレースホルダーを含むテンプレートの場合', () => {
    it('params の値でプレースホルダーを置換する', () => {
      expect(uriFor('/users/{id}', { id: '1' })).toBe('/users/1')
    })

    it('複数のプレースホルダーをすべて置換し、末尾のスラッシュを除く', () => {
      expect(uriFor('/a/{x}/b/{y}/', { x: '1', y: '2' })).toBe('/a/1/b/2')
    })

    it('params に値が無いプレースホルダーは空文字に置換し、末尾のスラッシュを除く', () => {
      expect(uriFor('/users/{id}', {})).toBe('/users')
    })
  })

  describe('テンプレートで使われない params がある場合', () => {
    it('残りをクエリ文字列として付ける', () => {
      expect(uriFor('/users/{id}', { id: '1', q: 'a' })).toBe('/users/1?q=a')
    })
  })

  describe('プレースホルダーが入れ子のように崩れている場合', () => {
    it('波括弧を含まない最も内側の名前だけを置換する', () => {
      expect(uriFor('/{a{b}', { b: 'x' })).toBe('/{ax')
    })
  })

  describe('閉じない波括弧が大量に続く入力の場合', () => {
    it('100ms 未満で、入力をそのまま返す', () => {
      const input = '{'.repeat(50_000)

      const startedAt = performance.now()
      const result = uriFor(input)
      const elapsed = performance.now() - startedAt

      expect(result).toBe(input)
      expect(elapsed).toBeLessThan(100)
    })
  })
})
