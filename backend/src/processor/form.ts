import { PostgrestClient } from '@supabase/postgrest-js';

import { DataItem } from '../types/data';
import { DbAction } from '../types/dbAction';
import { FormConfig } from '../types/formConfig';
import { Opts } from '../types/opts';

import DataProcessor from './data';
import FileProcessor from './file';
import FormConfigProcessor from './formConfig';

export class FormProcessor {
  #configProcessor: FormConfigProcessor;
  #dataProcessor: DataProcessor;
  #userRoles: string[];

  constructor(
    configProcessor: FormConfigProcessor,
    dataProcessor: DataProcessor,
    userRoles: string[]
  ) {
    this.#configProcessor = configProcessor;
    this.#dataProcessor = dataProcessor;
    this.#userRoles = userRoles;
  }

  static async createFormProcessor(
    opts: Opts,
    formConfig: FormConfig,
    formId: string,
    userRoles: string[],
    postgrestToken: string,
    order?: FormConfig['dataSource']['order'],
    orderBy?: FormConfig['dataSource']['orderBy']
  ) {
    const pgClient = new PostgrestClient(opts.POSTGREST_URL, {
      schema: opts.POSTGREST_DEFAULT_SCHEMA,
      headers: {
        Authorization: `Bearer ${postgrestToken}`
      }
    });

    const configProcessor = await FormConfigProcessor.createFormConfigProcessor(
      opts, formConfig, pgClient, postgrestToken, order, orderBy
    );
    const fileProcessor = new FileProcessor({opts, formId});
    const dataProcessor = new DataProcessor({pgClient, formId, opts}, fileProcessor);

    return new FormProcessor(configProcessor, dataProcessor, userRoles);
  }

  async getTableForm(page?: number, filter?: any) {
    const processedConfig = this.#configProcessor.getFormConfig();
    if (!processedConfig) {
      return;
    }
    const processedData = await this.#dataProcessor.getFormData(processedConfig, page, filter);
    const postProcessedConfig = this.#configProcessor.postProcessTableConfig(this.#userRoles);
    return {
      config: postProcessedConfig,
      data: processedData
    };
  }

  async getEmptyItemForm() {
    const processedConfig = this.#configProcessor.getFormConfig();
    if (!processedConfig) {
      return;
    }
    const postProcessedConfig = this.#configProcessor.postProcessItemConfig(this.#userRoles);
    return {
      config: postProcessedConfig,
      data: []
    };
  }

  async getItemForm(itemId: string) {
    const processedConfig = this.#configProcessor.getFormConfig();
    if (!processedConfig) {
      return;
    }
    const processedData = await this.#dataProcessor.getItemData(itemId, processedConfig);
    const postProcessedConfig = this.#configProcessor.postProcessItemConfig(this.#userRoles);
    return {
      config: postProcessedConfig,
      data: processedData
    };
  }

  async createFormItem(data: DataItem) {
    const processedConfig = this.#configProcessor.getFormConfig();
    if (!processedConfig) {
      return { success: false };
    }
    const createResponse = await this.#dataProcessor.handleData(data, processedConfig, DbAction.CREATE);
    return { id: createResponse, success: true };
  }

  async updateFormItem(data: DataItem, itemId: string) {
    const processedConfig = this.#configProcessor.getFormConfig();
    if (!processedConfig) {
      return { id: itemId, success: false };
    }
    data[processedConfig.dataSource.idColumn] = itemId;
    const updateResponse = await this.#dataProcessor.handleData(data, processedConfig, DbAction.UPDATE);
    return { id: updateResponse, success: true};
  }

  async deleteFormItem(itemId: string) {
    const processedConfig = this.#configProcessor.getFormConfig();
    if (!processedConfig) {
      return {
        id: undefined,
        success: false
      };
    }
    const item = {[processedConfig.dataSource.idColumn]: itemId};
    const deleteResponse = await this.#dataProcessor.handleData(item, processedConfig, DbAction.DELETE);
    return { id: deleteResponse, success: true};
  }
}

export default FormProcessor;
