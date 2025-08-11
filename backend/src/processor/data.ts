import { PostgrestClient, PostgrestFilterBuilder, PostgrestResponse } from '@supabase/postgrest-js';
import { Logger } from 'winston';

import { FormBackendErrorCode } from '../errors/FormBackendErrorCode';
import { DatabaseError, GenericRequestError, InternalServerError } from '../errors/GenericRequestError';
import { setupLogger } from '../logger';
import { DataItem } from '../types/data';
import { DbAction } from '../types/dbAction';
import { FilterType } from '../types/filter';
import { FormConfigInternal } from '../types/formConfigInternal';
import { FormConfigProperties } from '../types/formConfigProperties';
import { JoinTable } from '../types/joinTable';
import { Opts } from '../types/opts';
import { Relationship } from '../types/relationship';

import FileProcessor from './file';
import FormConfigProcessor from './formConfig';

export interface DataProcessorOpts {
  pgClient: PostgrestClient<any, any, any>;
  formId: string;
  opts: Opts;
}

class DataProcessor {
  #pgClient: PostgrestClient<any, any, any>;
  #fileProcessor: FileProcessor;
  #logger: Logger;

  // TODO remove all unnecessary checks as soon as we validate the formConfig
  constructor(opts: DataProcessorOpts, fileProcessor: FileProcessor) {
    this.#pgClient = opts.pgClient;
    this.#fileProcessor = fileProcessor;
    this.#logger = setupLogger({ label: 'dataProcessor' });
  }

  replaceEmptyDateFields(data: DataItem, properties: FormConfigProperties): DataItem {
    const itemClone = structuredClone(data);

    Object.entries(properties)
      .filter(([, value]) => value.format === 'date')
      .forEach(([key]) => {
        if (itemClone[key] === '') {
          itemClone[key] = null;
        }
      });

    return itemClone;
  }

