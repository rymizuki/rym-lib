/**
 * Re-export coral-sql functions and types while excluding query-module-sql-builder's direct exports
 *
 * MAINTENANCE: When coral-sql adds new exports, add them to the lists below:
 * 1. Check coral-sql changelog/releases for new functions
 * 2. Add new functions to the appropriate export block
 * 3. This ensures automatic availability without manual tracking
 *
 * EXCLUDED: buildSQL, CustomFilterFunction (these are query-module-sql-builder's direct exports)
 */

// Coral-sql classes
export {
  Field,
  SQLBuilder,
  SQLBuilderCondition,
  SQLBuilderConditions,
} from '@rym-lib/query-module-sql-builder'

// Coral-sql functions
export {
  case_when,
  coalesce,
  createBuilder,
  createConditions,
  exists,
  is_not_null,
  is_null,
  json_array_aggregate,
  json_object,
  not_exists,
  unescape,
} from '@rym-lib/query-module-sql-builder'

// Coral-sql types
export type {
  SQLBuilderBindingValue,
  SQLBuilderConditionConjunction,
  SQLBuilderConditionExpressionPort,
  SQLBuilderConditionInputPattern,
  SQLBuilderConditionPort,
  SQLBuilderConditionValue,
  SQLBuilderConditionsPort,
  SQLBuilderField,
  SQLBuilderOperator,
  SQLBuilderOrderDirection,
  SQLBuilderPort,
  SQLBuilderToSQLInputOptions,
} from '@rym-lib/query-module-sql-builder'
