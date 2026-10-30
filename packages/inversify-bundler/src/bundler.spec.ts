import 'reflect-metadata'

import { Container, injectable } from 'inversify'
import { describe, expect, it } from 'vitest'

import { Bundler } from './bundler'
import { createModule } from './create-module'

@injectable()
class Clock {}

@injectable()
class Logger {}

const ClockModule = createModule('Clock', Clock, [], { singleton: true })
const LoggerModule = createModule('Logger', Logger, [], { singleton: true })
const UserModule = createModule('User', Clock, [
  LoggerModule.bundler,
  ClockModule.bundler,
])

function namesOf(bundler: Bundler): string[] {
  return bundler.resolve().map((module) => module.name)
}

describe('Bundler', () => {
  describe('resolve', () => {
    describe('同じ名前の Module が複数ある場合', () => {
      it('先に現れた 1 つだけを返す', () => {
        expect(
          namesOf(new Bundler(ClockModule.bundler, UserModule.bundler)),
        ).toEqual(['Clock', 'Logger', 'User'])
      })
    })
  })

  describe('exclude', () => {
    describe('除く Module に含まれる名前がある場合', () => {
      it('その名前の Module を除いた Bundler を返す', () => {
        expect(
          namesOf(new Bundler(UserModule.bundler).exclude(ClockModule.bundler)),
        ).toEqual(['Logger', 'User'])
      })

      it('除く Module が依存している Module も除く', () => {
        expect(
          namesOf(new Bundler(UserModule.bundler).exclude(UserModule.bundler)),
        ).toEqual([])
      })
    })

    describe('除く Module に含まれる名前が無い場合', () => {
      it('元と同じ Module を返す', () => {
        expect(
          namesOf(
            new Bundler(LoggerModule.bundler).exclude(ClockModule.bundler),
          ),
        ).toEqual(['Logger'])
      })
    })

    describe('親コンテナに読み込んだ Module を除いて子コンテナに読み込んだ場合', () => {
      it('子コンテナは親の singleton を返す', () => {
        const root = new Container()
        root.loadSync(...ClockModule.bundler.resolve())
        const child = new Container({ parent: root })
        child.loadSync(
          ...new Bundler(UserModule.bundler)
            .exclude(ClockModule.bundler)
            .resolve(),
        )

        expect(child.get(ClockModule.identifier)).toBe(
          root.get(ClockModule.identifier),
        )
      })
    })
  })
})
