import { PostgrestClient, PostgrestQueryBuilder } from '@supabase/postgrest-js';

import { FormBackendErrorCode } from '../errors/FormBackendErrorCode';
import { DbAction } from '../types/dbAction';
import { FormConfigInternal } from '../types/formConfigInternal';
import { Opts } from '../types/opts';
import { Relationship } from '../types/relationship';

import DataProcessor from './data';
import FileProcessor, { FileProcessorOpts } from './file';

jest.mock('@supabase/postgrest-js');

const mockLogger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
jest.mock('../logger', () => ({
  setupLogger: () => mockLogger
}));

const validateFileFieldsMock = jest.fn();
const createFilesMock = jest.fn();
const deleteFilesMock = jest.fn();
const getFilesFromItemMock = jest.fn();
const getEmptyFileFieldsMock = jest.fn();
const getItemWithoutFilesMock = jest.fn();

const createFileProcessorMock = jest.fn(() => {
  return {
    validateFileFields: validateFileFieldsMock,
    createFiles: createFilesMock,
    deleteFiles: deleteFilesMock,
    getFilesFromItem: getFilesFromItemMock,
    getEmptyFileFields: getEmptyFileFieldsMock,
    getItemWithoutFiles: getItemWithoutFilesMock
  };
});

const createQueryStub = (response: any) => {
  const query: any = {
    then: (resolve: any, reject: any) => Promise.resolve(response).then(resolve, reject)
  };
  ['order', 'range', 'eq', 'neq', 'gt', 'lt', 'ilike'].forEach((method) => {
    query[method] = jest.fn(() => query);
  });
  return query;
};

const createPgClientStub = (query: any) => {
  const select = jest.fn(() => query);
  const update = jest.fn(() => query);
  const from = jest.fn(() => ({ select, update }));
  const schema = jest.fn(() => ({ from }));
  const pgClient = { schemaName: 'public', schema } as unknown as PostgrestClient<any, any, any>;
  return { pgClient, schema, from, select, update };
};

