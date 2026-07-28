/**
 * upsert の値としてバインド可能なプリミティブ型。
 *
 * NOTE: bigint を含めているのは、利用側（tabilog 等）が bigint の PK・FK を
 *       そのままバインド値として渡すため。
 */
export type SqlPrimitive = string | number | boolean | bigint | Date | null