  async getFormData(formConfig: FormConfigInternal, page: number = 0, filter: FilterType) {
    const tableName = formConfig.dataSource.tableName;
    if (!tableName) {
      return;
    }

    const selectStatement = this.#createFormSelectStatement(formConfig);

    const rangeLower = page * formConfig.views.pageSize;
    const rangeUpper = rangeLower + formConfig.views.pageSize - 1;
    // TODO think about how to work with ranges and join tables, many-to-many etc

    const query = this.#pgClient
      .schema(formConfig.dataSource.schema || this.#pgClient.schemaName!)
      .from(tableName)
      .select(selectStatement, { count: 'exact' });

    this.#addOrderQuery(query, formConfig);
    query.range(rangeLower, rangeUpper);
    this.#addFilterQuery(query, filter);

    const data = await query;

    // Check if data is falsy or has an error or a non-2xx status code
    if (!data || data.error || data.status < 200 || data.status >= 300) {
      this.#logger.error(data?.error);
      return;
    }

    // Reconstruct to the flat data structure which is expected by the client,
    // but was changed to allow for ordering by lookup display value.
    const reconstructedData = this.#reconstructTableData(data.data, formConfig);

    return {
      data: reconstructedData,
      count: data.count
    };
  }

  async getItemData(itemId: string, formConfig: FormConfigInternal | JoinTable) {
    if (itemId === undefined || itemId === null) {
      this.#logger.info('No item id provided');
      return;
    }

    const tableName = formConfig.dataSource.tableName;
    if (!tableName) {
      return;
    }

    const idColumn = formConfig.dataSource.idColumn;
    if (!idColumn) {
      this.#logger.info('No id column provided');
      return;
    }

    const selectStatement = this.#createItemSelectStatement(formConfig);

    // @ts-ignore
    const data: PostgrestResponse<DataItem> = await this.#pgClient
      .schema(formConfig.dataSource.schema || this.#pgClient.schemaName!)
      .from(tableName)
      .select(selectStatement)
      .eq(idColumn, itemId);

    if (data.error || data.status !== 200) {
      this.#logger.error(data.error);
      return;
    }

    return {
      data: data.data
    };
  }

  async createItemData(item: DataItem, formConfig: FormConfigInternal | JoinTable, configKey?: string) {
    this.#logger.debug(`Creating item for configKey ${configKey}`);

    let sanitizedData = this.#sanitizeData(item, formConfig);
    const tableName = formConfig.dataSource.tableName;
    let isSuccess = false;
    if (!tableName) {
      return { success: isSuccess };
    }

    const keysAndFiles = this.#fileProcessor.getFilesFromItem(sanitizedData, formConfig);
    sanitizedData = this.#fileProcessor.getItemWithoutFiles(sanitizedData, Object.keys(keysAndFiles));

    const response = await this.#pgClient
      .schema(formConfig.dataSource.schema || this.#pgClient.schemaName)
      .from(tableName)
      .insert(sanitizedData)
      .select();

    if (response.status !== 201) {
      this.#logger.error(
        `Could not create data for item ${JSON.stringify(item)} of table ${tableName}. ${response?.error?.message}`
      );

      return {
        success: isSuccess,
        code: response.error?.code,
        message: response.error?.message
      };
    }

    const createdItem = response.data?.[0] as DataItem;
    if (Object.keys(keysAndFiles).length > 0) {
      const updatedItem = await this.#fileProcessor.createFiles({
        item: createdItem,
        keysAndFiles,
        formConfig,
        configKey
      });
      const updateResponse = await this.#pgClient
        .schema(formConfig.dataSource.schema || this.#pgClient.schemaName!)
        .from(tableName)
        .update(updatedItem)
        .eq(formConfig.dataSource.idColumn, createdItem[formConfig.dataSource.idColumn]);

      if (updateResponse.status !== 204) {
        this.#logger.error(
          `Could not update data for item ${JSON.stringify(item)} of table ${tableName}. ${response?.error?.message}`
        );
        return { success: isSuccess };
      }
    }

    const createdItemId = createdItem[formConfig.dataSource.idColumn];

    isSuccess = true;
    return { success: isSuccess, id: createdItemId };
  }

