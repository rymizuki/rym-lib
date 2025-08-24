import type {
  QueryRunnerMiddleware,
  QueryResultList,
  QueryRunnerCriteria,
} from '@rym-lib/query-module'

type IterateeFunction = (value: any, key: string, path: string) => any

type PathSpec = {
  path: string[]
  key: string
}

// query-moduleで使用可能なoperatorの一覧
const QUERY_OPERATORS = [
  'eq',
  'ne',
  'contains',
  'not_contains',
  'lt',
  'lte',
  'gt',
  'gte',
  'in',
] as const

/**
 * パス指定を展開してoperator付きパスの配列に変換
 * operatorが指定されていない場合は、全operatorに展開
 *
 * @param targetPaths 元のパス指定の配列
 * @returns 展開されたパス配列
 *
 * @example
 * expandPathsWithOperators(['id', 'tenant_id'])
 * // → ['id.eq', 'id.ne', 'id.contains', ..., 'tenant_id.eq', 'tenant_id.ne', ...]
 *
 * expandPathsWithOperators(['id.eq', 'units.id'])
 * // → ['id.eq', 'units.id.eq', 'units.id.ne', 'units.id.contains', ...]
 */
function expandPathsWithOperators(targetPaths: string[]): string[] {
  const expandedPaths: string[] = []

  for (const path of targetPaths) {
    // 最後のセグメントがoperatorかどうかチェック
    const segments = path.split('.')
    const lastSegment = segments[segments.length - 1]

    if (QUERY_OPERATORS.includes(lastSegment as any)) {
      // すでにoperatorが指定されている場合はそのまま追加
      expandedPaths.push(path)
    } else {
      // operatorが指定されていない場合は全operatorに展開
      for (const operator of QUERY_OPERATORS) {
        expandedPaths.push(`${path}.${operator}`)
      }
    }
  }

  return expandedPaths
}

/**
 * 値が再帰処理をスキップすべき型かどうかをチェック
 * @param value チェック対象の値
 * @returns 再帰処理をスキップすべきかどうか
 */
function shouldSkipRecursion(value: any): boolean {
  // null/undefinedの場合はスキップ
  if (value === null || value === undefined) {
    return true
  }

  // プリミティブ型の場合はスキップ
  if (typeof value !== 'object') {
    return true
  }

  // Date、RegExp、Error、その他の組み込みオブジェクトの場合はスキップ
  if (
    value instanceof Date ||
    value instanceof RegExp ||
    value instanceof Error ||
    value instanceof ArrayBuffer ||
    value instanceof DataView ||
    value instanceof Int8Array ||
    value instanceof Uint8Array ||
    value instanceof Uint8ClampedArray ||
    value instanceof Int16Array ||
    value instanceof Uint16Array ||
    value instanceof Int32Array ||
    value instanceof Uint32Array ||
    value instanceof Float32Array ||
    value instanceof Float64Array ||
    value instanceof BigInt64Array ||
    value instanceof BigUint64Array ||
    value instanceof Map ||
    value instanceof Set ||
    value instanceof WeakMap ||
    value instanceof WeakSet ||
    value instanceof Promise
  ) {
    return true
  }

  return false
}

/**
 * ドット記法のパスをパースして配列とキーに分解
 * @param pathStr ドット記法のパス（例: "units.id", "nested.items.user_id"）
 * @returns パスの配列と最終キー
 */
function parsePath(pathStr: string): PathSpec {
  const parts = pathStr.split('.')
  if (parts.length === 1) {
    // シンプルなキー（例: "id"）
    return { path: [], key: parts[0] }
  }
  // ネストされたパス（例: "units.id" -> path: ["units"], key: "id"）
  return {
    path: parts.slice(0, -1),
    key: parts[parts.length - 1],
  }
}

/**
 * パスが対象パスのいずれかと一致するかチェック
 * @param newPath 現在のパス
 * @param key 現在のキー
 * @param currentPath 親のパス
 * @param targetPaths 対象パスの配列
 * @returns マッチ結果
 */
function checkPathMatch(
  newPath: string,
  key: string,
  currentPath: string,
  targetPaths: string[],
): { shouldTransform: boolean; matchedPath: string } {
  for (const targetPath of targetPaths) {
    // 完全一致チェック
    if (newPath === targetPath) {
      return { shouldTransform: true, matchedPath: targetPath }
    }

    // ワイルドカードパスのチェック（例: "*.id" が "units.id" にマッチ）
    if (targetPath.startsWith('*.')) {
      const targetKey = targetPath.substring(2)
      if (key === targetKey) {
        return { shouldTransform: true, matchedPath: targetPath }
      }
    }

    // 配列要素のパスチェック（例: "units.id" が配列内の各要素に適用）
    const pathSpec = parsePath(targetPath)
    if (pathSpec.path.length > 0) {
      const parentPath = pathSpec.path.join('.')
      if (currentPath === parentPath && key === pathSpec.key) {
        return { shouldTransform: true, matchedPath: targetPath }
      }
    }
  }

  return { shouldTransform: false, matchedPath: '' }
}

