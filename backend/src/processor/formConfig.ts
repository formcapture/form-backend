import { PostgrestClient } from '@supabase/postgrest-js';
import merge from 'lodash.merge';
import { Logger } from 'winston';

import { GenericRequestError } from '../errors/GenericRequestError';
import { setupLogger } from '../logger';
import { isFormConfig } from '../typeguards/formConfig';
import { FormConfig } from '../types/formConfig';
import { FormConfigInternal } from '../types/formConfigInternal';
import { FormConfigPublic } from '../types/formConfigPublic';
import { JoinTable } from '../types/joinTable';
import { Opts } from '../types/opts';
import { Relationship } from '../types/relationship';

class FormConfigProcessor {

  #formConfig?: FormConfigInternal;

  #pgClient: PostgrestClient<any, string, any>;
  #pgUrl: string;
  #postgrestToken: string;
  #logger: Logger;

  constructor(
    opts: Opts,
    pgClient: PostgrestClient<any, string, any>,
    postgrestToken: string
  ) {
    this.#pgUrl = opts.POSTGREST_URL;
    this.#pgClient = pgClient;
    this.#postgrestToken = postgrestToken;
    this.#logger = setupLogger({ label: 'formConfigProcessor' });
  }

  /**
   * Create a new FormConfigProcessor instance with already
   * resolved formConfig.
   * In comparison to the direct instantiation of FormConfigProcessor,
   * this methods resolves the formConfig and sets it on the processor.
   *
   * @param opts The opts.
   * @param formConfig The form config.
   * @param pgClient The pgClient.
   * @param postgrestToken The postgrest token.
   * @returns FormConfigProcessor instance with resolved formConfig.
   */
  static async createFormConfigProcessor(
    opts: Opts,
    formConfig: FormConfig,
    pgClient: PostgrestClient<any, string, any>,
    postgrestToken: string,
    order?: FormConfig['dataSource']['order'],
    orderBy?: FormConfig['dataSource']['orderBy'],
  ) {
    const formConfigProcessor = new FormConfigProcessor(opts, pgClient, postgrestToken);
    const formConfigInternal =
      await formConfigProcessor.processConfig(formConfig, order, orderBy) as FormConfigInternal;
    formConfigProcessor.setFormConfig(formConfigInternal);
    return formConfigProcessor;
  }