describe('DataProcessor', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('can be created', () => {
    const pgClient = {} as PostgrestClient<any, any, any>;
    const dataProcessor = new DataProcessor(
      { pgClient, formId: '', opts: {} as Opts },
      new FileProcessor({} as FileProcessorOpts)
    );
    expect(dataProcessor).toBeDefined();
  });

  describe('getFormData', () => {
    const createFormConfig = (dataSource: Record<string, any> = {}) => ({
      dataSource: {
        tableName: 'test',
        idColumn: 'id',
        order: 'desc',
        orderBy: 'lookup',
        lookupTables: {
          lookup: { includedProperties: ['label'] }
        },
        ...dataSource
      },
      includedPropertiesTable: ['name', 'lookup', 'joined'],
      properties: {
        name: { type: 'string' },
        lookup: { resolveAsEnum: true, resolveLookup: true, resolveToColumn: 'lookup_id' },
        joined: { resolveTable: true }
      }
    } as unknown as FormConfigInternal);

    it('returns undefined without a table name', async () => {
      const pgClient = {} as PostgrestClient<any, any, any>;
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, {} as FileProcessor);
      const formConfig = createFormConfig({ tableName: undefined });
      const data = await dataProcessor.getFormData(formConfig, 0, 10, undefined as any);
      expect(data).toBeUndefined();
    });

    it('selects, orders, pages and flattens lookup columns', async () => {
      const query = createQueryStub({
        status: 200,
        count: 1,
        data: [{ id: 1, name: 'foo', lookup: { label: 'bar' } }]
      });
      const { pgClient, schema, from, select } = createPgClientStub(query);
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, {} as FileProcessor);

      const data = await dataProcessor.getFormData(createFormConfig(), 0, 10, undefined as any);

      expect(schema).toHaveBeenCalledWith('public');
      expect(from).toHaveBeenCalledWith('test');
      expect(select).toHaveBeenCalledWith('id,name,lookup(label,lookup_id)', { count: 'exact' });
      expect(query.order).toHaveBeenCalledWith('lookup(lookup_id)', { ascending: false });
      expect(query.range).toHaveBeenCalledWith(0, 9);
      expect(data).toEqual({ data: [{ id: 1, name: 'foo', lookup: 'bar' }], count: 1 });
    });

    it('orders by plain columns and uses the configured schema', async () => {
      const query = createQueryStub({ status: 200, count: 0, data: [] });
      const { pgClient, schema } = createPgClientStub(query);
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, {} as FileProcessor);

      const formConfig = createFormConfig({ schema: 'foo', orderBy: 'name', order: 'asc' });
      await dataProcessor.getFormData(formConfig, 0, 10, undefined as any);

      expect(schema).toHaveBeenCalledWith('foo');
      expect(query.order).toHaveBeenCalledWith('name', { ascending: true });
    });

    it.each([
      ['equals', 'eq', 'baz'],
      ['notEqual', 'neq', 'baz'],
      ['greaterThan', 'gt', 'baz'],
      ['lessThan', 'lt', 'baz'],
      ['like', 'ilike', '%baz%'],
      ['contains', 'ilike', '%baz%']
    ])('applies filter operator %s', async (filterOp, method, value) => {
      const query = createQueryStub({ status: 200, count: 0, data: [] });
      const { pgClient } = createPgClientStub(query);
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, {} as FileProcessor);

      await dataProcessor.getFormData(createFormConfig(), 0, 10, {
        filterKey: 'name',
        filterOp: filterOp as any,
        filterValue: ' baz '
      });

      expect(query[method]).toHaveBeenCalledWith('name', value);
    });

    it.each([
      { status: 500, data: null },
      { status: 200, error: { message: 'foo' }, data: null }
    ])('returns undefined for a failed request %p', async (response) => {
      const { pgClient } = createPgClientStub(createQueryStub(response));
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, {} as FileProcessor);

      expect(await dataProcessor.getFormData(createFormConfig(), 0, 10, undefined as any)).toBeUndefined();
    });

    it('throws if lookup tables are missing', async () => {
      const { pgClient } = createPgClientStub(createQueryStub({}));
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, {} as FileProcessor);

      await expect(dataProcessor.getFormData(createFormConfig({ lookupTables: undefined }), 0, 10, undefined as any))
        .rejects.toMatchObject({ status: 500, extra: { errorCode: FormBackendErrorCode.MISSING_LOOKUP_TABLES } });
    });

    it('throws if the lookup table has no included properties', async () => {
      const { pgClient } = createPgClientStub(createQueryStub({}));
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, {} as FileProcessor);
      const formConfig = createFormConfig({ lookupTables: { lookup: {} } });

      await expect(dataProcessor.getFormData(formConfig, 0, 10, undefined as any))
        .rejects.toMatchObject({ status: 500, extra: { errorCode: FormBackendErrorCode.MISSING_LOOKUP_COLUMNS } });
    });
  });

  describe('createItemData', () => {

    it('creates the item', async () => {
      const pgClient = new PostgrestClient('', undefined);
      const pgClientMockResponse = {
        status: 201,
        data: [{ id: '1' }]
      };

      const fromMock = jest.fn();
      pgClient.from = fromMock;
      const pgBuilder = new PostgrestQueryBuilder(new URL('http://example.com'), {});
      fromMock.mockReturnValue(pgBuilder);
      const insertMock = jest.fn(() => ({ select: () => pgClientMockResponse }));
      pgBuilder.insert = insertMock as any;
      const fileProcessorMock = createFileProcessorMock() as unknown as FileProcessor;
      getFilesFromItemMock.mockReturnValue({});
      validateFileFieldsMock.mockReturnValue(true);

      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessorMock);
      const formConfig: FormConfigInternal = {
        dataSource: {
          tableName: 'test',
          idColumn: 'id'
        },
        includedProperties: ['name'],
        properties: {
          name: {
            type: 'string'
          }
        }
      } as unknown as FormConfigInternal;
      const data = await dataProcessor.createItemData({ name: 'foo', id: '1' }, formConfig);
      getItemWithoutFilesMock.mockReturnValue(data);
      expect(data).toBeDefined();
      expect(data).toEqual({ success: true, id: '1' });
    });

    it('returns success=false if the item was not created', async () => {
      const pgClient = new PostgrestClient('', undefined);
      const pgClientMockResponse = {
        status: 404
      };

      const fromMock = jest.fn();
      pgClient.from = fromMock;
      const pgBuilder = new PostgrestQueryBuilder(new URL('http://example.com'), {});
      fromMock.mockReturnValue(pgBuilder);
      const insertMock = jest.fn(() => ({ select: () => pgClientMockResponse }));
      pgBuilder.insert = insertMock as any;
      const fileProcessorMock = createFileProcessorMock() as unknown as FileProcessor;
      getFilesFromItemMock.mockReturnValue({});
      validateFileFieldsMock.mockReturnValue(true);

      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessorMock);
      const formConfig: FormConfigInternal = {
        dataSource: {
          tableName: 'test'
        },
        includedProperties: ['name'],
        properties: {
          name: {
            type: 'string'
          }
        }
      } as unknown as FormConfigInternal;
      const data = await dataProcessor.createItemData({ name: 'foo' }, formConfig);
      getItemWithoutFilesMock.mockReturnValue(data);
      expect(data).toBeDefined();
      expect(data).toEqual({ success: false });
    });

    it('uploads files if given', async () => {
      const pgClient = new PostgrestClient('', undefined);
      const pgClientMockResponse = {
        status: 201,
        data: [{ id: '1' }]
      };

      const fromMock = jest.fn();
      pgClient.from = fromMock;
      const pgBuilder = new PostgrestQueryBuilder(new URL('http://example.com'), {});
      fromMock.mockReturnValue(pgBuilder);
      const insertMock = jest.fn(() => ({ select: () => pgClientMockResponse }));
      pgBuilder.insert = insertMock as any;

      const fileProcessorMock = createFileProcessorMock() as unknown as FileProcessor;
      validateFileFieldsMock.mockReturnValue(true);
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessorMock);
      const formConfig: FormConfigInternal = {
        dataSource: {
          tableName: 'test',
          idColumn: 'id'
        },
        includedProperties: ['file'],
        properties: {
          file: {
            type: 'string',
            media: {
              binaryEncoding: 'base64'
            }
          }
        }
      } as unknown as FormConfigInternal;
      const item = { file: 'data:image/png;base64,xxx', id: '1' };
      getFilesFromItemMock.mockReturnValue({ file: item.file });
      getItemWithoutFilesMock.mockReturnValue({ id: item.id });
      await dataProcessor.createItemData(item, formConfig);
      expect(createFilesMock).toHaveBeenCalled();
    });

    it('replaces empty date fields with null', async () => {
      const pgClient = new PostgrestClient('', undefined);
      const pgClientMockResponse = {
        status: 201,
        data: [{ id: '1' }]
      };

      const fromMock = jest.fn();
      pgClient.from = fromMock;
      const pgBuilder = new PostgrestQueryBuilder(new URL('http://example.com'), {});
      fromMock.mockReturnValue(pgBuilder);
      const insertMock = jest.fn(() => ({ select: () => pgClientMockResponse }));
      pgBuilder.insert = insertMock as any;
      const fileProcessorMock = createFileProcessorMock() as unknown as FileProcessor;

      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessorMock);
      const formConfig: FormConfigInternal = {
        dataSource: {
          tableName: 'test',
          idColumn: 'id'
        },
        includedProperties: ['id', 'date'],
        properties: {
          date: {
            format: 'date',
            type: 'string'
          }
        }
      } as unknown as FormConfigInternal;
      const sanitizedData = await dataProcessor.replaceEmptyDateFields({ date: '', id: '1'}, formConfig.properties);
      expect(sanitizedData).toHaveProperty('date', null);
    });
  });

  describe('deleteItemData', () => {
    it('deletes the item', async () => {
      const pgClient = new PostgrestClient('', undefined);
      const pgClientMockResponse = {
        status: 204
      };

      const fromMock = jest.fn();
      pgClient.from = fromMock;
      const eqMock = jest.fn(() => pgClientMockResponse);
      const pgFilterBuilderMock = jest.fn(() => ({ eq: eqMock }));
      const pgBuilder = new PostgrestQueryBuilder(new URL('http://example.com'), {});
      fromMock.mockReturnValue(pgBuilder);
      const deleteMock = jest.fn(() => pgFilterBuilderMock());
      pgBuilder.delete = deleteMock as any;
      const fileProcessorMock = createFileProcessorMock() as unknown as FileProcessor;

      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessorMock);
      const formConfig: FormConfigInternal = {
        dataSource: {
          tableName: 'test',
          idColumn: 'id'
        }
      } as unknown as FormConfigInternal;
      const data = await dataProcessor.deleteItemData('1', formConfig);
      expect(data).toBeDefined();
      expect(data).toEqual({ id: '1', success: true });
    });
    it('returns success=false if the item was not deleted', async () => {
      const pgClient = new PostgrestClient('', undefined);
      const pgClientMockResponse = {
        status: 404
      };

      const fromMock = jest.fn();
      pgClient.from = fromMock;
      const eqMock = jest.fn(() => pgClientMockResponse);
      const pgFilterBuilderMock = jest.fn(() => ({ eq: eqMock }));
      const pgBuilder = new PostgrestQueryBuilder(new URL('http://example.com'), {});
      fromMock.mockReturnValue(pgBuilder);
      const deleteMock = jest.fn(() => pgFilterBuilderMock());
      pgBuilder.delete = deleteMock as any;
      const fileProcessorMock = createFileProcessorMock() as unknown as FileProcessor;

      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessorMock);
      const formConfig: FormConfigInternal = {
        dataSource: {
          tableName: 'test',
          idColumn: 'id'
        }
      } as unknown as FormConfigInternal;
      const data = await dataProcessor.deleteItemData('1', formConfig);
      expect(data).toBeDefined();
      expect(data).toEqual({ id: '1', success: false });
    });
    it('deletes files', async () => {
      const pgClient = new PostgrestClient('', undefined);
      const pgClientMockResponse = {
        status: 404
      };

      const fromMock = jest.fn();
      pgClient.from = fromMock;
      const eqMock = jest.fn(() => pgClientMockResponse);
      const pgFilterBuilderMock = jest.fn(() => ({ eq: eqMock }));
      const pgBuilder = new PostgrestQueryBuilder(new URL('http://example.com'), {});
      fromMock.mockReturnValue(pgBuilder);
      const deleteMock = jest.fn(() => pgFilterBuilderMock());
      pgBuilder.delete = deleteMock as any;
      const fileProcessorMock = createFileProcessorMock() as unknown as FileProcessor;

      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessorMock);
      const formConfig: FormConfigInternal = {
        dataSource: {
          tableName: 'test',
          idColumn: 'id'
        }
      } as unknown as FormConfigInternal;
      await dataProcessor.deleteItemData('1', formConfig);
      expect(deleteFilesMock).toHaveBeenCalled();
    });
  });

  describe('getItemData', () => {
    const formConfig = {
      dataSource: {
        tableName: 'test',
        idColumn: 'id',
        joinTables: {
          owner: {
            relationship: Relationship.MANY_TO_ONE,
            dataSource: { tableName: 'person', idColumn: 'pid' },
            includedProperties: ['pname'],
            properties: { pname: { type: 'string' } }
          },
          tags: {
            relationship: Relationship.ONE_TO_MANY,
            dataSource: { tableName: 'tag', idColumn: 'tid' },
            includedProperties: ['tid', 'label'],
            properties: { tid: { type: 'string' }, label: { type: 'string' } }
          }
        }
      },
      includedProperties: ['name', 'owner', 'tags'],
      properties: {
        name: { type: 'string' },
        owner: { resolveTable: true },
        tags: { resolveTable: true }
      }
    } as unknown as FormConfigInternal;

    it('selects the item including its join tables', async () => {
      const query = createQueryStub({ status: 200, data: [{ id: '1' }] });
      const { pgClient, select } = createPgClientStub(query);
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, {} as FileProcessor);

      const data = await dataProcessor.getItemData('1', formConfig);

      expect(select).toHaveBeenCalledWith('id,name,owner:person(pid,pname),tags(tid,label)');
      expect(query.eq).toHaveBeenCalledWith('id', '1');
      expect(data).toEqual({ data: [{ id: '1' }] });
    });

    it('returns undefined for a failed request', async () => {
      const { pgClient } = createPgClientStub(createQueryStub({ status: 404, data: null }));
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, {} as FileProcessor);

      expect(await dataProcessor.getItemData('1', formConfig)).toBeUndefined();
    });

    it.each([
      ['no item id', undefined, formConfig],
      ['no table name', '1', { ...formConfig, dataSource: { idColumn: 'id' } }],
      ['no id column', '1', { ...formConfig, dataSource: { tableName: 'test' } }]
    ])('returns undefined with %s', async (_, itemId, config) => {
      const { pgClient, select } = createPgClientStub(createQueryStub({}));
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, {} as FileProcessor);

      expect(await dataProcessor.getItemData(itemId as any, config as FormConfigInternal)).toBeUndefined();
      expect(select).not.toHaveBeenCalled();
    });

    it('throws if a join table config is missing', async () => {
      const { pgClient } = createPgClientStub(createQueryStub({}));
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, {} as FileProcessor);
      const config = { ...formConfig, dataSource: { tableName: 'test', idColumn: 'id' } } as FormConfigInternal;

      await expect(dataProcessor.getItemData('1', config))
        .rejects.toMatchObject({ extra: { errorCode: FormBackendErrorCode.MISSING_LOOKUP_COLUMNS } });
    });
  });

  describe('handleData', () => {
    it('handles create actions', async () => {
      const item = { name: 'foo' };
      const formConfig: FormConfigInternal = {
        dataSource: {
          tableName: 'test',
          idColumn: 'id'
        },
        includedProperties: ['name'],
        properties: {
          name: {
            type: 'string'
          }
        }
      } as unknown as FormConfigInternal;
      const pgClient = {} as PostgrestClient<any, any, any>;
      const fileProcessor = {} as FileProcessor;
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessor);

      const createItemDataSpy = jest
        .spyOn(dataProcessor, 'createItemData')
        .mockResolvedValue({ success: true, id: '1' });

      await dataProcessor.handleData(item, formConfig, DbAction.CREATE);

      expect(createItemDataSpy).toHaveBeenCalled();
    });
    it('handles update actions', async () => {
      const item = { name: 'foo', id: '1' };
      const formConfig: FormConfigInternal = {
        dataSource: {
          tableName: 'test',
          idColumn: 'id'
        },
        includedProperties: ['name'],
        properties: {
          name: {
            type: 'string'
          }
        }
      } as unknown as FormConfigInternal;
      const pgClient = {} as PostgrestClient<any, any, any>;
      const fileProcessor = {} as FileProcessor;
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessor);

      const updateItemDataSpy = jest
        .spyOn(dataProcessor, 'updateItemData')
        .mockResolvedValue({ success: true, id: '1' });

      await dataProcessor.handleData(item, formConfig, DbAction.UPDATE);

      expect(updateItemDataSpy).toHaveBeenCalled();
    });
    it('handles delete actions', async () => {
      const item = { name: 'foo', id: '1' };
      const formConfig: FormConfigInternal = {
        dataSource: {
          tableName: 'test',
          idColumn: 'id'
        },
        includedProperties: ['name'],
        properties: {
          name: {
            type: 'string'
          }
        }
      } as unknown as FormConfigInternal;
      const pgClient = {} as PostgrestClient<any, any, any>;
      const fileProcessor = {} as FileProcessor;
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessor);

      const deleteItemDataSpy = jest
        .spyOn(dataProcessor, 'deleteItemData')
        .mockResolvedValue({ success: true, id: '1' });

      await dataProcessor.handleData(item, formConfig, DbAction.DELETE);

      expect(deleteItemDataSpy).toHaveBeenCalled();
    });

    describe('one-to-one relationships', () => {
      it('returns early when referenced data is unchanged', async () => {
        const item = { name: 'foo', id: '1', bar: { id: 'a', value: 'baz' } };
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test',
            idColumn: 'id',
            joinTables: {
              bar: {
                relationship: Relationship.ONE_TO_ONE,
                dataSource: {
                  tableName: 'bar',
                  idColumn: 'id'
                },
                includedProperties: ['id', 'value'],
                properties: {
                  id: {
                    type: 'string'
                  },
                  value: {
                    type: 'string'
                  }
                }
              }
            }
          },
          includedProperties: ['name', 'bar'],
          properties: {
            name: {
              type: 'string'
            },
            bar: {
              resolveTable: true
            }
          }
        } as unknown as FormConfigInternal;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const fileProcessor = {} as FileProcessor;
        const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessor);

        const createItemDataSpy = jest
          .spyOn(dataProcessor, 'createItemData')
          .mockResolvedValue({ success: true, id: '1' });

        jest.spyOn(dataProcessor, 'getItemData')
          .mockResolvedValue({ data: [{ id: 'a', value: 'baz' }] });

        const handleDataSpy = jest.spyOn(dataProcessor, 'handleData');

        await dataProcessor.handleData(item, formConfig, DbAction.CREATE);

        expect(createItemDataSpy).toHaveBeenCalledWith({ ...item, bar: 'a' }, formConfig, undefined);
        expect(handleDataSpy).toHaveBeenCalledTimes(1);
      });
      it('updates the referenced data, if it was changed', async () => {
        const item = { name: 'foo', id: '1', bar: { id: 'a', value: 'baz' } };
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test',
            idColumn: 'id',
            joinTables: {
              bar: {
                relationship: Relationship.ONE_TO_ONE,
                dataSource: {
                  tableName: 'bar',
                  idColumn: 'id'
                },
                includedProperties: ['id', 'value'],
                properties: {
                  id: {
                    type: 'string'
                  },
                  value: {
                    type: 'string'
                  }
                }
              }
            }
          },
          includedProperties: ['name', 'bar'],
          properties: {
            name: {
              type: 'string'
            },
            bar: {
              resolveTable: true
            }
          }
        } as unknown as FormConfigInternal;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const fileProcessor = {} as FileProcessor;
        const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessor);

        jest
          .spyOn(dataProcessor, 'createItemData')
          .mockResolvedValue({ success: true, id: '1' });

        jest
          .spyOn(dataProcessor, 'updateItemData')
          .mockResolvedValue({ success: true, id: 'a' });

        jest.spyOn(dataProcessor, 'getItemData')
          .mockResolvedValue({ data: [{ id: 'a', value: 'faz' }] });

        const handleDataSpy = jest.spyOn(dataProcessor, 'handleData');

        await dataProcessor.handleData(item, formConfig, DbAction.CREATE);

        expect(handleDataSpy).toHaveBeenCalledTimes(2);
        expect(handleDataSpy).toHaveBeenNthCalledWith(
          2, { id: 'a', value: 'baz' }, formConfig.dataSource.joinTables!.bar, DbAction.UPDATE, ['bar']
        );
      });
      it('creates the referenced data, if it does not exist yet', async () => {
        const item = { name: 'foo', id: '1', bar: { id: 'a', value: 'baz' } };
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test',
            idColumn: 'id',
            joinTables: {
              bar: {
                relationship: Relationship.ONE_TO_ONE,
                dataSource: {
                  tableName: 'bar',
                  idColumn: 'id'
                },
                includedProperties: ['id', 'value'],
                properties: {
                  id: {
                    type: 'string'
                  },
                  value: {
                    type: 'string'
                  }
                }
              }
            }
          },
          includedProperties: ['name', 'bar'],
          properties: {
            name: {
              type: 'string'
            },
            bar: {
              resolveTable: true
            }
          }
        } as unknown as FormConfigInternal;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const fileProcessor = {} as FileProcessor;
        const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessor);

        jest
          .spyOn(dataProcessor, 'createItemData')
          .mockResolvedValue({ success: true, id: '1' });

        jest.spyOn(dataProcessor, 'getItemData')
          .mockResolvedValue({ data: [] });

        const handleDataSpy = jest.spyOn(dataProcessor, 'handleData');

        await dataProcessor.handleData(item, formConfig, DbAction.CREATE);

        expect(handleDataSpy).toHaveBeenCalledTimes(2);
        expect(handleDataSpy).toHaveBeenNthCalledWith(
          2, { id: 'a', value: 'baz' }, formConfig.dataSource.joinTables!.bar, DbAction.CREATE, ['bar']
        );
      });
    });
    describe('many-to-one relationships', () => {
      it('returns early when referenced data is unchanged', async () => {
        const item = { name: 'foo', id: '1', bar: { id: 'a', value: 'baz' } };
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test',
            idColumn: 'id',
            joinTables: {
              bar: {
                relationship: Relationship.MANY_TO_ONE,
                dataSource: {
                  tableName: 'bar',
                  idColumn: 'id'
                },
                includedProperties: ['id', 'value'],
                properties: {
                  id: {
                    type: 'string'
                  },
                  value: {
                    type: 'string'
                  }
                }
              }
            }
          },
          includedProperties: ['name', 'bar'],
          properties: {
            name: {
              type: 'string'
            },
            bar: {
              resolveTable: true
            }
          }
        } as unknown as FormConfigInternal;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const fileProcessor = {} as FileProcessor;
        const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessor);

        const createItemDataSpy = jest
          .spyOn(dataProcessor, 'createItemData')
          .mockResolvedValue({ success: true, id: '1' });

        jest.spyOn(dataProcessor, 'getItemData')
          .mockResolvedValue({ data: [{ id: 'a', value: 'baz' }] });

        const handleDataSpy = jest.spyOn(dataProcessor, 'handleData');

        await dataProcessor.handleData(item, formConfig, DbAction.CREATE);

        expect(createItemDataSpy).toHaveBeenCalledWith({ ...item, bar: 'a' }, formConfig, undefined);
        expect(handleDataSpy).toHaveBeenCalledTimes(1);
      });
      it('updates the referenced data, if it was changed', async () => {
        const item = { name: 'foo', id: '1', bar: { id: 'a', value: 'baz' } };
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test',
            idColumn: 'id',
            joinTables: {
              bar: {
                relationship: Relationship.MANY_TO_ONE,
                dataSource: {
                  tableName: 'bar',
                  idColumn: 'id'
                },
                includedProperties: ['id', 'value'],
                properties: {
                  id: {
                    type: 'string'
                  },
                  value: {
                    type: 'string'
                  }
                }
              }
            }
          },
          includedProperties: ['name', 'bar'],
          properties: {
            name: {
              type: 'string'
            },
            bar: {
              resolveTable: true
            }
          }
        } as unknown as FormConfigInternal;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const fileProcessor = {} as FileProcessor;
        const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessor);

        jest
          .spyOn(dataProcessor, 'createItemData')
          .mockResolvedValue({ success: true, id: '1' });

        jest
          .spyOn(dataProcessor, 'updateItemData')
          .mockResolvedValue({ success: true, id: 'a' });

        jest.spyOn(dataProcessor, 'getItemData')
          .mockResolvedValue({ data: [{ id: 'a', value: 'faz' }] });

        const handleDataSpy = jest.spyOn(dataProcessor, 'handleData');

        await dataProcessor.handleData(item, formConfig, DbAction.CREATE);

        expect(handleDataSpy).toHaveBeenCalledTimes(2);
        expect(handleDataSpy).toHaveBeenNthCalledWith(
          2, { id: 'a', value: 'baz' }, formConfig.dataSource.joinTables!.bar, DbAction.UPDATE, ['bar']
        );
      });
      it('creates the referenced data, if it does not exist yet', async () => {
        const item = { name: 'foo', id: '1', bar: { id: 'a', value: 'baz' } };
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test',
            idColumn: 'id',
            joinTables: {
              bar: {
                relationship: Relationship.MANY_TO_ONE,
                dataSource: {
                  tableName: 'bar',
                  idColumn: 'id'
                },
                includedProperties: ['id', 'value'],
                properties: {
                  id: {
                    type: 'string'
                  },
                  value: {
                    type: 'string'
                  }
                }
              }
            }
          },
          includedProperties: ['name', 'bar'],
          properties: {
            name: {
              type: 'string'
            },
            bar: {
              resolveTable: true
            }
          }
        } as unknown as FormConfigInternal;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const fileProcessor = {} as FileProcessor;
        const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessor);

        jest
          .spyOn(dataProcessor, 'createItemData')
          .mockResolvedValue({ success: true, id: '1' });

        jest.spyOn(dataProcessor, 'getItemData')
          .mockResolvedValue({ data: [] });

        const handleDataSpy = jest.spyOn(dataProcessor, 'handleData');

        await dataProcessor.handleData(item, formConfig, DbAction.CREATE);

        expect(handleDataSpy).toHaveBeenCalledTimes(2);
        expect(handleDataSpy).toHaveBeenNthCalledWith(
          2, { id: 'a', value: 'baz' }, formConfig.dataSource.joinTables!.bar, DbAction.CREATE, ['bar']
        );
      });
    });
    describe('one-to-many relationships', () => {
      it('returns early when referenced data is unchanged', async () => {
        const item = { name: 'foo', id: '1', bar: [{ id: 'a', value: 'baz' }] };
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test',
            idColumn: 'id',
            joinTables: {
              bar: {
                relationship: Relationship.ONE_TO_MANY,
                dataSource: {
                  tableName: 'bar',
                  idColumn: 'id'
                },
                on: {
                  self: 'test_id'
                },
                includedProperties: ['id', 'value'],
                properties: {
                  id: {
                    type: 'string'
                  },
                  value: {
                    type: 'string'
                  }
                }
              }
            }
          },
          includedProperties: ['name', 'bar'],
          properties: {
            name: {
              type: 'string'
            },
            bar: {
              resolveTable: true
            }
          }
        } as unknown as FormConfigInternal;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const fileProcessor = {} as FileProcessor;
        const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessor);

        jest
          .spyOn(dataProcessor, 'createItemData')
          .mockResolvedValue({ success: true, id: '1' });

        jest.spyOn(dataProcessor, 'getItemData')
          .mockResolvedValue({ data: [{ bar: [{ id: 'a', value: 'baz' }] }] });

        const handleDataSpy = jest.spyOn(dataProcessor, 'handleData');

        await dataProcessor.handleData(item, formConfig, DbAction.CREATE);

        expect(handleDataSpy).toHaveBeenCalledTimes(1);
      });
      it('updates the referenced data, if it was changed', async () => {
        const item = { name: 'foo', id: '1', bar: [{ id: 'a', value: 'baz' }] };
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test',
            idColumn: 'id',
            joinTables: {
              bar: {
                relationship: Relationship.ONE_TO_MANY,
                dataSource: {
                  tableName: 'bar',
                  idColumn: 'id'
                },
                on: {
                  self: 'testId'
                },
                includedProperties: ['id', 'value'],
                properties: {
                  id: {
                    type: 'string'
                  },
                  value: {
                    type: 'string'
                  }
                }
              }
            }
          },
          includedProperties: ['name', 'bar'],
          properties: {
            name: {
              type: 'string'
            },
            bar: {
              resolveTable: true
            }
          }
        } as unknown as FormConfigInternal;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const fileProcessor = {} as FileProcessor;
        const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessor);

        jest
          .spyOn(dataProcessor, 'createItemData')
          .mockResolvedValue({ success: true, id: '1' });

        jest
          .spyOn(dataProcessor, 'updateItemData')
          .mockResolvedValue({ success: true, id: 'a' });

        jest.spyOn(dataProcessor, 'getItemData')
          .mockResolvedValue({ data: [{ bar: [{ id: 'a', value: 'faz' }] }] });

        const handleDataSpy = jest.spyOn(dataProcessor, 'handleData');

        await dataProcessor.handleData(item, formConfig, DbAction.CREATE);

        expect(handleDataSpy).toHaveBeenCalledTimes(2);
        expect(handleDataSpy).toHaveBeenNthCalledWith(
          2, { id: 'a', value: 'baz', testId: '1' }, formConfig.dataSource.joinTables!.bar, DbAction.UPDATE, ['bar']
        );
      });
      it('creates the referenced data, if it was changed', async () => {
        const item = { name: 'foo', id: '1', bar: [{ id: 'a', value: 'baz' }] };
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test',
            idColumn: 'id',
            joinTables: {
              bar: {
                relationship: Relationship.ONE_TO_MANY,
                dataSource: {
                  tableName: 'bar',
                  idColumn: 'id'
                },
                on: {
                  self: 'testId'
                },
                includedProperties: ['id', 'value'],
                properties: {
                  id: {
                    type: 'string'
                  },
                  value: {
                    type: 'string'
                  }
                }
              }
            }
          },
          includedProperties: ['name', 'bar'],
          properties: {
            name: {
              type: 'string'
            },
            bar: {
              resolveTable: true
            }
          }
        } as unknown as FormConfigInternal;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const fileProcessor = {} as FileProcessor;
        const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessor);

        jest
          .spyOn(dataProcessor, 'createItemData')
          .mockResolvedValue({ success: true, id: '1' });

        jest.spyOn(dataProcessor, 'getItemData')
          .mockResolvedValue({ data: [{ bar: [] }] });

        const handleDataSpy = jest.spyOn(dataProcessor, 'handleData');

        await dataProcessor.handleData(item, formConfig, DbAction.CREATE);

        expect(handleDataSpy).toHaveBeenCalledTimes(2);
        expect(handleDataSpy).toHaveBeenNthCalledWith(
          2, { id: 'a', value: 'baz', testId: '1' }, formConfig.dataSource.joinTables!.bar, DbAction.CREATE, ['bar']
        );
      });
    });
    describe('many-to-many relationships', () => {
      it('returns early when referenced data is unchanged', async () => {
        const item = { name: 'foo', id: '1', bar: [{ id: 'a', value: 'baz' }] };
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test',
            idColumn: 'id',
            joinTables: {
              bar: {
                relationship: Relationship.MANY_TO_MANY,
                dataSource: {
                  tableName: 'bar',
                  idColumn: 'id'
                },
                on: {
                  self: 'test_id',
                  other: 'bar_id'
                },
                via: {
                  tableName: 'test_bar'
                },
                includedProperties: ['id', 'value'],
                properties: {
                  id: {
                    type: 'string'
                  },
                  value: {
                    type: 'string'
                  }
                }
              }
            }
          },
          includedProperties: ['name', 'bar'],
          properties: {
            name: {
              type: 'string'
            },
            bar: {
              resolveTable: true
            }
          }
        } as unknown as FormConfigInternal;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const fileProcessor = {} as FileProcessor;
        const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessor);

        jest
          .spyOn(dataProcessor, 'createItemData')
          .mockResolvedValue({ success: true, id: '1' });

        jest.spyOn(dataProcessor, 'getItemData')
          .mockResolvedValue({ data: [{ bar: [{ id: 'a', value: 'baz' }] }] });

        const handleDataSpy = jest.spyOn(dataProcessor, 'handleData');

        await dataProcessor.handleData(item, formConfig, DbAction.CREATE);

        expect(handleDataSpy).toHaveBeenCalledTimes(1);
      });
      it('updates the referenced data, if it was changed', async () => {
        const item = { name: 'foo', id: '1', bar: [{ id: 'a', value: 'baz' }] };
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test',
            idColumn: 'id',
            joinTables: {
              bar: {
                relationship: Relationship.MANY_TO_MANY,
                dataSource: {
                  tableName: 'bar',
                  idColumn: 'id'
                },
                on: {
                  self: 'test_id',
                  other: 'bar_id'
                },
                via: {
                  tableName: 'test_bar'
                },
                includedProperties: ['id', 'value'],
                properties: {
                  id: {
                    type: 'string'
                  },
                  value: {
                    type: 'string'
                  }
                }
              }
            }
          },
          includedProperties: ['name', 'bar'],
          properties: {
            name: {
              type: 'string'
            },
            bar: {
              resolveTable: true
            }
          }
        } as unknown as FormConfigInternal;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const fileProcessor = {} as FileProcessor;
        const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessor);

        jest
          .spyOn(dataProcessor, 'createItemData')
          .mockResolvedValue({ success: true, id: '1' });

        jest
          .spyOn(dataProcessor, 'updateItemData')
          .mockResolvedValue({ success: true, id: 'a' });

        jest.spyOn(dataProcessor, 'getItemData')
          .mockResolvedValue({ data: [{ bar: [{ id: 'a', value: 'faz' }] }] });

        const handleDataSpy = jest.spyOn(dataProcessor, 'handleData');

        await dataProcessor.handleData(item, formConfig, DbAction.CREATE);

        expect(handleDataSpy).toHaveBeenCalledTimes(2);
        expect(handleDataSpy).toHaveBeenNthCalledWith(
          2, { id: 'a', value: 'baz' }, formConfig.dataSource.joinTables!.bar, DbAction.UPDATE, ['bar']
        );
      });
      it('creates the referenced data, if it was changed', async () => {
        const item = { name: 'foo', id: '1', bar: [{ value: 'baz' }] };
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test',
            idColumn: 'id',
            joinTables: {
              bar: {
                relationship: Relationship.MANY_TO_MANY,
                dataSource: {
                  tableName: 'bar',
                  idColumn: 'id'
                },
                on: {
                  self: 'test_id',
                  other: 'bar_id'
                },
                via: {
                  tableName: 'test_bar'
                },
                includedProperties: ['id', 'value'],
                properties: {
                  id: {
                    type: 'string'
                  },
                  value: {
                    type: 'string'
                  }
                }
              }
            }
          },
          includedProperties: ['name', 'bar'],
          properties: {
            name: {
              type: 'string'
            },
            bar: {
              resolveTable: true
            }
          }
        } as unknown as FormConfigInternal;
        const pgClient = new PostgrestClient('', undefined);
        const pgClientMockResponse = {
          status: 201,
          data: [{ id: '1' }]
        };

        const fromMock = jest.fn();
        pgClient.from = fromMock;
        const pgBuilder = new PostgrestQueryBuilder(new URL('http://example.com'), {});
        fromMock.mockReturnValue(pgBuilder);
        const insertMock = jest.fn(() => pgClientMockResponse);
        pgBuilder.insert = insertMock as any;
        const fileProcessor = {} as FileProcessor;
        const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessor);

        jest
          .spyOn(dataProcessor, 'createItemData')
          .mockResolvedValue({ success: true, id: '1' });

        jest.spyOn(dataProcessor, 'getItemData')
          .mockResolvedValue({ data: [{ bar: [] }] });

        const handleDataSpy = jest.spyOn(dataProcessor, 'handleData');

        await dataProcessor.handleData(item, formConfig, DbAction.CREATE);

        expect(handleDataSpy).toHaveBeenCalledTimes(2);
        expect(handleDataSpy).toHaveBeenNthCalledWith(
          2, { value: 'baz' }, formConfig.dataSource.joinTables!.bar, DbAction.CREATE, ['bar']
        );
      });
      it('adds new relations to the join table', async () => {
        const item = { name: 'foo', id: '1', bar: [{ value: 'baz' }] };
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test',
            idColumn: 'id',
            joinTables: {
              bar: {
                relationship: Relationship.MANY_TO_MANY,
                dataSource: {
                  tableName: 'bar',
                  idColumn: 'id'
                },
                on: {
                  self: 'testId',
                  other: 'barId'
                },
                via: {
                  tableName: 'test_bar'
                },
                includedProperties: ['id', 'value'],
                properties: {
                  id: {
                    type: 'string'
                  },
                  value: {
                    type: 'string'
                  }
                }
              }
            }
          },
          includedProperties: ['name', 'bar'],
          properties: {
            name: {
              type: 'string'
            },
            bar: {
              resolveTable: true
            }
          }
        } as unknown as FormConfigInternal;
        const pgClient = new PostgrestClient('', undefined);
        const pgClientMockResponse = {
          status: 201,
          data: [{ id: '1' }]
        };

        const fromMock = jest.fn();
        pgClient.from = fromMock;
        const pgBuilder = new PostgrestQueryBuilder(new URL('http://example.com'), {});
        fromMock.mockReturnValue(pgBuilder);
        const insertMock = jest.fn(() => pgClientMockResponse);
        pgBuilder.insert = insertMock as any;
        const fileProcessor = {} as FileProcessor;
        const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessor);

        jest
          .spyOn(dataProcessor, 'createItemData')
          .mockResolvedValue({ success: true, id: '1' });

        jest.spyOn(dataProcessor, 'getItemData')
          .mockResolvedValue({ data: [{ bar: [] }] });

        await dataProcessor.handleData(item, formConfig, DbAction.CREATE);

        expect(insertMock).toHaveBeenCalledWith([{ testId: '1', barId: '1' }]);
      });
      it('removes old relations from the join table', async () => {
        const item = { name: 'foo', id: '1', bar: [] };
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test',
            idColumn: 'id',
            joinTables: {
              bar: {
                relationship: Relationship.MANY_TO_MANY,
                dataSource: {
                  tableName: 'bar',
                  idColumn: 'id'
                },
                on: {
                  self: 'testId',
                  other: 'barId'
                },
                via: {
                  tableName: 'test_bar'
                },
                includedProperties: ['id', 'value'],
                properties: {
                  id: {
                    type: 'string'
                  },
                  value: {
                    type: 'string'
                  }
                }
              }
            }
          },
          includedProperties: ['name', 'bar'],
          properties: {
            name: {
              type: 'string'
            },
            bar: {
              resolveTable: true
            }
          }
        } as unknown as FormConfigInternal;
        const pgClient = new PostgrestClient('', undefined);
        const pgClientMockResponse = {
          eq: jest.fn(() => ({
            in: jest.fn(() => ({ status: 204 }))
          }))
        };

        const fromMock = jest.fn();
        pgClient.from = fromMock;
        const pgBuilder = new PostgrestQueryBuilder(new URL('http://example.com'), {});
        fromMock.mockReturnValue(pgBuilder);
        const deleteMock = jest.fn(() => pgClientMockResponse);
        pgBuilder.delete = deleteMock as any;
        const fileProcessor = {} as FileProcessor;
        const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, fileProcessor);

        jest
          .spyOn(dataProcessor, 'createItemData')
          .mockResolvedValue({ success: true, id: '1' });

        jest.spyOn(dataProcessor, 'getItemData')
          .mockResolvedValue({ data: [{ bar: [{ id: 'a', value: 'baz' }] }] });

        await dataProcessor.handleData(item, formConfig, DbAction.CREATE);

        expect(deleteMock).toHaveBeenCalledTimes(1);
      });
    });
  });
  describe('updateItemData', () => {
    const joinTableConfig = {
      relationship: Relationship.ONE_TO_MANY,
      on: { self: 'testId' },
      dataSource: {
        tableName: 'test',
        idColumn: 'id',
        joinTables: {
          tags: { relationship: Relationship.MANY_TO_MANY }
        }
      },
      includedProperties: ['name', 'tags'],
      properties: {
        name: { type: 'string' },
        tags: { resolveTable: true }
      }
    } as unknown as FormConfigInternal;

    const setupFileProcessor = () => {
      validateFileFieldsMock.mockReturnValue(true);
      getFilesFromItemMock.mockReturnValue({});
      createFilesMock.mockImplementation(async ({ item }) => item);
      getEmptyFileFieldsMock.mockReturnValue([]);
      deleteFilesMock.mockResolvedValue(undefined);
      return createFileProcessorMock() as unknown as FileProcessor;
    };

    it('updates the sanitized item', async () => {
      const query = createQueryStub({ status: 204 });
      const { pgClient, update } = createPgClientStub(query);
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, setupFileProcessor());

      const result = await dataProcessor.updateItemData(
        { id: '1', name: 'foo', tags: [{ id: 'a' }], other: 'bar', testId: 5 }, '1', joinTableConfig, 'foo'
      );

      // keeps the one-to-many foreign key, drops the id, join table props and not included props
      expect(update).toHaveBeenCalledWith({ name: 'foo', testId: 5 });
      expect(query.eq).toHaveBeenCalledWith('id', '1');
      expect(deleteFilesMock).toHaveBeenCalledWith('1', joinTableConfig, [], 'foo');
      expect(result).toEqual({ id: '1', success: true });
    });

    it('returns success=false if the update failed', async () => {
      const { pgClient } = createPgClientStub(createQueryStub({ status: 400, error: { message: 'foo' } }));
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, setupFileProcessor());

      const result = await dataProcessor.updateItemData({ name: 'foo' }, '1', joinTableConfig);

      expect(result).toEqual({ id: '1', success: false });
    });

    it('returns success=false without a table name', async () => {
      const { pgClient, update } = createPgClientStub(createQueryStub({ status: 204 }));
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, setupFileProcessor());
      const config = { ...joinTableConfig, dataSource: { idColumn: 'id' } } as FormConfigInternal;

      const result = await dataProcessor.updateItemData({ name: 'foo' }, '1', config);

      expect(update).not.toHaveBeenCalled();
      expect(result).toEqual({ id: '1', success: false });
    });
  });

  describe('createItemData without table name', () => {
    it('returns success=false', async () => {
      validateFileFieldsMock.mockReturnValue(true);
      const dataProcessor = new DataProcessor(
        { pgClient: {} as any, formId: '', opts: {} as Opts },
        createFileProcessorMock() as unknown as FileProcessor
      );
      const formConfig = {
        dataSource: { idColumn: 'id' },
        includedProperties: ['name'],
        properties: { name: { type: 'string' } }
      } as unknown as FormConfigInternal;

      expect(await dataProcessor.createItemData({ name: 'foo' }, formConfig)).toEqual({ success: false });
    });
  });

  describe('createItemData with a failing file update', () => {
    it('logs the error of the update response', async () => {
      const insert = jest.fn(() => ({ select: () => Promise.resolve({ status: 201, data: [{ id: '1' }] }) }));
      const update = jest.fn(() => ({
        eq: () => Promise.resolve({ status: 400, error: { message: 'update failed' } })
      }));
      const pgClient = {
        schemaName: 'public',
        schema: () => ({ from: () => ({ insert, update }) })
      } as unknown as PostgrestClient<any, any, any>;
      const dataProcessor = new DataProcessor(
        { pgClient, formId: '', opts: {} as Opts },
        createFileProcessorMock() as unknown as FileProcessor
      );
      const formConfig = {
        dataSource: { tableName: 'test', idColumn: 'id' },
        includedProperties: ['file'],
        properties: { file: { type: 'string', media: { binaryEncoding: 'base64' } } }
      } as unknown as FormConfigInternal;
      getFilesFromItemMock.mockReturnValue({ file: 'data:image/png;base64,xxx' });
      getItemWithoutFilesMock.mockReturnValue({});
      createFilesMock.mockResolvedValue({ id: '1', file: 'test/file_1.png' });

      const result = await dataProcessor.createItemData({ file: 'data:image/png;base64,xxx' }, formConfig);

      expect(result).toEqual({ success: false });
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('update failed'));
    });
  });

  describe('join table errors', () => {
    const formConfig = {
      dataSource: {
        tableName: 'test',
        idColumn: 'id',
        joinTables: {
          bar: {
            relationship: Relationship.MANY_TO_MANY,
            dataSource: { tableName: 'bar', idColumn: 'id' },
            on: { self: 'testId', other: 'barId' },
            via: { tableName: 'test_bar' },
            includedProperties: ['id', 'value'],
            properties: { id: { type: 'string' }, value: { type: 'string' } }
          }
        }
      },
      includedProperties: ['name', 'bar'],
      properties: { name: { type: 'string' }, bar: { resolveTable: true } }
    } as unknown as FormConfigInternal;

    const createDataProcessor = (from: any) => {
      const pgClient = {
        schemaName: 'public',
        schema: () => ({ from: () => from })
      } as unknown as PostgrestClient<any, any, any>;
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, {} as FileProcessor);
      jest.spyOn(dataProcessor, 'createItemData').mockResolvedValue({ success: true, id: '1' });
      return dataProcessor;
    };

    it('reports the join table name if adding relations fails', async () => {
      const dataProcessor = createDataProcessor({
        insert: () => Promise.resolve({ status: 409, error: { message: 'duplicate key' } })
      });
      jest.spyOn(dataProcessor, 'getItemData').mockResolvedValue({ data: [{ bar: [] }] });

      const item = { name: 'foo', id: '1', bar: [{ value: 'baz' }] };
      await expect(dataProcessor.handleData(item, formConfig, DbAction.CREATE))
        .rejects.toMatchObject({
          extra: {
            errorCode: FormBackendErrorCode.JOIN_TABLE_DATA_CREATION_FAILED,
            detailedMessage: 'duplicate key',
            tableName: 'test_bar'
          }
        });
    });

    it('reports the join table name if removing relations fails', async () => {
      const dataProcessor = createDataProcessor({
        delete: () => ({ eq: () => ({ in: () => Promise.resolve({ status: 500, error: { message: 'boom' } }) }) })
      });
      jest.spyOn(dataProcessor, 'getItemData').mockResolvedValue({ data: [{ bar: [{ id: 'a', value: 'baz' }] }] });

      await expect(dataProcessor.handleData({ name: 'foo', id: '1', bar: [] }, formConfig, DbAction.CREATE))
        .rejects.toMatchObject({
          extra: {
            errorCode: FormBackendErrorCode.JOIN_TABLE_DATA_DELETION_FAILED,
            detailedMessage: 'boom',
            tableName: 'test_bar'
          }
        });
    });
  });

  describe('handleData one-to-many removal', () => {
    const formConfig = {
      dataSource: {
        tableName: 'test',
        idColumn: 'id',
        joinTables: {
          bar: {
            relationship: Relationship.ONE_TO_MANY,
            dataSource: { tableName: 'bar', idColumn: 'id' },
            on: { self: 'testId' },
            includedProperties: ['id', 'value'],
            properties: { id: { type: 'string' }, value: { type: 'string' } }
          }
        }
      },
      includedProperties: ['name', 'bar'],
      properties: {
        name: { type: 'string' },
        bar: { resolveTable: true }
      }
    } as unknown as FormConfigInternal;

    it.each([204, 400])('unjoins removed one-to-many items (response status %p)', async (status) => {
      const query = createQueryStub({ status });
      const { pgClient, from, update } = createPgClientStub(query);
      const dataProcessor = new DataProcessor({ pgClient, formId: '', opts: {} as Opts }, {} as FileProcessor);
      jest.spyOn(dataProcessor, 'updateItemData').mockResolvedValue({ id: '1', success: true });
      jest.spyOn(dataProcessor, 'getItemData')
        .mockResolvedValue({ data: [{ bar: [{ id: 'a', value: 'baz' }] }] });

      const itemId = await dataProcessor.handleData({ id: '1', name: 'foo', bar: [] }, formConfig, DbAction.UPDATE);

      expect(from).toHaveBeenCalledWith('bar');
      expect(update).toHaveBeenCalledWith({ testId: null });
      expect(query.eq).toHaveBeenCalledWith('id', 'a');
      expect(itemId).toEqual('1');
    });
  });
});
