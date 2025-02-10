import { Access } from './access';
import { DataSource } from './dataSource';
import { FormConfigProperties } from './formConfigProperties';
import { Views } from './views';

/**
 * The form configuration. This configuration
 * is used as content for the json files describing forms.
 *
 * @example Simple
 * A simple configuration for the imaginary table `my_table`
 * with access for all users (incl. not logged-in users):
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id"
 *  },
 *  "access": {
 *    "read": true,
 *    "write": true
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true
 *  }
 * }
 * ```
 *
 * @example Column Subset
 * Configuration for the imaginary table `my_table` with
 * only the columns `id`, `name` and `description`:
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id"
 *  },
 *  "access": {
 *    "read": true,
 *    "write": true
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true
 *  },
 *  "includedProperties": ["id", "name", "description"]
 * }
 * ```
 *
 * @example Table View
 * Configuration with the table view enabled and the item view disabled:
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id"
 *  },
 *  "access": {
 *    "read": true,
 *    "write": true
 *  },
 *  "views": {
 *    "item": false,
 *    "table": true
 *  }
 * }
 * ```
 *
 * @example Item View
 * Configuration with the table view disabled and the item view enabled:
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id"
 *  },
 *  "access": {
 *    "read": true,
 *    "write": true
 *  },
 *  "views": {
 *    "item": true,
 *    "table": false
 *  }
 * }
 * ```
 *
 * @example Pagination
 * Configuration with pagination showing 5 items per page:
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id"
 *  },
 *  "access": {
 *    "read": true,
 *    "write": true
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true,
 *    "pageSize": 5
 *  }
 * }
 * ```
 *
 * @example Sorting
 * Configuration with predefined sorting by the column `name`
 * in descending order:
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id",
 *    "order": "desc",
 *    "orderBy": "name"
 *  },
 *  "access": {
 *    "read": true,
 *    "write": true
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true
 *  }
 * }
 * ```
 *
 * @example Permissions
 * Configuration with read permissions for everyone and write permissions
 * for users with role `editor` or `specialist`:
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id",
 *    "order": "desc",
 *    "orderBy": "name"
 *  },
 *  "access": {
 *    "read": true,
 *    "write": ["editor", "specialist"]
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true
 *  }
 * }
 * ```
 *
 * @example Permissions
 * Configuration with read permissions for users with role `reader`
 * and write permissions for users with role `editor`:
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id",
 *    "order": "desc",
 *    "orderBy": "name"
 *  },
 *  "access": {
 *    "read": ["reader"],
 *    "write": ["editor"]
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true
 *  }
 * }
 * ```
 *
 * @example Permissions
 * Configuration with read permissions for no-one and write permissions for no-one:
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id",
 *    "order": "desc",
 *    "orderBy": "name"
 *  },
 *  "access": {
 *    "read": [],
 *    "write": []
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true
 *  }
 * }
 * ```
 *
 * @example Readonly fields
 * Configuration with readonly id column:
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id",
 *    "order": "desc",
 *    "orderBy": "name"
 *  },
 *  "access": {
 *    "read": true,
 *    "write": true
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true
 *  },
 *  "properties": {
 *    "id": {
 *      "readOnly": true
 *    }
 *  }
 * }
 * ```
 *
 * @example Relationships - One-to-One
 * Configuration for a one-to-one relationship.
 * The column `my_details` of the table `my_table` references the table `details`.
 * The columns `description` and `comment` of the table `details` are included in the form.
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id",
 *    "joinTables": {
 *      "my_details": {
 *        "relationship": "oneToOne",
 *        "dataSource": {
 *          "tableName": "details",
 *          "idColumn": "id"
 *        },
 *        "includedProperties": ["description", "comment"]
 *      }
 *    }
 *  },
 *  "access": {
 *    "read": true,
 *    "write": true
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true
 *  },
 *  "properties": {
 *    "my_details": {
 *      "resolveTable": true
 *    }
 *  }
 * }
 * ```
 *
 * @example Relationships - Many-to-One
 * Configuration for a many-to-one relationship.
 * The column `item_type` of the table `my_table` references the table `item_types`.
 * The column `type` of the table `item_types` is included in the form.
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id",
 *    "joinTables": {
 *      "item_type": {
 *        "relationship": "manyToOne",
 *        "dataSource": {
 *          "tableName": "item_types",
 *          "idColumn": "id"
 *        },
 *        "includedProperties": ["type"]
 *      }
 *    }
 *  },
 *  "access": {
 *    "read": true,
 *    "write": true
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true
 *  },
 *  "properties": {
 *    "item_type": {
 *      "resolveTable": true
 *    }
 *  }
 * }
 * ```
 *
 * @example Relationships - Many-to-One with Dropdown
 * Configuration for a many-to-one relationship with a dropdown.
 * The column `item_type` of the table `my_table` references the table `item_types`.
 * The item type will be selectable from a dropdown that displays the values
 * of the column `type` of the table `item_types`.
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id",
 *    "joinTables": {
 *      "item_type": {
 *        "relationship": "manyToOne",
 *        "dataSource": {
 *          "tableName": "item_types",
 *          "idColumn": "id"
 *        },
 *        "includedProperties": ["id"],
 *        "properties": {
 *          "id": {
 *            "resolveAsEnum": true,
 *            "resolveToColumn": "type"
 *          }
 *        }
 *      }
 *    }
 *  },
 *  "access": {
 *    "read": true,
 *    "write": true
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true
 *  },
 *  "properties": {
 *    "item_type": {
 *      "resolveTable": true
 *    }
 *  }
 * }
 * ```
 *
 * @example Relationships - One-to-Many
 * Configuration for a one-to-many relationship.
 *
 * The form displays the values of the table `my_table`, which has a
 * one-to-many relationship to the table `inspections`. If we want to
 * add the list of related inspections to the form,
 * we have to add a joinTable configuration with relationship `oneToMany`. In that configuration,
 * we have to provide information about the table itself (`dataSource` properties),
 * as well as the fields that are connecting the two tables. The connecting field
 * in one-to-many relationships can be found on the related table (in this case
 * table `inspections`). In our scenario, the column `table_id` of table `inspections`
 * holds the foreign key to the table `my_table`. Therefore, we have to specify this
 * column on the `on.self` property in the joinTable configuration. After doing so,
 * the inspections will be added as property `my_inspections` to the form.
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id",
 *    "joinTables": {
 *      "my_inspections": {
 *        "relationship": "oneToMany",
 *        "dataSource": {
 *          "tableName": "inspections",
 *          "idColumn": "id"
 *        },
 *        "on": {
 *          "self": "table_id"
 *        }
 *      }
 *    }
 *  },
 *  "access": {
 *    "read": true,
 *    "write": true
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true
 *  },
 *  "includedProperties": ["my_inspections"],
 *  "properties": {
 *    "my_inspections": {
 *      "resolveTable": true
 *    }
 *  }
 * }
 * ```
 *
 * @example Relationships - Many-to-Many
 * Configuration for a many-to-many relationship.
 *
 * The form displays the values of the table `my_table`, which has a many-to-many relationship
 * to the table `contacts`. If we want to add the list of related contacts to the form,
 * we have to add a joinTable configuration with relationship `manyToMany`. In that configuration,
 * we have to provide information about the table itself (`dataSource` properties), as well as the
 * fields that are connecting the two tables. Connections in many-to-many relationships are created
 * via distinct joinTables, which hold the foreign keys to both related tables. In our scenario,
 * a joinTable will hold a) the foreign key to `my_table` and b) the foreign key to `contacts`.
 * The information about the joinTable must be provided on the `via` property. The column names
 * pointing to the different tables must be provided on the `on.self` and `on.other` properties.
 * In our case, `on.self` must provide the column name pointing to `my_table`, and `on.other` must
 * provide the column name pointing to `contacts`. After doing so, the contacts will be added
 * as property `my_contacts` to the form.
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id",
 *    "joinTables": {
 *      "my_contacts": {
 *        "relationship": "manyToMany",
 *        "dataSource": {
 *          "tableName": "contacts",
 *          "idColumn": "id"
 *        },
 *        "via": {
 *          "tableName": "table_contacts"
 *        },
 *        "on": {
 *          "self": "table_id",
 *          "other": "contact_id"
 *        }
 *      }
 *    }
 *  },
 *  "access": {
 *    "read": true,
 *    "write": true
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true
 *  },
 *  "includedProperties": ["my_contacts"],
 *  "properties": {
 *    "my_contacts": {
 *      "resolveTable": true
 *    }
 *  }
 * }
 * ```
 *
 * @example Dropdowns - Foreign Key
 * Configuration for a dropdown using a lookup table with a foreign key.
 * The column `my_item_type` of the table `my_table` references the table `item_types`.
 * The column `item_type` of the table `item_types` is included in the form as display value,
 * while the column `id` of the table `item_types` is being used as value for the
 * column `my_item_type` of table `my_table`.
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id",
 *    "lookupTables": {
 *      "my_item_type": {
 *        "dataSource": {
 *          "tableName": "item_types",
 *          "idColumn": "id"
 *        },
 *        "includedProperties": ["id"],
 *        "properties": {
 *          "id": {
 *           "resolveAsEnum": true,
 *           "resolveToColumn": "item_type"
 *          }
 *        }
 *      }
 *    }
 *  },
 *  "access": {
 *    "read": true,
 *    "write": true
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true
 *  },
 *  "includedProperties": ["my_item_type"],
 *  "properties": {
 *    "my_item_type": {
 *      "resolveLookup": true
 *    }
 *  }
 * }
 * ```
 *
 * @example Dropdowns - Direct Value
 * Configuration for a dropdown using a lookup table with direct values.
 * Instead of using references via foreign key, the column `my_item_type` of
 * the table `my_table` will contain the direct values of the column `item_type`
 * of table `item_types`. This is done by using the the column `item_type` both
 * as display value and as value for the column `my_item_type`.
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id",
 *    "lookupTables": {
 *      "my_item_type": {
 *        "dataSource": {
 *          "tableName": "item_types",
 *          "idColumn": "id"
 *        },
 *        "includedProperties": ["item_type"],
 *        "properties": {
 *          "item_type": {
 *           "resolveAsEnum": true,
 *           "resolveToColumn": "item_type"
 *          }
 *        }
 *      }
 *    }
 *  },
 *  "access": {
 *    "read": true,
 *    "write": true
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true
 *  },
 *  "includedProperties": ["my_item_type"],
 *  "properties": {
 *    "my_item_type": {
 *      "resolveLookup": true
 *    }
 *  }
 * }
 * ```
 *
 * @example Geometry Selection
 * A configuration for the imaginary table `my_table`
 * with selection input for a geometry field.
 * The selection requires a layerId key as mandatory option.
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id"
 *  },
 *  "access": {
 *    "read": true,
 *    "write": true
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true
 *  },
 *  "includedProperties": [
 *    "id",
 *    "geom"
 *  ],
 *  "properties": {
 *    "geom": {
 *      "format": "geometrySelection",
 *      "options": {
 *        "layerId": "455"
 *      }
 *    }
 *  }
 * }
 * ```
 *
 * @example Geolocation
 * A configuration for the imaginary table `my_table`
 * with a geometry input field that allows geolocation.
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id"
 *  },
 *  "access": {
 *    "read": true,
 *    "write": true
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true
 *  },
 *  "includedProperties": [
 *     "id",
 *     "geom"
 *  ],
 *  "properties": {
 *    "geom": {
 *      "format": "location"
 *    }
 *  }
 * }
 * ```
 *
 * @example File upload
 * Configuration with file upload:
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id"
 *  },
 *  "access": {
 *    "read": true,
 *    "write": true
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true
 *  },
 *  "properties": {
 *    "my_file_column": {
 *      "type": "string",
 *      "media": {
 *        "binaryEncoding": "base64"
 *      }
 *    }
 *  }
 * }
 * ```
 *
 * @example File upload
 * Configuration with file upload where the file size is limited to 1MB per file:
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id"
 *  },
 *  "access": {
 *    "read": true,
 *    "write": true
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true
 *  },
 *  "properties": {
 *    "my_file_column": {
 *      "type": "string",
 *      "media": {
 *        "binaryEncoding": "base64"
 *      },
 *      "options": {
 *        "max_upload_size": 1000000
 *      }
 *    }
 *  }
 * }
 * ```
 *
 * @example File upload
 * Configuration with file upload where the file type is limited to `image/png` and `image/jpeg`:
 *
 * ```json
 * {
 *  "dataSource": {
 *    "table": "my_table",
 *    "idColumn": "id"
 *  },
 *  "access": {
 *    "read": true,
 *    "write": true
 *  },
 *  "views": {
 *    "item": true,
 *    "table": true
 *  },
 *  "properties": {
 *    "my_file_column": {
 *      "type": "string",
 *      "media": {
 *        "binaryEncoding": "base64"
 *      },
 *      "options": {
 *        "mime_type": ["image/png", "image/jpeg"]
 *      }
 *    }
 *  }
 * }
 * ```
 */
export type FormConfig = {
  // TODO add proper typing

  /** Placeholder for properties that were not typed, yet. */
  [key: string]: any;
  /**
   * The format for the form, e.g. 'grid' or 'grid-strict'.
   * By default the input fields will be stacked vertically.
   */
  format?: string;
  /** The title of the form. By default, the filename will be used. */
  title?: string;
  /** The description of the form. */
  description?: string;
  /**
   * Configuration of the DataSource. Here,
   * the parameters of the (join-)tables are defined.
   */
  dataSource: DataSource;
  /** Defines read/write access for the form. */
  access: Access;
  /**
   * En/-disable the views for the form and configure
   * the pagination.
   */
  views: Views;
  /**
   * List of properties/columns that should be
   * included in the form.
   */
  includedProperties?: string[];
  /**
   * List of properties/columns that should be
   * excluded from the table. If omitted, will take the same
   * properties as `includedProperties`.
   */
  includedPropertiesTable?: string[];
  /**
   * The configuration of the properties/columns.
   * Here, the format for an input field and other
   * properties for an included column can be configured.
   */
  properties?: FormConfigProperties;
};