  async updateItemData(
    item: DataItem,
    itemId: string,
    formConfig: FormConfigInternal | JoinTable,
    configKey?: string
  ) {
    this.#logger.debug(`Updating item ${itemId} for configKey ${configKey}`);
    let sanitizedData = this.#sanitizeData(item, formConfig);
    const keysAndFiles = this.#fileProcessor.getFilesFromItem(sanitizedData, formConfig);
    sanitizedData = await this.#fileProcessor.createFiles({
      item: sanitizedData,
      keysAndFiles,
      formConfig,
      itemId,
      configKey
    });
    const emptyFileFields = this.#fileProcessor.getEmptyFileFields(sanitizedData, formConfig);
    await this.#fileProcessor.deleteFiles(itemId, formConfig, emptyFileFields, configKey);
    const successfullyUpated = await this.#updateData(sanitizedData, itemId, formConfig);
    return { id: itemId, success: successfullyUpated };
  }

  async deleteItemData(itemId: string, formConfig: FormConfigInternal | JoinTable) {
    this.#logger.debug(`Deleting item ${itemId}`);
    const tableName = formConfig.dataSource.tableName;
    const idColumn = formConfig.dataSource.idColumn;
    let isSuccess = false;
    if (!tableName || !idColumn) {
      return { id: itemId, success: isSuccess };
    }

    try {
      await this.#fileProcessor.deleteFiles(itemId, formConfig);
    } catch (err) {
      this.#logger.error(`Could not delete files for item ${itemId} of table ${tableName}. ${err}`);
    }

    // @ts-ignore
    const response = await this.#pgClient
      .schema(formConfig.dataSource.schema || this.#pgClient.schemaName!)
      .from(tableName)
      .delete()
      .eq(idColumn, itemId);

    if (response.status !== 204) {
      this.#logger.error(`Could not delete data for item ${itemId} of table ${tableName}. ${response?.error?.message}`);
      return { id: itemId, success: isSuccess };
    }
    isSuccess = true;
    return { id: itemId, success: isSuccess };
  }

  async handleData(
    item: DataItem,
    formConfig: FormConfigInternal | JoinTable,
    action: DbAction,
    configKeys?: string[]
  ) {
    let itemId: string;

    const propsWithToOne = [
      ...FormConfigProcessor.getPropsWithJoinTables(formConfig, Relationship.MANY_TO_ONE),
      ...FormConfigProcessor.getPropsWithJoinTables(formConfig, Relationship.ONE_TO_ONE)
    ];
    for (const prop of propsWithToOne) {
      if (!item[prop]) {
        continue;
      }
      const newConfigKeys = configKeys ? [...configKeys, prop] : [prop];
      item[prop] = await this.#handleToOneData(item[prop], formConfig, newConfigKeys);
    }

    switch (action) {
      case DbAction.CREATE: {
        const createdItem = await this.createItemData(item, formConfig, configKeys?.join('/'));
        if (!createdItem.success) {
          throw new DatabaseError(`Could not create item. ${createdItem.message}`, {
            errorCode: FormBackendErrorCode.ITEM_CREATION_FAILED,
            detailedMessage: createdItem.message,
            dbErrorCode: createdItem.code
          });
        }
        itemId = createdItem.id;
        break;
      }
      case DbAction.UPDATE: {
        const updatedItem = await this.updateItemData(
          item,
          item[formConfig.dataSource.idColumn],
          formConfig,
          configKeys?.join('/')
        );
        itemId = updatedItem.id;
        this.#logger.debug(`Updated item ${itemId} for configKeys ${configKeys}`);
        break;
      }
      case DbAction.DELETE:
        itemId = item[formConfig.dataSource.idColumn];
        break;
      default:
        throw new InternalServerError(`Action ${action} not supported`);
    }

    const propsWithManyToMany = FormConfigProcessor.getPropsWithJoinTables(formConfig, Relationship.MANY_TO_MANY);
    for (const prop of propsWithManyToMany) {
      const newConfigKeys = configKeys ? [...configKeys, prop] : [prop];
      await this.#handleManyToManyData(itemId, item[prop] ?? [], formConfig, newConfigKeys);
    }

    const propsWithOneToMany = FormConfigProcessor.getPropsWithJoinTables(formConfig, Relationship.ONE_TO_MANY);
    for (const prop of propsWithOneToMany) {
      const newConfigKeys = configKeys ? [...configKeys, prop] : [prop];
      await this.#handleOneToManyData(itemId, item[prop] ?? [], formConfig, newConfigKeys);
    }

    // we have to first remove references, so deletions come after handling join tables
    if (action === DbAction.DELETE) {
      const deletedItem = await this.deleteItemData(item[formConfig.dataSource.idColumn], formConfig);
      itemId = deletedItem.id;
    }

    return itemId;
  }

  async #handleManyToManyData(
    itemId: string,
    items: DataItem[],
    formConfig: FormConfigInternal | JoinTable,
    configKeys: string[]
  ) {
    this.#logger.debug(`Handling many-to-many join table data for configKeys ${configKeys.join('/')}`);
    const configKey = configKeys.at(-1);
    if (!configKey) {
      throw new DatabaseError('Cannot handle manyToMany table. ConfigKeys is empty', {
        errorCode: FormBackendErrorCode.CONFIG_KEY_IS_EMPTY
      });
    }
    // TODO this can probably be improved to only get the necessary data
    const dbJoinItems = (await this.getItemData(itemId, formConfig))?.data[0][configKey];
    if (!dbJoinItems) {
      throw new DatabaseError(`Could not get db items for item ${itemId} and configKey ${configKeys.join('/')}`, {
        errorCode: FormBackendErrorCode.DB_JOIN_ITEMS_NOT_FOUND_FOR_CONFIG_KEYS
      });
    }

    if (JSON.stringify(items) === JSON.stringify(dbJoinItems)) {
      return;
    }

    const joinTableConfig = formConfig.dataSource.joinTables[configKey];

    const addedJoinItems = items
      .filter(item => this.#wasItemAdded(item, dbJoinItems, joinTableConfig))
      .map(item => {
        let action: DbAction = DbAction.CREATE;
        if (item[formConfig.dataSource.idColumn]) {
          action = DbAction.UPDATE;
        }
        return this.handleData(item, joinTableConfig, action, configKeys);
      });
    const createdJoinItems = await Promise.all(addedJoinItems);
    if (addedJoinItems.length > 0) {
      await this.#populateJoinTableData(createdJoinItems, itemId, joinTableConfig);
    }

    const updatedItems = items
      .filter(item => this.#wasItemUpdated(item, dbJoinItems, joinTableConfig))
      .map(item => this.handleData(item, joinTableConfig, DbAction.UPDATE, configKeys));
    await Promise.all(updatedItems);

    // when deleting on manyToMany, we only delete the join table, since the other side might still be used
    const removedJoinItems = this.#getRemovedJoinItems(items, dbJoinItems, joinTableConfig);
    if (removedJoinItems.length > 0) {
      await this.#removeFromJoinTable(itemId, removedJoinItems, joinTableConfig);
    }

    this.#logger.debug(`Successfully handled many-to-many join table data for configKeys ${configKeys.join('/')}`);
  }

  async #handleOneToManyData(
    itemId: string,
    items: DataItem[],
    formConfig: FormConfigInternal | JoinTable,
    configKeys: string[]
  ) {
    this.#logger.debug(`Handling one-to-many join table data for configKeys ${configKeys.join('/')}`);
    const configKey = configKeys.at(-1);
    if (!configKey) {
      throw new DatabaseError('Cannot handle oneToMany table. ConfigKeys is empty', {
        errorCode: FormBackendErrorCode.CONFIG_KEY_IS_EMPTY
      });
    }
    const dbJoinItems = (await this.getItemData(itemId, formConfig))?.data[0][configKey];
    if (!dbJoinItems) {
      throw new DatabaseError(`Could not get db items for item ${itemId} and configKey ${configKeys.join('/')}`, {
        errorCode: FormBackendErrorCode.DB_JOIN_ITEMS_NOT_FOUND_FOR_CONFIG_KEYS
      });
    }

    this.#logger.debug(`Received following existing dbJoinItems: ${JSON.stringify(dbJoinItems)}`);

    if (JSON.stringify(items) === JSON.stringify(dbJoinItems)) {
      this.#logger.debug(`No changes in one-to-many join table data for configKeys ${configKeys.join('/')}. Skipping`);
      return;
    }

    const joinTableConfig = formConfig.dataSource.joinTables[configKey];

    const addedJoinItems = items
      .filter(item => this.#wasItemAdded(item, dbJoinItems, joinTableConfig))
      .map(item => {
        const itemWithFk = {
          ...item,
          [joinTableConfig.on.self]: itemId
        };
        this.#logger.debug(`Adding join table data for item ${itemId}`);
        return this.handleData(itemWithFk, joinTableConfig, DbAction.CREATE, configKeys);
      });
    await Promise.all(addedJoinItems);

    const updatedItems = items
      .filter(item => this.#wasItemUpdated(item, dbJoinItems, joinTableConfig))
      .map(item => {
        const itemWithFk = {
          ...item,
          [joinTableConfig.on.self]: itemId
        };
        this.#logger.debug(`Updating join table data for item ${itemId}`);
        return this.handleData(itemWithFk, joinTableConfig, DbAction.UPDATE, configKeys);
      });
    await Promise.all(updatedItems);

    // For now, we will only remove the FK from the other side of the relationship.
    const removedJoinItems = this.#getRemovedJoinItems(items, dbJoinItems, joinTableConfig)
      .map(item => {
        this.#logger.debug(`Removing join table data for item ${itemId}`);
        return this.#unjoinOneToMany(item, joinTableConfig);
      });
    await Promise.all(removedJoinItems);

    this.#logger.debug(`Successfully handled one-to-many join table data for configKeys ${configKeys.join('/')}`);
  }

  async #handleToOneData(item: DataItem, formConfig: FormConfigInternal | JoinTable, configKeys: string[]) {
    this.#logger.debug(`Handling many-to-one join table data for configKeys ${configKeys.join('/')}`);

    const configKey = configKeys.at(-1);
    if (!configKey) {
      throw new DatabaseError('Cannot handle oneToMany table. ConfigKeys is empty', {
        errorCode: FormBackendErrorCode.CONFIG_KEY_IS_EMPTY
      });
    }

    const itemId = item[formConfig.dataSource.joinTables[configKey].dataSource.idColumn];
    const dbJoinItem = (await this.getItemData(itemId, formConfig.dataSource.joinTables[configKey]))?.data[0];

    if (JSON.stringify(item) === JSON.stringify(dbJoinItem)) {
      return itemId;
    }

    let action: DbAction = DbAction.CREATE;
    if (dbJoinItem) {
      action = DbAction.UPDATE;
    }

    const handledItemId = await this.handleData(item, formConfig.dataSource.joinTables[configKey], action, configKeys);
    this.#logger.debug(`Successfully handled many-to-one join table data for configKeys ${configKeys.join('/')}`);

    return handledItemId;
  }

  async #unjoinOneToMany(item: DataItem, formConfig: FormConfigInternal | JoinTable) {
    const fkColumn = formConfig.on.self;
    const tableName = formConfig.dataSource.tableName;
    const idColumn = formConfig.dataSource.idColumn;
    this.#logger.debug(`Unjoining data for item ${item[idColumn]} of table ${tableName}`);

    const unjoinResponse = await this.#pgClient
      .schema(formConfig.dataSource.schema || this.#pgClient.schemaName!)
      .from(formConfig.dataSource.tableName)
      .update({ [fkColumn]: null })
      .eq(idColumn, item[idColumn]);

    if (unjoinResponse.status !== 204) {
      this.#logger.error(
        `Could not unjoin data for item ${item[idColumn]} of table ${tableName}. ${unjoinResponse?.error?.message}`
      );
    }
    this.#logger.debug(`Successfully unjoined data for item ${item[idColumn]} of table ${tableName}`);
  }

  #wasItemAdded(item: DataItem, unchangedDbItems: DataItem[], formConfig: FormConfigInternal | JoinTable) {
    this.#logger.debug(`Checking if item ${JSON.stringify(item)} was added`);
    const idColumn = formConfig.dataSource.idColumn;
    const wasAdded = !unchangedDbItems.some(unchangedDbItem => {
      return unchangedDbItem[idColumn] === item[idColumn];
    });
    this.#logger.debug(`Item ${JSON.stringify(item)} was ${wasAdded ? '' : 'not '}added`);
    return wasAdded;
  }

  #wasItemUpdated(item: DataItem, unchangedDbItems: DataItem[], formConfig: FormConfigInternal | JoinTable) {
    this.#logger.debug(`Checking if item ${JSON.stringify(item)} was updated`);
    const idColumn = formConfig.dataSource.idColumn;
    const wasUpdated = unchangedDbItems.some(
      unchangedDbItem => unchangedDbItem[idColumn] === item[idColumn]
        && JSON.stringify(unchangedDbItem) !== JSON.stringify(item)
    );
    this.#logger.debug(`Item ${JSON.stringify(item)} was ${wasUpdated ? '' : 'not '}updated`);
    return wasUpdated;
  }

  #getRemovedJoinItems(items: DataItem[], unchangedDbItems: DataItem[], formConfig: FormConfigInternal | JoinTable) {
    const idColumn = formConfig.dataSource.idColumn;
    return unchangedDbItems
      .filter(unchangedDbItem => !items.some(item => unchangedDbItem[idColumn] === item[idColumn]));
  }

  async #populateJoinTableData(
    createdJoinItems: string[],
    itemId: string | number,
    formConfig: FormConfigInternal | JoinTable
  ) {
    if (formConfig.relationship === 'manyToMany') {
      const joinTableData = createdJoinItems.map(id => ({
        [formConfig.on.self]: itemId,
        [formConfig.on.other]: id
      }));

      this.#logger.debug(`Inserting join table data for item ${itemId}`);
      const updateJoinTableResponse = await this.#pgClient
        .schema(formConfig.via.schema || this.#pgClient.schemaName!)
        .from(formConfig.via.tableName)
        .insert(joinTableData);

      if (updateJoinTableResponse.status !== 201) {
        throw new DatabaseError(`Could not create data for join table \
          ${formConfig.via.tableName}. ${updateJoinTableResponse?.error?.message}`, {
          errorCode: FormBackendErrorCode.JOIN_TABLE_DATA_CREATION_FAILED,
          detailedMessage: updateJoinTableResponse?.error?.message,
          tableName: updateJoinTableResponse?.error?.message
        });
      }
    }
  }

  async #removeFromJoinTable(itemId: string, joins: DataItem[], formConfig: FormConfigInternal | JoinTable) {
    this.#logger.debug(`Removing join table data for item ${itemId}`);

    // @ts-ignore
    const deleteFromJoinTableResponse = await this.#pgClient
      .schema(formConfig.via.schema || this.#pgClient.schemaName!)
      .from(formConfig.via.tableName)
      .delete()
      .eq(formConfig.on.self, itemId)
      .in(formConfig.on.other, joins.map(j => j[formConfig.dataSource.idColumn]));

    if (deleteFromJoinTableResponse.status !== 204) {
      throw new DatabaseError(`Could not delete data for join table \
          ${formConfig.via.tableName}. ${deleteFromJoinTableResponse?.error?.message}`, {
        errorCode: FormBackendErrorCode.JOIN_TABLE_DATA_DELETION_FAILED,
        detailedMessage: deleteFromJoinTableResponse?.error?.message,
        tableName: deleteFromJoinTableResponse?.error?.message
      });
    }
  }

  #filterIncludedProperties(item: DataItem, formConfig: FormConfigInternal | JoinTable) {
    const includedProperties = formConfig.includedProperties;
    const filteredData = includedProperties.reduce((acc: Record<string, any>, prop: any) => {
      if (!(prop in item)) {
        return { ...acc };
      }
      return {
        ...acc,
        [prop]: item[prop]
      };
    }, {});
    if (formConfig.relationship === Relationship.ONE_TO_MANY) {
      const fkCol = formConfig.on.self;
      if (fkCol in item) {
        filteredData[fkCol] = item[fkCol];
      }
    }
    return filteredData;
  }

  #filterJoinTables(item: DataItem, formConfig: FormConfigInternal | JoinTable) {
    const joinTablesToExclude = [
      ...FormConfigProcessor.getPropsWithJoinTables(formConfig, Relationship.MANY_TO_MANY),
      ...FormConfigProcessor.getPropsWithJoinTables(formConfig, Relationship.ONE_TO_MANY)
    ];
    const dataClone = structuredClone(item);
    return joinTablesToExclude.reduce((acc, prop) => {
      if (prop in item) {
        const {
          // eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/no-unused-vars
          [prop]: _,
          ...dataWithoutProp
        } = acc;
        return dataWithoutProp;
      }
      return {
        ...acc
      };
    }, dataClone);
  }

  #removeId(item: DataItem, formConfig: FormConfigInternal | JoinTable) {
    const idColumn = formConfig.dataSource.idColumn;
    if (!idColumn) {
      return item;
    }
    const {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      [idColumn]: _,
      ...dataWithoutId
    } = item;
    return dataWithoutId;
  }

  #isGeometryFormat(type: string) {
    const isGeometryFormat = /^(\w+\.)?geometry($|\((POINT)(, ?\d+)?\)$)/.test(type);
    const isLocationFormat = type === 'location';
    const isGeometrySelectionFormat = type === 'geometrySelection';
    return isGeometryFormat || isLocationFormat || isGeometrySelectionFormat;
  }

  #replaceEmptyGeometries(item: DataItem, formConfig: FormConfigInternal | JoinTable) {
    const itemClone = structuredClone(item);

    Object.keys(formConfig.properties)
      .filter(prop => this.#isGeometryFormat(formConfig.properties[prop].format), this)
      .forEach(prop => {
        if (itemClone[prop] === '') {
          itemClone[prop] = null;
        }
      });

    return itemClone;
  }

  #sanitizeData(item: DataItem, formConfig: FormConfigInternal | JoinTable) {
    const filteredData = this.#filterIncludedProperties(item, formConfig);
    const sanitizedDateData = this.replaceEmptyDateFields(filteredData, formConfig.properties);
    const dataWithoutJoinTables = this.#filterJoinTables(sanitizedDateData, formConfig);
    const dataWithEmptyGeometries = this.#replaceEmptyGeometries(dataWithoutJoinTables, formConfig);
    const filesValid = this.#fileProcessor.validateFileFields(dataWithEmptyGeometries, formConfig);
    if (!filesValid) {
      throw new GenericRequestError('Invalid file(s).', 400, {
        errorCode: FormBackendErrorCode.INVALID_FILE,
        detailedMessage: 'One or more files are invalid or missing.'
      });
    }
    // TODO check if we always want to remove the id or only if it is set to readonly
    return this.#removeId(dataWithEmptyGeometries, formConfig);
  }

  async #updateData(item: DataItem, itemId: string, formConfig: FormConfigInternal | JoinTable) {
    const tableName = formConfig.dataSource.tableName;
    const idColumn = formConfig.dataSource.idColumn;
    let isSuccess = false;
    if (!tableName || !idColumn) {
      return isSuccess;
    }

    // @ts-ignore
    const response = await this.#pgClient
      .schema(formConfig.dataSource.schema || this.#pgClient.schemaName!)
      .from(tableName)
      .update(item)
      .eq(idColumn, itemId);

    if (response.status !== 204) {
      this.#logger.error(`Could not update data for item ${itemId} of table ${tableName}. ${response?.error?.message}`);
      return isSuccess;
    }
    isSuccess = true;
    return isSuccess;
  }

  #createFormSelectStatement(formConfig: FormConfigInternal) {
    const idColumn = formConfig.dataSource.idColumn;
    const columns = structuredClone(formConfig.includedPropertiesTable)
      .filter((c: string) => {
        // filter out join table columns as they will be handled separately
        const columnConfig = formConfig.properties[c];
        const isJoinTable = columnConfig.resolveTable;
        return !isJoinTable;
      })
      .map((c: string) => {
        const prop = formConfig.properties[c];
        // create nested structure for lookup tables for allowing
        // ordering by lookup table display value.
        if (prop.resolveAsEnum && prop.resolveLookup) {
          const lookupTables = formConfig.dataSource.lookupTables;
          if (!lookupTables) {
            throw new GenericRequestError('Cannot create select statement. Missing lookupTables.', 500, {
              errorCode: FormBackendErrorCode.MISSING_LOOKUP_TABLES
            });
          }
          const refCol = lookupTables[c].includedProperties?.[0];
          if (!refCol) {
            throw new GenericRequestError(`Cannot create select statement. Missing includedProperties in
            lookupTable ${c}.`, 500, {
              errorCode: FormBackendErrorCode.MISSING_LOOKUP_COLUMNS
            });
          }
          return `${c}(${refCol},${prop.resolveToColumn})`;
        }
        return c;
      });

    if (idColumn && columns && !columns.includes(idColumn)) {
      columns.unshift(idColumn);
    }
    return columns.toString();
  }

  #createItemSelectStatement(formConfig: FormConfigInternal | JoinTable) {
    const idColumn = formConfig.dataSource.idColumn;
    const columns = formConfig.includedProperties
      .map((c: string) => {
        const columnConfig = formConfig.properties[c];
        const isJoinTable = !!columnConfig.resolveTable;
        if (isJoinTable) {
          const joinConfig = formConfig.dataSource.joinTables?.[c];
          if (!joinConfig) {
            throw new GenericRequestError(`No join table config found for property ${c}`, 500, {
              errorCode: FormBackendErrorCode.MISSING_LOOKUP_COLUMNS
            });
          }
          if (joinConfig.relationship === Relationship.MANY_TO_ONE) {
            return `${c}:${joinConfig.dataSource.tableName}(${this.#createItemSelectStatement(joinConfig)})`;
          }
          return `${c}(${this.#createItemSelectStatement(joinConfig)})`;
        }
        return c;
      });

    if (idColumn && columns && !columns.includes(idColumn)) {
      columns.unshift(idColumn);
    }
    return columns.toString();
  }

  #addFilterQuery(query: PostgrestFilterBuilder<any, any, any, any>, filter: FilterType) {
    const filterValue = filter?.filterValue?.trim();
    switch (filter?.filterOp) {
      case 'equals':
        query.eq(filter.filterKey, filterValue);
        break;
      case 'notEqual':
        query.neq(filter.filterKey, filterValue);
        break;
      case 'greaterThan':
        query.gt(filter.filterKey, filterValue);
        break;
      case 'lessThan':
        query.lt(filter.filterKey, filterValue);
        break;
      case 'like':
      case 'contains':
        query.ilike(filter.filterKey, `%${filterValue}%`);
        break;
      default:
        break;
    }
  }

  #addOrderQuery(query: PostgrestFilterBuilder<any, any, any, any>, formConfig: FormConfigInternal) {
    const orderBy = formConfig.dataSource.orderBy;
    const ascending = formConfig.dataSource.order === 'asc';
    const resolveAsEnum = formConfig.properties[orderBy].resolveAsEnum;
    const resolveLookup = formConfig.properties[orderBy].resolveLookup;

    let orderQuery;
    if (resolveAsEnum && resolveLookup) {
      orderQuery = `${orderBy}(${formConfig.properties[orderBy].resolveToColumn})`;
    } else {
      orderQuery = orderBy;
    }
    query.order(orderQuery, { ascending });
  }

  /**
   * Reconstruct table data from an orderable structure to a flat structure.
   * @param data The data to reconstruct.
   * @param formConfig The formConfig.
   * @returns The reconstructed table data.
   */
  #reconstructTableData (data: DataItem[], formConfig: FormConfigInternal) {
    const colsToReconstruct = formConfig.includedPropertiesTable
      .filter((c: string) => formConfig.properties[c].resolveAsEnum && formConfig.properties[c].resolveLookup);

    return data.map(item => {
      const itemClone = structuredClone(item);
      colsToReconstruct.forEach((c: string) => {
        const lookupTables = formConfig.dataSource.lookupTables;
        if (!lookupTables) {
          throw new GenericRequestError('Cannot reconstruct data. Missing lookupTables.', 500, {
            errorCode: FormBackendErrorCode.MISSING_LOOKUP_COLUMNS
          });
        }
        const refCol = lookupTables[c].includedProperties?.[0];
        if (!refCol) {
          throw new GenericRequestError(`Cannot reconstruct data. Missing includedProperties in
           lookupTable ${c}.`, 500, {
            errorCode: FormBackendErrorCode.MISSING_LOOKUP_COLUMNS
          });
        }
        itemClone[c] = itemClone[c]?.[refCol];
      });
      return itemClone;
    });
  }
}

export default DataProcessor;