  /**
   * Check if user is allowed to read form.
   * Read form is allowed when one of following conditions hold true:
   * - user has write permission on form
   * - form is set to be readable by all (aka read === true)
   * - user has role that is included in the access.read
   * @param userRoles List of roles that user has
   * @returns True, if user has permission to read form, false otherwise.
   */
  static allowsReadForm(formConfig: FormConfig, userRoles: string[]) {
    if (!formConfig) {
      return false;
    }

    const read = formConfig.access.read;
    const hasWrite = FormConfigProcessor.allowsWriteForm(formConfig, userRoles);
    if (hasWrite || read === true) {
      return true;
    }
    if (Array.isArray(read)) {
      const hasRead = userRoles.some(role => read.includes(role));
      if (hasRead) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user is allowed to write form.
   * Write form is allowed when one of following conditions hold true:
   * - form is set to be writable by all (aka write === true)
   * - user has role that is included in the access.write
   * @param userRoles List of roles that user has
   * @returns True, if user has permission to write form, false otherwise.
   */
  static allowsWriteForm(formConfig: FormConfig | FormConfigInternal, userRoles: string[]) {
    if (!formConfig) {
      return false;
    }

    const write = formConfig.access.write;
    if (write === true) {
      return true;
    }
    if (Array.isArray(write)) {
      const hasWrite = userRoles.some(role => write.includes(role));
      if (hasWrite) {
        return true;
      }
    }
    return false;
  }

  static allowsTableView(formConfig: FormConfig) {
    if (!formConfig) {
      return false;
    }

    return formConfig.views.table ?? false;
  }

  static allowsItemView(formConfig: FormConfig) {
    if (!formConfig) {
      return false;
    }

    return formConfig.views.item ?? false;
  }


  static getPropsWithJoinTables(
    formConfig: FormConfigInternal | JoinTable,
    relationship?: JoinTable['relationship']
  ) {
    const propsWithJoinTables = formConfig.includedProperties
      .filter((prop: string) => formConfig.properties[prop].resolveTable);

    if (relationship) {
      const propsWithRelationship = propsWithJoinTables
        .filter((prop: string) => formConfig.dataSource.joinTables?.[prop]?.relationship === relationship);
      return propsWithRelationship;
    }

    return propsWithJoinTables;
  }

  setFormConfig(formConfig: FormConfigInternal) {
    this.#formConfig = formConfig;
  }

  getFormConfig() {
    return this.#formConfig;
  }

  /**
   * Process the form config to a form config internal.
   * @param formConfig The form config to process.
   * @returns The form config internal.
   */
  async processConfig(
    formConfig: FormConfig | JoinTable,
    order?: FormConfig['dataSource']['order'],
    orderBy?: FormConfig['dataSource']['orderBy']
  ) {
    const schema = formConfig.dataSource?.schema || this.#pgClient.schemaName!;
    const tableName = formConfig.dataSource?.tableName;
    const tableDefinition = await this.#getTableDefinition(schema, tableName, formConfig);
    const properties = this.#mergeDefinitionAndProps(tableDefinition, formConfig.properties ?? {});
    this.#addRequiredFileProperties(properties);
    const includedProperties = this.#sanitizeIncludedProperties(formConfig.includedProperties, properties);
    let includedPropertiesTable = this.#sanitizeIncludedProperties(formConfig.includedPropertiesTable, properties);
    if (!formConfig.includedPropertiesTable || !formConfig.includedPropertiesTable.length) {
      includedPropertiesTable = includedProperties;
    }
    const sanitizedOrder = this.#sanitizeOrder(order, formConfig.dataSource.order);
    const sanitizedOrderBy = this.#sanitizeOrderBy(
      orderBy, formConfig.dataSource.orderBy, formConfig.dataSource.idColumn, properties
    );
    const dataSource: FormConfigInternal['dataSource'] = {
      ...formConfig.dataSource,
      order: sanitizedOrder,
      orderBy: sanitizedOrderBy
    };

    let config: FormConfigInternal | JoinTable = {
      ...formConfig,
      dataSource,
      includedProperties,
      includedPropertiesTable,
      properties
    } as FormConfigInternal | JoinTable;

    if (isFormConfig(formConfig)) {
      const views: FormConfigInternal['views'] = {
        item: formConfig.views.item ?? false,
        table: formConfig.views.table ?? false,
        pageSize: formConfig.views.pageSize ?? 10
      };
      config.views = views;
    }

    const resolvedProperties = await this.#resolveEnums(properties, config);

    config.properties = resolvedProperties;

    config = await this.#processJoinTables(formConfig, config);
    config = await this.#processLookupTables(formConfig, config);

    return config;
  }

  /**
   * Post process the form config for an item.
   * @param userRoles The roles of the current user.
   * @returns The post processed form config.
   */
  postProcessItemConfig(userRoles: string[]) {
    if (!this.#formConfig) {
      return;
    }

    const formConfig = this.#formConfig;
    const postProcessedConfig = this.#postProcessConfig(userRoles);
    if (!postProcessedConfig) {
      return;
    }

    const filteredProperties = this.#filterByIncludedProperties(formConfig, formConfig.includedProperties);
    const postProcessedProperties = this.#postProcessProperties(filteredProperties);

    postProcessedConfig.properties = postProcessedProperties;
    return postProcessedConfig;
  }

  /**
   * Post process the form config for an item.
   * @param userRoles The roles of the current user.
   * @returns The post processed form config.
   */
  postProcessTableConfig(userRoles: string[]) {
    if (!this.#formConfig) {
      return;
    }

    const formConfig = this.#formConfig;
    const postProcessedConfig = this.#postProcessConfig(userRoles);
    if (!postProcessedConfig) {
      return;
    }

    const filteredProperties = this.#filterByIncludedProperties(formConfig, formConfig.includedPropertiesTable);
    const postProcessedProperties = this.#postProcessProperties(filteredProperties);
    postProcessedConfig.properties = postProcessedProperties;

    return postProcessedConfig;
  }

  /**
   * Process the form config internal to a form config public.
   * @param userRoles The user roles of the current user.
   * @returns The form config public.
   */
  #postProcessConfig(userRoles: string[]): FormConfigPublic | undefined {
    if (!this.#formConfig) {
      return;
    }

    return {
      type: 'object',
      format: this.#formConfig.format,
      title: this.#formConfig.title,
      description: this.#formConfig.description,
      idColumn: this.#formConfig.dataSource.idColumn,
      editable: FormConfigProcessor.allowsWriteForm(this.#formConfig, userRoles),
      views: this.#formConfig.views,
      order: this.#formConfig.dataSource.order,
      orderBy: this.#formConfig.dataSource.orderBy
    };
  }

  /**
   * Remove keys of properties that should not be included in the public form config.
   * @param properties The properties to process.
   * @returns The post processed properties.
   */
  #postProcessProperties(properties: FormConfigInternal['properties']) {
    const propsToExclude = ['resolveTable', 'resolveAsEnum', 'resolveToColumn', 'resolveLookup'];
    const postProcessedProperties = Object.keys(properties)
      .reduce((acc, key) => {
        const property = properties[key];
        const processedProperty: FormConfigPublic['properties'] = Object.keys(property)
          .reduce((acc2, prop) => {
            if (propsToExclude.includes(prop)) {
              return {
                ...acc2
              };
            }
            return {
              ...acc2,
              [prop]: property[prop]
            };
          }, {});

        if (Object.hasOwn(processedProperty, 'items') && Object.hasOwn(processedProperty.items, 'properties')) {
          processedProperty.items.properties = this.#postProcessProperties(property.items.properties);
        }

        if (Object.hasOwn(processedProperty, 'properties')) {
          processedProperty.properties = this.#postProcessProperties(property.properties);
        }

        return {
          ...acc,
          [key]: processedProperty
        };
      }, {});
    return postProcessedProperties;
  }

