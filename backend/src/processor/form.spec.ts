import { PostgrestClient } from '@supabase/postgrest-js';

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

  it.todo('checks if form can be read');
  it.todo('checks if form can be written');
  it.todo('checks if item view is enabled');

  it.todo('checks if table view is enabled');
  it.todo('checks if item view is enabled');
  it.todo('gets the form');
  it.todo('gets the form item');
  it.todo('updates the form item');
});
