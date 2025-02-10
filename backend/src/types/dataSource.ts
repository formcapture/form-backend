import { FormConfig } from './formConfig';
import { JoinTable } from './joinTable';

export type DataSource = {
  // TODO complete typing
  [key: string]: any;
  /**
   * Name of the schema tableName is located in. If not provided, the default
   * schema set in POSTGREST_DEFAULT_SCHEMA will be used.
   * */
  schema?: string;
  /** Name of the table the form is based on. */
  tableName: string;
  /**
   * Name of the column of `tableName` that holds the primary key.
   * Currently, only single-column primary keys are supported.
   */
  idColumn: string;
  /**
   * Configuration of the join tables.
   * The key of a join table can be used as reference in the properties.
   */
  joinTables?: {
    [key: string]: JoinTable;
  };
  /**
   * Configuration of the lookup tables.
   * The key of a lookup table can be used as reference in the properties.
   */
  lookupTables?: {
    [key: string]: FormConfig;
  };
  /**
   * The direction in which the data should be ordered.
   * Use `asc` for ordering ascending and `desc` for ordering descending.
   * Defaults to `asc`.
   */
  order?: 'asc' | 'desc';
  /**
   * The column by which the data should be ordered.
   * Defaults to the primary key column.
   */
  orderBy?: string;
};