  #addRequiredFileProperties(properties: FormConfigInternal['properties']) {
    for (const key in properties) {
      if (Object.hasOwn(properties, key)) {
        const property = properties[key];
        if (property.type !== 'string' || !property.media || property.media.binaryEncoding !== 'base64') {
          continue;
        }
        if (!property.options) {
          property.options = {};
        }
        if (!property.options.max_upload_size) {
          // eslint-disable-next-line camelcase
          property.options.max_upload_size = 0;
        }
      }
    }
  }

  /**
   * Filter properties by included properties recursively.
   * @param formConfig The form config.
   * @param includedProperties The included properties.
   * @returns The filtered properties.
   */
  #filterByIncludedProperties(
    formConfig: FormConfigInternal | JoinTable,
    includedProperties: FormConfigInternal['includedProperties'] | FormConfigInternal['includedPropertiesTable'] = []
  ) {
    const properties = formConfig.properties;
    const filteredProperties = Object.keys(properties)
      .filter(key => includedProperties.includes(key))
      .reduce((obj, key) => {
        const filteredProperty: FormConfigInternal['properties'] = {
          ...obj,
          [key]: properties[key]
        };

        if (properties[key].resolveTable) {
          const joinTable = formConfig.dataSource.joinTables?.[key];
          if (!joinTable) {
            throw new Error(`Join table ${key} not found in joinTables`);
          }
          const joinTableIncludedProperties = joinTable.includedProperties;
          const filteredJoinTableProperties = this.#filterByIncludedProperties(joinTable, joinTableIncludedProperties);

          switch (joinTable.relationship) {
            case Relationship.MANY_TO_MANY:
            case Relationship.ONE_TO_MANY:
              filteredProperty[key].items = {
                properties: filteredJoinTableProperties
              };
              break;
            case Relationship.MANY_TO_ONE:
            case Relationship.ONE_TO_ONE:
              filteredProperty[key].properties = filteredJoinTableProperties;
              break;
            default:
              break;
          }
        }
        return filteredProperty;
      }, {});

    return filteredProperties;
  }

  #sanitizeIncludedProperties(
    includedProperties: FormConfig['includedProperties'],
    properties: FormConfigInternal['properties']
  ) {
    const resolvedIncludedProperties =
      includedProperties && includedProperties.length ? includedProperties : Object.keys(properties);
    const sanitizedIncludedProperties = resolvedIncludedProperties.filter(prop => Object.hasOwn(properties, prop));
    return sanitizedIncludedProperties as FormConfigInternal['includedProperties'];
  }

  #sanitizeOrder(
    userDefined: string | undefined,
    configured: FormConfig['dataSource']['order']
  ) {
    if (userDefined === 'asc' || userDefined === 'desc') {
      return userDefined;
    }
    if (configured === 'asc' || configured === 'desc') {
      return configured;
    }
    return 'asc';
  }

  #sanitizeOrderBy(
    userDefined: string | undefined,
    configured: FormConfig['dataSource']['orderBy'],
    fallback: FormConfig['dataSource']['idColumn'],
    properties: FormConfigInternal['properties']
  ) {
    if (userDefined && Object.hasOwn(properties, userDefined)) {
      return userDefined;
    }
    if (configured && Object.hasOwn(properties, configured)) {
      return configured;
    }
    return fallback;
  }

  async #getTableDefinition(schema: string, tableName: string, formConfig: FormConfig | JoinTable) {
    // TODO also get table definition of join tables
    if (!tableName) {
      return;
    }
    const response = await fetch(this.#pgUrl, {
      headers: {
        Authorization: `Bearer ${this.#postgrestToken}`,
        'Accept-Profile': schema
      }
    });
    if (!response.ok) {
      this.#logger.error(response.statusText);
      return;
    }
    const swaggerDoc = await response.json();
    const tableDefinition = swaggerDoc.definitions?.[tableName];

    if (!tableDefinition) {
      this.#logger.error(`Table definition for table ${tableName} not found in swagger doc`);
      return;
    }

    if (formConfig.includedProperties) {
      // filter out only the properties that are included in the form config
      const includedProperties = formConfig.includedProperties;
      tableDefinition.properties = Object.keys(tableDefinition.properties)
        .filter(key => includedProperties.includes(key))
        .reduce((obj, key) => {
          return {
            ...obj,
            [key]: tableDefinition.properties[key]
          };
        }, {});
    }

    return tableDefinition;
  }

  async #resolveEnums(properties: FormConfigInternal['properties'], formConfig: FormConfigInternal | JoinTable) {
    const propertiesClone = structuredClone(properties);
    // TODO resolve enums after data retrieval, to also be able to include itemIds in the enum source where needed
    for (const key in propertiesClone) {
      if (Object.hasOwn(propertiesClone, key)) {
        const property = propertiesClone[key];
        if (!property.resolveAsEnum) {
          continue;
        }
        // TODO if order by column matches key, order by display value
        const enums = await this.#requestEnumData(key, propertiesClone[key], formConfig);
        if (enums) {
          property.enumSource = [{
            source: enums.map(e => {
              return {
                value: e[key as any],
                title: e[property.resolveToColumn]
              };
            }),
            title: '{{item.title}}',
            value: '{{item.value}}'
          }];
        }
      }
    }

    return propertiesClone;
  }

  async #requestEnumData(
    propertyName: string,
    props: FormConfigInternal['properties'][keyof FormConfigInternal['properties']],
    formConfig: FormConfigInternal | JoinTable
  ) {
    const schema = formConfig.dataSource.schema;
    const tableName = formConfig.dataSource.tableName;

    const columns = [propertyName, props.resolveToColumn];
    const selectStatement = columns.toString();

    // TODO add sorting and limit opts
    const data = await this.#pgClient
      .schema(schema || this.#pgClient.schemaName!)
      .from(tableName)
      .select(selectStatement);

    if (data.error || data.status !== 200) {
      this.#logger.error(data.error);
      return;
    }

    return data.data;
  }

  #mergeDefinitionAndProps(
    // TODO add proper type as soon as we have postgrest model definitions
    tableDefinition: Record<string, any>,
    properties: FormConfigInternal['properties']
  ) {
    const mergedProperties = merge(tableDefinition.properties, properties);
    return mergedProperties;
  }

  async #processJoinTables(formConfig: FormConfig | JoinTable, conf: FormConfigInternal | JoinTable) {
    const config = structuredClone(conf);

    const joinTables = formConfig.dataSource.joinTables ?? {};
    for (const key in joinTables) {
      if (Object.hasOwn(joinTables, key)) {
        const joinTable = joinTables[key];
        const joinTableConfig = await this.processConfig(joinTable);
        if (!config.dataSource.joinTables) {
          config.dataSource.joinTables = {};
        }
        config.dataSource.joinTables[key] = joinTableConfig;
      }
    }

    for (const prop in formConfig.properties) {
      if (!formConfig.properties[prop].resolveTable) {
        continue;
      }
      const joinTable = config.dataSource.joinTables?.[prop];
      if (!joinTable) {
        throw new Error(`Join table ${prop} not found in joinTables`);
      }
      switch (joinTable.relationship) {
        case Relationship.MANY_TO_MANY:
        case Relationship.ONE_TO_MANY:
          config.properties[prop].type = 'array';
          config.properties[prop].items = {
            ...formConfig.properties[prop].items,
            type: 'object',
            properties: joinTable.properties
          };
          break;
        case Relationship.MANY_TO_ONE:
        case Relationship.ONE_TO_ONE:
          config.properties[prop].type = 'object';
          config.properties[prop].properties = {
            ...formConfig.properties[prop].properties,
            ...joinTable.properties
          };
          break;
        default:
          throw new GenericRequestError('Relationship not supported');
      }
    }

    return config;
  }

  async #processLookupTables(formConfig: FormConfig | JoinTable, conf: FormConfigInternal | JoinTable) {
    const config = structuredClone(conf);

    const lookupTables = formConfig.dataSource.lookupTables ?? {};
    for (const key in lookupTables) {
      if (Object.hasOwn(lookupTables, key)) {
        const lookupTable = lookupTables[key];
        const lookupTableConfig = await this.processConfig(lookupTable);
        if (!config.dataSource.lookupTables) {
          config.dataSource.lookupTables = {};
        }
        config.dataSource.lookupTables[key] = lookupTableConfig;
      }
    }

    for (const prop in formConfig.properties) {
      if (!formConfig.properties[prop].resolveLookup) {
        continue;
      }
      const lookupTable = config.dataSource.lookupTables?.[prop];
      if (!lookupTable) {
        throw new Error(`Lookup table ${prop} not found in lookupTables`);
      }
      config.properties[prop] = {
        ...config.properties[prop],
        ...lookupTable.properties[lookupTable.includedProperties[0]]
      };
    }

    return config;
  }
}

export default FormConfigProcessor;
