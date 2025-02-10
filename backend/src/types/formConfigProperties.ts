export type BaseProperty = {
  /** The datatype of the property. */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** The format of the property. */
  format?: string;
  /** The display title of the property. */
  title?: string;
  /** The description of the property. */
  description?: string;
  /** Set to true, if property should be read-only. */
  readOnly?: boolean;
  /**
   * Set to true, if property references one of the joinTables configured in
   * the top-level dataSource property.
   * The key of the property must match the key of the joinTable.
   */
  resolveTable?: boolean;
  /**
   * Set to true, if property references one of the lookupTables configured in
   * the top-level dataSource property.
   * The key of the property must match the key of the lookupTable.
   */
  resolveLookup?: boolean;
  /**
   * Set to true, if the property should be resolved
   * as an enum. This can be used to create dropdowns
   * based on a list of values.
   */
  resolveAsEnum?: boolean;
  /**
   * The column that holds the display values for the enums.
   * Required if `resolveAsEnum` is set to true.
   */
  resolveToColumn?: boolean;
};

/**
 * The configuration for file inputs.
 */
export type FileProperty = BaseProperty & {
  /** Files must always be of type 'string'. */
  type: 'string';
  /** Files must always have the media property set. */
  media: {
    /** Files must always have the binary encoding set to 'base64'. */
    binaryEncoding: 'base64';
  };
  /** Additional options to configure file inputs. */
  options?: {
    /**
     * If set, restricts to given mime-types. Can either be a
     * single mime-type or a list of mime-types. Wildcards are
     * currently not supported. If not set, all mime-types are
     * allowed.
     */
    mime_type?: string | string[];
    /**
     * Maximum file size allowed in bytes. If set to 0, there is no limit.
     * Defaults to 0.
     */
    max_upload_size?: number;
  };
};

export type FormConfigProperties = {
  // TODO add proper typing
  /**
   * The configuration of the properties/columns.
   * Here, the format for an input field and other
   * properties for an included column can be configured.
   */
  [key: string]: any | BaseProperty | FileProperty;
};
