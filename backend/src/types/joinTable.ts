import { FormConfig } from './formConfig';
import { Relationship } from './relationship';

export type JoinTable = Omit<FormConfig, 'access' | 'views'> & {
  /** The type of relationship between the top level table and the configured table. */
  relationship: Relationship;
  /**
   * The configuration of the join table that is needed to
   * resolve values between the two tables. Only required for
   * many-to-many relationships.
   * */
  via?: {
    /** The name of the join table. */
    tableName: string;
    /**
     * The schema of the join table.
     * Defaults to the schema set in POSTGREST_DEFAULT_SCHEMA.
     */
    schema?: string;
  };
  /**
   * The columns used for resolving the joins. Only required for
   * many-to-many and one-to-many relationships.
   */
  on?: {
    /** The name of the column that references the left-handside table. */
    self: string;
    /**
     * The name of the column that references the other
     * side of the join table. Only required for many-to-many relationships.
     */
    other?: string;
  };
};
