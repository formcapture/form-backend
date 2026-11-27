import { PostgrestClient } from '@supabase/postgrest-js';

import { DbAction } from '../types/dbAction';
import { FormConfig } from '../types/formConfig';
import { Opts } from '../types/opts';

import DataProcessor from './data';
import FormProcessor from './form';
import FormConfigProcessor from './formConfig';

jest.mock('@supabase/postgrest-js', () => ({
  PostgrestClient: jest.fn()
}));

FormConfigProcessor.createFormConfigProcessor = jest.fn();

describe('FormProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  const userRoles: string[] = [];

  it('can be created', () => {
    const configProcessor = {} as FormConfigProcessor;
    const dataProcessor = {} as DataProcessor;
    const formProcessor = new FormProcessor(configProcessor, dataProcessor, userRoles);
    expect(formProcessor).toBeDefined();
  });

  it('sets a default schema always', async () => {
    const opts: Opts = {
      FORM_CONFIGS_DIR: '',
      FILE_UPLOAD_DIR: '',
      SIZE_LIMIT: '',
      KC_AUTH_SERVER_URL: '',
      KC_CLIENT_APP_ID: '',
      KC_PUBLIC_URL: 'my-kc-url',
      KC_PUBLIC_KEY: '',
      KC_REALM: '',
      POSTGREST_DEFAULT_SCHEMA: 'my-public-schema',
      POSTGREST_JWT_CLIENT_ID: '',
      POSTGREST_KEYCLOAK_CLIENT_SECRET: '',
      POSTGREST_URL: 'my-db-url'
    };

    const formConfig: FormConfig = {
      dataSource: {
        tableName: 'test',
        idColumn: 'id'
      },
      views: {
        item: true,
        table: true
      },
      access: {
        read: [],
        write: []
      }
    };

    const myToken = 'test-token';

    await FormProcessor.createFormProcessor(opts, formConfig, 'foo', userRoles, myToken);

    expect(PostgrestClient).toHaveBeenCalledTimes(1);
    expect(PostgrestClient).toHaveBeenCalledWith(opts.POSTGREST_URL, {
      headers: {
        Authorization: `Bearer ${myToken}`
      },
      schema: opts.POSTGREST_DEFAULT_SCHEMA
    });
  });

  describe('form and item methods', () => {
    const formConfig = {
      dataSource: { tableName: 'test', idColumn: 'id' }
    } as FormConfig;
    const roles = ['foo'];

    const createProcessor = (config: FormConfig | undefined) => {
      const configProcessor = {
        getFormConfig: jest.fn(() => config),
        postProcessTableConfig: jest.fn(() => 'tableConfig'),
        postProcessItemConfig: jest.fn(() => 'itemConfig')
      };
      const dataProcessor = {
        getFormData: jest.fn(async () => 'formData'),
        getItemData: jest.fn(async () => 'itemData'),
        handleData: jest.fn(async () => 42)
      };
      const formProcessor = new FormProcessor(
        configProcessor as unknown as FormConfigProcessor,
        dataProcessor as unknown as DataProcessor,
        roles
      );
      return { formProcessor, configProcessor, dataProcessor };
    };

    it('gets the table form', async () => {
      const { formProcessor, configProcessor, dataProcessor } = createProcessor(formConfig);
      const result = await formProcessor.getTableForm(0, 10, 'filter');
      expect(dataProcessor.getFormData).toHaveBeenCalledWith(formConfig, 0, 10, 'filter');
      expect(configProcessor.postProcessTableConfig).toHaveBeenCalledWith(roles);
      expect(result).toEqual({ config: 'tableConfig', data: 'formData' });
    });

    it('gets the empty item form', async () => {
      const { formProcessor, configProcessor } = createProcessor(formConfig);
      const result = await formProcessor.getEmptyItemForm();
      expect(configProcessor.postProcessItemConfig).toHaveBeenCalledWith(roles);
      expect(result).toEqual({ config: 'itemConfig', data: [] });
    });

    it('gets the item form', async () => {
      const { formProcessor, dataProcessor } = createProcessor(formConfig);
      const result = await formProcessor.getItemForm('1');
      expect(dataProcessor.getItemData).toHaveBeenCalledWith('1', formConfig);
      expect(result).toEqual({ config: 'itemConfig', data: 'itemData' });
    });

    it('creates a form item', async () => {
      const { formProcessor, dataProcessor } = createProcessor(formConfig);
      const result = await formProcessor.createFormItem({ foo: 'bar' });
      expect(dataProcessor.handleData).toHaveBeenCalledWith({ foo: 'bar' }, formConfig, DbAction.CREATE);
      expect(result).toEqual({ id: 42, success: true });
    });

    it('updates a form item and sets the id column', async () => {
      const { formProcessor, dataProcessor } = createProcessor(formConfig);
      const result = await formProcessor.updateFormItem({ foo: 'bar' }, '1');
      expect(dataProcessor.handleData).toHaveBeenCalledWith({ foo: 'bar', id: '1' }, formConfig, DbAction.UPDATE);
      expect(result).toEqual({ id: 42, success: true });
    });

    it('deletes a form item by its id column', async () => {
      const { formProcessor, dataProcessor } = createProcessor(formConfig);
      const result = await formProcessor.deleteFormItem('1');
      expect(dataProcessor.handleData).toHaveBeenCalledWith({ id: '1' }, formConfig, DbAction.DELETE);
      expect(result).toEqual({ id: 42, success: true });
    });

    it('returns early without a form config', async () => {
      const { formProcessor, dataProcessor } = createProcessor(undefined);
      expect(await formProcessor.getTableForm(0, 10)).toBeUndefined();
      expect(await formProcessor.getEmptyItemForm()).toBeUndefined();
      expect(await formProcessor.getItemForm('1')).toBeUndefined();
      expect(await formProcessor.createFormItem({})).toEqual({ success: false });
      expect(await formProcessor.updateFormItem({}, '1')).toEqual({ id: '1', success: false });
      expect(await formProcessor.deleteFormItem('1')).toEqual({ id: undefined, success: false });
      expect(dataProcessor.handleData).not.toHaveBeenCalled();
    });
  });
});
