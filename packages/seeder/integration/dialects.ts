import type { SeederOptions } from '../src'
import { PrismaClient as MysqlClient } from './generated/mysql'
import { PrismaClient as PostgresClient } from './generated/postgres'

export type IntegrationClient = PostgresClient | MysqlClient

export type Dialect = {
  name: 'postgres' | 'mysql'
  createClient(): IntegrationClient
  options: SeederOptions
  tables: string[]
  createStatements: string[]
}

const POSTGRES_URL =
  process.env.SEEDER_TEST_POSTGRES_URL ??
  'postgresql://seeder_test:seeder_test@127.0.0.1:5472/seeder_test'
const MYSQL_URL =
  process.env.SEEDER_TEST_MYSQL_URL ??
  'mysql://seeder_test:seeder_test@127.0.0.1:3326/seeder_test'

const TABLES = ['nodes', 'serials', 'events', 'big_items', 'keyed', 'items']

type ColumnTypes = {
  timestamp: string
  auto_increment_pk: string
}

const createStatements = ({ timestamp, auto_increment_pk }: ColumnTypes) => [
  `CREATE TABLE items (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    created_at ${timestamp} NULL,
    updated_at ${timestamp} NULL
  )`,
  `CREATE TABLE keyed (
    code VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    updated_at ${timestamp} NULL
  )`,
  `CREATE TABLE big_items (
    id BIGINT PRIMARY KEY,
    amount BIGINT NOT NULL,
    updated_at ${timestamp} NULL
  )`,
  `CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    occurred_at ${timestamp} NOT NULL,
    updated_at ${timestamp} NULL
  )`,
  `CREATE TABLE serials (
    id ${auto_increment_pk},
    name TEXT NOT NULL
  )`,
  `CREATE TABLE nodes (
    id INTEGER PRIMARY KEY,
    parent_id INTEGER NULL REFERENCES nodes (id),
    name TEXT NOT NULL,
    updated_at ${timestamp} NULL
  )`,
]

export const postgres: Dialect = {
  name: 'postgres',
  createClient: () => new PostgresClient({ datasourceUrl: POSTGRES_URL }),
  options: { quote: '"', placeholder: '$' },
  tables: TABLES,
  createStatements: createStatements({
    timestamp: 'TIMESTAMP(3)',
    auto_increment_pk: 'SERIAL PRIMARY KEY',
  }),
}

export const mysql: Dialect = {
  name: 'mysql',
  createClient: () => new MysqlClient({ datasourceUrl: MYSQL_URL }),
  options: { quote: '`', placeholder: '?' },
  tables: TABLES,
  createStatements: createStatements({
    timestamp: 'DATETIME(3)',
    auto_increment_pk: 'INT AUTO_INCREMENT PRIMARY KEY',
  }),
}

export const dialects: Dialect[] = [postgres, mysql]