/**
 * オブジェクトを再帰的に探索して、指定されたパスの値を変換する
 * @param obj 探索対象のオブジェクト
 * @param targetPaths 変換対象のパス指定の配列（ドット記法）
 * @param iteratee 値を変換する関数
 * @param currentPath 現在のパス（再帰用）
 * @returns 変換後のオブジェクト
 */
function transformWithPaths(
  obj: any,
  targetPaths: string[],
  iteratee: IterateeFunction,
  currentPath: string = '',
): any {
  // 再帰処理をスキップすべき型の場合はそのまま返す
  if (shouldSkipRecursion(obj)) {
    return obj
  }

  // 配列の場合は各要素を再帰的に処理
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      transformWithPaths(item, targetPaths, iteratee, currentPath),
    )
  }

  // プレーンオブジェクトの場合のみ再帰処理
  if (typeof obj === 'object') {
    const result: any = {}

    for (const [key, value] of Object.entries(obj)) {
      const newPath = currentPath ? `${currentPath}.${key}` : key

      // 現在のパスが対象パスのいずれかと一致するかチェック
      const pathMatch = checkPathMatch(newPath, key, currentPath, targetPaths)
      const shouldTransform = pathMatch.shouldTransform
      const matchedPath = pathMatch.matchedPath

      if (shouldTransform && typeof value === 'string') {
        // 文字列値の場合は変換を適用
        result[key] = iteratee(value, key, matchedPath)
      } else if (shouldTransform && Array.isArray(value)) {
        // 配列値で変換対象の場合、配列内の文字列要素を変換
        result[key] = value.map((item) => {
          if (typeof item === 'string') {
            return iteratee(item, key, matchedPath)
          }
          return item
        })
      } else if (shouldSkipRecursion(value)) {
        // 再帰処理をスキップすべき値はそのまま設定
        result[key] = value
      } else {
        // そうでない場合は再帰的に処理
        result[key] = transformWithPaths(value, targetPaths, iteratee, newPath)
      }
    }

    return result
  }

  // その他の場合はそのまま返す
  return obj
}

/**
 * 再帰的にオブジェクト内の特定パスの値を変換するinflate関数
 * ドット記法でパスを指定可能
 *
 * @param targetPaths 変換対象のパス指定の配列（ドット記法またはワイルドカード）
 * @param iteratee 値を変換する関数
 *
 * @example
 * // シンプルなキー指定
 * inflate(
 *   ['id', 'tenant_id'],
 *   (value) => obfuscator.encode(value)
 * )
 *
 * // ドット記法でのパス指定
 * inflate(
 *   ['id', 'tenant_id', 'units.id', 'staffs.id', 'staffs.user_id'],
 *   (value) => obfuscator.encode(value)
 * )
 *
 * // ワイルドカードを使った指定（すべてのネストレベルのidを処理）
 * inflate(
 *   ['*.id', '*.tenant_id'],
 *   (value) => obfuscator.encode(value)
 * )
 *
 * // 以下のような構造でも動作
 * {
 *   id: "123",
 *   tenant_id: "456",
 *   units: [
 *     { id: "789", name: "Unit1" },
 *     { id: "012", name: "Unit2" }
 *   ],
 *   staffs: [
 *     { id: "345", user_id: "678" }
 *   ],
 *   nested: {
 *     deeply: {
 *       items: [
 *         { id: "999" }
 *       ]
 *     }
 *   }
 * }
 */
export function inflate<D>(
  targetPaths: string[],
  iteratee: IterateeFunction,
): QueryRunnerMiddleware<D, QueryResultList<D>, QueryRunnerCriteria<D>> {
  const middleware: QueryRunnerMiddleware<
    D,
    QueryResultList<D>,
    QueryRunnerCriteria<D>
  > = {
    postprocess(result) {
      result.items = result.items.map((record) => {
        return transformWithPaths(record, targetPaths, iteratee)
      })
    },
  }

  return middleware
}

/**
 * 再帰的にオブジェクト内の特定パスの値を変換するdeflate関数
 * preprocessで使用（検索条件のデコード用）
 */
export function deflate<D>(
  targetPaths: string[],
  iteratee: IterateeFunction,
): QueryRunnerMiddleware<D, QueryResultList<D>, QueryRunnerCriteria<D>> {
  // パスを展開してoperator付きパスに変換
  const expandedPaths = expandPathsWithOperators(targetPaths)

  const middleware: QueryRunnerMiddleware<
    D,
    QueryResultList<D>,
    QueryRunnerCriteria<D>
  > = {
    preprocess(criteria) {
      // 検索条件内の値をデコード
      if (criteria.filter) {
        // filterが配列の場合
        if (Array.isArray(criteria.filter)) {
          criteria.filter = criteria.filter.map((filterObj) => {
            return transformWithPaths(filterObj, expandedPaths, iteratee)
          })
        } else {
          // filterが単一オブジェクトの場合
          criteria.filter = transformWithPaths(
            criteria.filter,
            expandedPaths,
            iteratee,
          )
        }
      }
    },
  }

  return middleware
}
