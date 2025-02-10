import { PostgrestClient, PostgrestQueryBuilder } from '@supabase/postgrest-js';

import { DbAction } from '../types/dbAction';
import { FormConfigInternal } from '../types/formConfigInternal';
import { Opts } from '../types/opts';
import { Relationship } from '../types/relationship';

import DataProcessor from './data';
import FileProcessor, { FileProcessorOpts } from './file';

jest.mock('@supabase/postgrest-js');

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

describe('DataProcessor', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('can be created', () => {
    const pgClient = {} as PostgrestClient<any, string, any>;
    const dataProcessor = new DataProcessor(
      { pgClient, formId: '', opts: {} as Opts },
      new FileProcessor({} as FileProcessorOpts)
    );
    expect(dataProcessor).toBeDefined();
  });

  describe('getFormData', () => {
    it.todo('returns only the included columns');
    it.todo('ignores columns that are not in the table');
    it.todo('always includes the id column');
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

  it.todo('gets the form data');
  it.todo('gets the form item data');
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
      const pgClient = {} as PostgrestClient<any, string, any>;
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
      const pgClient = {} as PostgrestClient<any, string, any>;
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
      const pgClient = {} as PostgrestClient<any, string, any>;
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
        const pgClient = {} as PostgrestClient<any, string, any>;
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
        const pgClient = {} as PostgrestClient<any, string, any>;
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
        const pgClient = {} as PostgrestClient<any, string, any>;
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
        const pgClient = {} as PostgrestClient<any, string, any>;
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
        const pgClient = {} as PostgrestClient<any, string, any>;
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
        const pgClient = {} as PostgrestClient<any, string, any>;
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
        const pgClient = {} as PostgrestClient<any, string, any>;
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
        const pgClient = {} as PostgrestClient<any, string, any>;
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
        const pgClient = {} as PostgrestClient<any, string, any>;
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
        const pgClient = {} as PostgrestClient<any, string, any>;
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
        const pgClient = {} as PostgrestClient<any, string, any>;
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
  it.todo('updates the form item data');
});
