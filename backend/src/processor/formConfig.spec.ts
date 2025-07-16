import { PostgrestClient, PostgrestQueryBuilder } from '@supabase/postgrest-js';

import { FormConfig } from '../types/formConfig';
import { FormConfigInternal } from '../types/formConfigInternal';
import { Opts } from '../types/opts';
import { Relationship } from '../types/relationship';

import FormConfigProcessor from './formConfig';

const fetchMock = jest.fn();
global.fetch = fetchMock;
jest.mock('@supabase/postgrest-js');

const createFetchResponse = (data: any, success: boolean = true) => {
  return {
    ok: success,
    json: async () => data
  };
};

// TODO test all properties of formConfig here
describe('FormConfigProcessor', () => {

  beforeEach(() => {
    fetchMock.mockClear();
  });

  it('can be created', () => {
    const opts = {} as Opts;
    const pgClient = {} as PostgrestClient<any, any, any>;
    const formProcessor = new FormConfigProcessor(opts, pgClient, '');
    expect(formProcessor).toBeDefined();
  });

  describe('createFormConfigProcessor', () => {
    it('creates a new FormConfigProcessor instance', async () => {
      const opts = {} as Opts;
      const formConfig: FormConfig = {
        dataSource: {
          tableName: 'test'
        },
        views: {}
      } as unknown as FormConfig;
      const pgClient = {} as PostgrestClient<any, any, any>;
      const postgrestToken = '';
      const mockedResponse = {
        definitions: {
          [formConfig.dataSource.tableName]: {
            properties: {}
          }
        }
      };
      fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
      const formConfigProcessor = await FormConfigProcessor.createFormConfigProcessor(
        opts,
        formConfig,
        pgClient,
        postgrestToken
      );

      expect(formConfigProcessor).toBeDefined();
    });
  });

  describe('processConfig', () => {

    const getMockTableDefinition = () => {
      return {
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          enumId: { type: 'integer' }
        }
      };
    };

    it('processes the formConfig', async () => {
      const formConfig: FormConfig = {
        dataSource: {
          tableName: 'test'
        },
        views: {}
      } as unknown as FormConfig;
      const mockedResponse = {
        definitions: {
          [formConfig.dataSource.tableName]: {
            properties: {}
          }
        }
      };
      fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
      const opts = {} as Opts;
      const pgClient = {} as PostgrestClient<any, any, any>;
      const formProcessor = new FormConfigProcessor(opts, pgClient, '');
      const processedConfig = await formProcessor.processConfig(formConfig);

      expect(processedConfig).toBeDefined();
      expect(processedConfig.properties).toBeDefined();
    });

    describe('order', () => {
      it('uses the userDefined property if given', async () => {
        const formConfig: FormConfig = {
          dataSource: {
            tableName: 'test',
            order: 'desc'
          },
          views: {}
        } as unknown as FormConfig;
        const mockedResponse = {
          definitions: {
            [formConfig.dataSource.tableName]: {
              properties: {}
            }
          }
        };
        fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        const userDefinedOrder = 'asc';
        const processedConfig = await formProcessor.processConfig(formConfig, userDefinedOrder);

        expect(processedConfig.dataSource.order).toBe(userDefinedOrder);
      });
      it('uses the configured property if no userDefined is given', async () => {
        const formConfig: FormConfig = {
          dataSource: {
            tableName: 'test',
            order: 'desc'
          },
          views: {}
        } as unknown as FormConfig;
        const mockedResponse = {
          definitions: {
            [formConfig.dataSource.tableName]: {
              properties: {}
            }
          }
        };
        fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        const processedConfig = await formProcessor.processConfig(formConfig);

        expect(processedConfig.dataSource.order).toBe(formConfig.dataSource.order);
      });
      it('uses asc as default, if neither userDefined nor configured property are given', async () => {
        const formConfig: FormConfig = {
          dataSource: {
            tableName: 'test'
          },
          views: {}
        } as unknown as FormConfig;
        const mockedResponse = {
          definitions: {
            [formConfig.dataSource.tableName]: {
              properties: {}
            }
          }
        };
        fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        const processedConfig = await formProcessor.processConfig(formConfig);

        expect(processedConfig.dataSource.order).toBe('asc');
      });
    });
    describe('orderBy', () => {
      it('uses the userDefined property if given', async () => {
        const formConfig: FormConfig = {
          dataSource: {
            tableName: 'test',
            orderBy: 'foo'
          },
          views: {},
          properties: {
            bar: {}
          }
        } as unknown as FormConfig;
        const mockedResponse = {
          definitions: {
            [formConfig.dataSource.tableName]: {
              properties: {}
            }
          }
        };
        fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        const userDefinedOrderBy = 'bar';
        const processedConfig = await formProcessor.processConfig(formConfig, undefined, userDefinedOrderBy);

        expect(processedConfig.dataSource.orderBy).toBe(userDefinedOrderBy);
      });
      it('uses the configured property if no userDefined is given', async () => {
        const formConfig: FormConfig = {
          dataSource: {
            tableName: 'test',
            orderBy: 'foo'
          },
          views: {},
          properties: {
            foo: {},
            bar: {}
          }
        } as unknown as FormConfig;
        const mockedResponse = {
          definitions: {
            [formConfig.dataSource.tableName]: {
              properties: {}
            }
          }
        };
        fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        const processedConfig = await formProcessor.processConfig(formConfig);

        expect(processedConfig.dataSource.orderBy).toBe(formConfig.dataSource.orderBy);
      });
      it('uses the idColumn as default, if neither userDefined nor configured are given', async () => {
        const formConfig: FormConfig = {
          dataSource: {
            tableName: 'test',
            idColumn: 'my_col'
          },
          views: {},
          properties: {
            foo: {},
            bar: {}
          }
        } as unknown as FormConfig;
        const mockedResponse = {
          definitions: {
            [formConfig.dataSource.tableName]: {
              properties: {}
            }
          }
        };
        fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        const processedConfig = await formProcessor.processConfig(formConfig);

        expect(processedConfig.dataSource.orderBy).toBe(formConfig.dataSource.idColumn);
      });
    });
    it('creates the table definition of the complete table by default', async () => {
      const formConfig: FormConfig = {
        dataSource: {
          tableName: 'test'
        },
        views: {}
      } as unknown as FormConfig;
      const mockedResponse = {
        definitions: {
          [formConfig.dataSource.tableName]: getMockTableDefinition()
        }
      };
      fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
      const opts = {} as Opts;
      const pgClient = {} as PostgrestClient<any, any, any>;
      const formProcessor = new FormConfigProcessor(opts, pgClient, '');
      const processedConfig = await formProcessor.processConfig(formConfig);

      expect(Object.keys(processedConfig.properties)).toEqual(Object.keys(getMockTableDefinition().properties));
    });
    it('creates table definition only of columns provided in includedProperties of the formConfig', async () => {
      const formConfig: FormConfig = {
        dataSource: {
          tableName: 'test'
        },
        views: {},
        includedProperties: ['id']
      } as unknown as FormConfig;
      const mockedResponse = {
        definitions: {
          [formConfig.dataSource.tableName]: getMockTableDefinition()
        }
      };
      fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
      const opts = {} as Opts;
      const pgClient = {} as PostgrestClient<any, any, any>;
      const formProcessor = new FormConfigProcessor(opts, pgClient, '');
      const processedConfig = await formProcessor.processConfig(formConfig);

      expect(Object.keys(processedConfig.properties)).toEqual(['id']);
    });
    it('merges the table definition with the formConfig properties', async () => {
      const formConfig: FormConfig = {
        dataSource: {
          tableName: 'test'
        },
        properties: {
          name: {
            format: 'text'
          }
        },
        views: {}
      } as unknown as FormConfig;
      const mockedResponse = {
        definitions: {
          [formConfig.dataSource.tableName]: getMockTableDefinition()
        }
      };
      fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
      const opts = {} as Opts;
      const pgClient = {} as PostgrestClient<any, any, any>;
      const formProcessor = new FormConfigProcessor(opts, pgClient, '');
      const processedConfig = await formProcessor.processConfig(formConfig);

      expect(processedConfig.properties.name.format).toEqual('text');
    });
    it('overrides the table definition with the formConfig properties', async () => {
      const formConfig: FormConfig = {
        dataSource: {
          tableName: 'test'
        },
        properties: {
          name: {
            type: 'integer'
          }
        },
        views: {}
      } as unknown as FormConfig;
      const mockedResponse = {
        definitions: {
          [formConfig.dataSource.tableName]: getMockTableDefinition()
        }
      };
      fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
      const opts = {} as Opts;
      const pgClient = {} as PostgrestClient<any, any, any>;
      const formProcessor = new FormConfigProcessor(opts, pgClient, '');
      const processedConfig = await formProcessor.processConfig(formConfig);

      expect(processedConfig.properties.name.type).toEqual('integer');
    });
    it('sets includedPropertiesTable base on includedProperties if not set', async () => {
      const formConfig: FormConfig = {
        dataSource: {
          tableName: 'test'
        },
        includedProperties: ['id'],
        views: {}
      } as unknown as FormConfig;
      const mockedResponse = {
        definitions: {
          [formConfig.dataSource.tableName]: getMockTableDefinition()
        }
      };
      fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
      const opts = {} as Opts;
      const pgClient = {} as PostgrestClient<any, any, any>;
      const formProcessor = new FormConfigProcessor(opts, pgClient, '');
      const processedConfig = await formProcessor.processConfig(formConfig);

      expect(processedConfig.includedPropertiesTable).toEqual(formConfig.includedProperties);
    });
    describe('joinTables', () => {
      it('processes joinTables', async () => {
        const formConfig: FormConfig = {
          dataSource: {
            tableName: 'test',
            joinTables: {
              enumId: {
                relationship: 'manyToOne',
                dataSource: {
                  tableName: 'enum'
                }
              }
            }
          },
          properties: {
            name: {
              type: 'integer'
            }
          },
          views: {}
        } as unknown as FormConfig;
        const mockedResponse = {
          definitions: {
            [formConfig.dataSource.tableName]: getMockTableDefinition(),
            enum: {
              properties: {
                id: { type: 'integer' }
              }
            }
          }
        };
        fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        const processedConfig = await formProcessor.processConfig(formConfig);

        expect(processedConfig.dataSource.joinTables.enumId.properties).toBeDefined();
      });
      it('processes joinTables recursively', async () => {
        const formConfig: FormConfig = {
          dataSource: {
            tableName: 'test',
            joinTables: {
              enumId: {
                relationship: 'manyToOne',
                dataSource: {
                  tableName: 'enum',
                  joinTables: {
                    bar: {
                      relationship: 'manyToOne',
                      dataSource: {
                        tableName: 'bar'
                      }
                    }
                  }
                }
              }
            }
          },
          views: {}
        } as unknown as FormConfig;
        const mockedResponse = {
          definitions: {
            [formConfig.dataSource.tableName]: getMockTableDefinition(),
            enum: {
              properties: {
                id: { type: 'integer' }
              }
            },
            bar: {
              properties: {
                id: { type: 'integer' }
              }
            }
          }
        };
        fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        const processedConfig = await formProcessor.processConfig(formConfig);

        expect(processedConfig.dataSource.joinTables.enumId.dataSource.joinTables.bar.properties).toBeDefined();
      });
      it('moves the joinTable properties to the related property on many-to-many', async () => {
        const formConfig: FormConfig = {
          dataSource: {
            tableName: 'test',
            joinTables: {
              enumId: {
                relationship: 'manyToMany',
                dataSource: {
                  tableName: 'enum'
                }
              }
            }
          },
          views: {},
          properties: {
            enumId: {
              resolveTable: true
            }
          }
        } as unknown as FormConfig;
        const mockedResponse = {
          definitions: {
            [formConfig.dataSource.tableName]: getMockTableDefinition(),
            enum: {
              properties: {
                id: { type: 'integer' }
              }
            }
          }
        };
        fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        const processedConfig = await formProcessor.processConfig(formConfig);

        expect(processedConfig.properties.enumId.type).toEqual('array');
        expect(processedConfig.properties.enumId.items).toBeDefined();
      });
      it('moves the joinTable properties to the related property on one-to-many', async () => {
        const formConfig: FormConfig = {
          dataSource: {
            tableName: 'test',
            joinTables: {
              enumId: {
                relationship: 'oneToMany',
                dataSource: {
                  tableName: 'enum'
                }
              }
            }
          },
          views: {},
          properties: {
            enumId: {
              resolveTable: true
            }
          }
        } as unknown as FormConfig;
        const mockedResponse = {
          definitions: {
            [formConfig.dataSource.tableName]: getMockTableDefinition(),
            enum: {
              properties: {
                id: { type: 'integer' }
              }
            }
          }
        };
        fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        const processedConfig = await formProcessor.processConfig(formConfig);

        expect(processedConfig.properties.enumId.type).toEqual('array');
        expect(processedConfig.properties.enumId.items).toBeDefined();
      });
      it('moves the joinTable properties to the related property on many-to-one', async () => {
        const formConfig: FormConfig = {
          dataSource: {
            tableName: 'test',
            joinTables: {
              enumId: {
                relationship: 'manyToOne',
                dataSource: {
                  tableName: 'enum'
                }
              }
            }
          },
          views: {},
          properties: {
            enumId: {
              resolveTable: true
            }
          }
        } as unknown as FormConfig;
        const mockedResponse = {
          definitions: {
            [formConfig.dataSource.tableName]: getMockTableDefinition(),
            enum: {
              properties: {
                id: { type: 'integer' }
              }
            }
          }
        };
        fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        const processedConfig = await formProcessor.processConfig(formConfig);

        expect(processedConfig.properties.enumId.type).toEqual('object');
        expect(processedConfig.properties.enumId.properties).toBeDefined();
      });
      it('moves the joinTable properties to the related property on one-to-one', async () => {
        const formConfig: FormConfig = {
          dataSource: {
            tableName: 'test',
            joinTables: {
              enumId: {
                relationship: 'oneToOne',
                dataSource: {
                  tableName: 'enum'
                }
              }
            }
          },
          views: {},
          properties: {
            enumId: {
              resolveTable: true,
              peter: 'pan'
            }
          }
        } as unknown as FormConfig;
        const mockedResponse = {
          definitions: {
            [formConfig.dataSource.tableName]: getMockTableDefinition(),
            enum: {
              properties: {
                id: { type: 'integer' }
              }
            }
          }
        };
        fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        const processedConfig = await formProcessor.processConfig(formConfig);

        expect(processedConfig.properties.enumId.type).toEqual('object');
        expect(processedConfig.properties.enumId.properties).toBeDefined();
      });
      it('does not move the joinTable properties without resolveTable being true', async () => {
        const formConfig: FormConfig = {
          dataSource: {
            tableName: 'testito',
            joinTables: {
              enumId: {
                relationship: 'oneToOne',
                dataSource: {
                  tableName: 'enum'
                }
              }
            }
          },
          views: {}
        } as unknown as FormConfig;
        const mockedResponse = {
          definitions: {
            [formConfig.dataSource.tableName]: getMockTableDefinition(),
            enum: {
              properties: {
                id: { type: 'integer' }
              }
            }
          }
        };
        fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        const processedConfig = await formProcessor.processConfig(formConfig);

        expect(processedConfig.properties.enumId.type).not.toEqual('object');
        expect(processedConfig.properties.enumId.properties).not.toBeDefined();
      });
    });
    describe('lookupTables', () => {
      it('resolves lookup tables', async () => {
        const formConfig: FormConfig = {
          dataSource: {
            tableName: 'test',
            lookupTables: {
              enumId: {
                dataSource: {
                  tableName: 'enum',
                  idColumn: 'id'
                }
              }
            }
          },
          properties: {
            name: {
              type: 'integer'
            }
          },
          views: {}
        } as unknown as FormConfig;
        const mockedResponse = {
          definitions: {
            [formConfig.dataSource.tableName]: getMockTableDefinition(),
            enum: {
              properties: {
                id: { type: 'integer' }
              }
            }
          }
        };
        fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        const processedConfig = await formProcessor.processConfig(formConfig);

        expect(processedConfig.dataSource.lookupTables.enumId.properties).toBeDefined();
      });
      it('moves the lookupTable properties to the related property', async () => {
        const formConfig: FormConfig = {
          dataSource: {
            tableName: 'test',
            lookupTables: {
              enumId: {
                dataSource: {
                  tableName: 'enum'
                },
                includedProperties: ['id'],
                properties: {
                  id: {
                    resolveAsEnum: true,
                    resolveToColumn: 'enumName'
                  }
                }
              }
            }
          },
          views: {},
          properties: {
            enumId: {
              resolveLookup: true
            }
          }
        } as unknown as FormConfig;
        const mockedResponse = {
          definitions: {
            [formConfig.dataSource.tableName]: getMockTableDefinition(),
            enum: {
              properties: {
                id: { type: 'integer' },
                enumName: { type: 'string'}
              }
            }
          }
        };
        fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
        const opts = {} as Opts;
        const pgClient = new PostgrestClient('', undefined);
        const pgClientMockResponse = {
          data: [{ id: 1, enumName: 'test' }],
          status: 200
        };

        const fromMock = jest.fn();
        pgClient.from = fromMock;
        const pgBuilder = new PostgrestQueryBuilder(new URL('http://example.com'), {});
        fromMock.mockReturnValue(pgBuilder);
        const selectMock = jest.fn();
        pgBuilder.select = selectMock;
        selectMock.mockResolvedValue(pgClientMockResponse);

        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        const processedConfig = await formProcessor.processConfig(formConfig);

        expect(processedConfig.properties.enumId.enumSource).toBeDefined();
      });
      it('does not move the lookupTable properties without resolveLookup being true', async () => {
        const formConfig: FormConfig = {
          dataSource: {
            tableName: 'testito',
            lookupTables: {
              enumId: {
                dataSource: {
                  tableName: 'enum'
                }
              }
            }
          },
          views: {}
        } as unknown as FormConfig;
        const mockedResponse = {
          definitions: {
            [formConfig.dataSource.tableName]: getMockTableDefinition(),
            enum: {
              properties: {
                id: { type: 'integer' }
              }
            }
          }
        };
        fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        const processedConfig = await formProcessor.processConfig(formConfig);

        expect(processedConfig.properties.enumId.enumSource).not.toBeDefined();
      });
    });
    it('resolves enums for one-to-one relationships', async () => {
      const formConfig: FormConfig = {
        dataSource: {
          tableName: 'test',
          joinTables: {
            enumId: {
              relationship: 'oneToOne',
              dataSource: {
                tableName: 'enum'
              },
              includedProperties: ['id'],
              properties: {
                id: {
                  resolveAsEnum: true,
                  resolveToColumn: 'enumName'
                }
              }
            }
          }
        },
        properties: {
          enumId: {
            resolveTable: true
          }
        },
        views: {}
      } as unknown as FormConfig;
      const mockedResponse = {
        definitions: {
          [formConfig.dataSource.tableName]: getMockTableDefinition(),
          enum: {
            properties: {
              id: { type: 'integer' },
              enumName: { type: 'string' }
            }
          }
        }
      };
      fetchMock.mockReturnValue(createFetchResponse(mockedResponse));
      const opts = {} as Opts;
      const pgClient = new PostgrestClient('', undefined);
      const pgClientMockResponse = {
        data: [{ id: 1, enumName: 'test' }],
        status: 200
      };

      const fromMock = jest.fn();
      pgClient.from = fromMock;
      const pgBuilder = new PostgrestQueryBuilder(new URL('http://example.com'), {});
      fromMock.mockReturnValue(pgBuilder);
      const selectMock = jest.fn();
      pgBuilder.select = selectMock;
      selectMock.mockResolvedValue(pgClientMockResponse);

      const formProcessor = new FormConfigProcessor(opts, pgClient, '');
      const processedConfig = await formProcessor.processConfig(formConfig);
      const enumSource = processedConfig.properties.enumId.properties.id.enumSource;
      expect(enumSource).toBeDefined();
      expect(enumSource).toEqual(
        [expect.objectContaining({
          source: [{
            value: pgClientMockResponse.data[0].id,
            title: pgClientMockResponse.data[0].enumName
          }]
        })]
      );
    });
  });

  describe('postProcessItemConfig', () => {
    describe('removes private properties in a postprocessing step', () => {
      it('removes the resolveTable property', () => {
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test',
            joinTables: {
              foo: {
                relationship: Relationship.ONE_TO_ONE,
                includedProperties: ['bar'],
                properties: {
                  bar: {}
                }
              }
            }
          },
          access: {
            write: true
          },
          includedProperties: ['foo'],
          properties: {
            foo: {
              resolveTable: true
            }
          }
        } as unknown as FormConfigInternal;
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        formProcessor.setFormConfig(formConfig);
        const processedConfig = formProcessor.postProcessItemConfig([]);
        expect(processedConfig!.properties.foo.resolveTable).toBeUndefined();
      });
      it('removes the resolveAsEnum property', () => {
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test'
          },
          access: {
            write: true
          },
          includedProperties: ['foo'],
          properties: {
            foo: {
              resolveAsEnum: true
            }
          }
        } as unknown as FormConfigInternal;
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        formProcessor.setFormConfig(formConfig);
        const processedConfig = formProcessor.postProcessItemConfig([]);
        expect(processedConfig!.properties.foo.resolveAsEnum).toBeUndefined();
      });
      it('removes the resolveToColumn property', () => {
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test'
          },
          access: {
            write: true
          },
          includedProperties: ['foo'],
          properties: {
            foo: {
              resolveToColumn: true
            }
          }
        } as unknown as FormConfigInternal;
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        formProcessor.setFormConfig(formConfig);
        const processedConfig = formProcessor.postProcessItemConfig([]);
        expect(processedConfig!.properties.foo.resolveToColumn).toBeUndefined();
      });
      it('removes the properties recursively', () => {
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test'
          },
          access: {
            write: true
          },
          includedProperties: ['foo'],
          properties: {
            foo: {
              type: 'object',
              properties: {
                bar: {
                  resolveToColumn: true
                }
              }
            }
          }
        } as unknown as FormConfigInternal;
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        formProcessor.setFormConfig(formConfig);
        const processedConfig = formProcessor.postProcessItemConfig([]);
        expect(processedConfig!.properties.foo.properties.bar.resolveToColumn).toBeUndefined();
      });
    });
    it('sets the editable property to true, if user has write access', () => {
      const formConfig: FormConfigInternal = {
        dataSource: {
          tableName: 'test'
        },
        access: {
          write: true
        },
        properties: {
          foo: {
            type: 'integer'
          }
        }
      } as unknown as FormConfigInternal;
      const opts = {} as Opts;
      const pgClient = {} as PostgrestClient<any, any, any>;
      const formProcessor = new FormConfigProcessor(opts, pgClient, '');
      formProcessor.setFormConfig(formConfig);
      const processedConfig = formProcessor.postProcessItemConfig(['foo']);
      expect(processedConfig!.editable).toBe(true);
    });
    it('sets the editable property to false, if user has no write access', () => {
      const formConfig: FormConfigInternal = {
        dataSource: {
          tableName: 'test'
        },
        access: {
          write: []
        },
        properties: {
          foo: {
            type: 'integer'
          }
        }
      } as unknown as FormConfigInternal;
      const opts = {} as Opts;
      const pgClient = {} as PostgrestClient<any, any, any>;
      const formProcessor = new FormConfigProcessor(opts, pgClient, '');
      formProcessor.setFormConfig(formConfig);
      const processedConfig = formProcessor.postProcessItemConfig(['foo']);
      expect(processedConfig!.editable).toBe(false);
    });
    it('sets the type always to object', () => {
      const formConfig: FormConfigInternal = {
        type: 'array',
        dataSource: {
          tableName: 'test'
        },
        access: {
          write: []
        },
        properties: {
          foo: {
            type: 'integer'
          }
        }
      } as unknown as FormConfigInternal;
      const opts = {} as Opts;
      const pgClient = {} as PostgrestClient<any, any, any>;
      const formProcessor = new FormConfigProcessor(opts, pgClient, '');
      formProcessor.setFormConfig(formConfig);
      const processedConfig = formProcessor.postProcessItemConfig(['foo']);
      expect(processedConfig!.type).toBe('object');
    });
    it('passes the format option through', () => {
      const formConfig: FormConfigInternal = {
        format: 'grid',
        dataSource: {
          tableName: 'test'
        },
        access: {
          write: []
        },
        properties: {
          foo: {
            type: 'integer'
          }
        }
      } as unknown as FormConfigInternal;
      const opts = {} as Opts;
      const pgClient = {} as PostgrestClient<any, any, any>;
      const formProcessor = new FormConfigProcessor(opts, pgClient, '');
      formProcessor.setFormConfig(formConfig);
      const processedConfig = formProcessor.postProcessItemConfig(['foo']);
      expect(processedConfig!.format).toBe('grid');
    });
  });

  describe('postProcessTableConfig', () => {
    describe('removes private properties in a postprocessing step', () => {
      it('removes the resolveTable property', () => {
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test',
            joinTables: {
              foo: {
                relationship: Relationship.ONE_TO_ONE,
                includedProperties: ['bar'],
                properties: {
                  bar: {}
                }
              }
            }
          },
          access: {
            write: true
          },
          includedPropertiesTable: ['foo'],
          properties: {
            foo: {
              resolveTable: true
            }
          }
        } as unknown as FormConfigInternal;
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        formProcessor.setFormConfig(formConfig);
        const processedConfig = formProcessor.postProcessTableConfig([]);
        expect(processedConfig!.properties.foo.resolveTable).toBeUndefined();
      });
      it('removes the resolveAsEnum property', () => {
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test'
          },
          access: {
            write: true
          },
          includedPropertiesTable: ['foo'],
          properties: {
            foo: {
              resolveAsEnum: true
            }
          }
        } as unknown as FormConfigInternal;
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        formProcessor.setFormConfig(formConfig);
        const processedConfig = formProcessor.postProcessTableConfig([]);
        expect(processedConfig!.properties.foo.resolveAsEnum).toBeUndefined();
      });
      it('removes the resolveToColumn property', () => {
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test'
          },
          access: {
            write: true
          },
          includedPropertiesTable: ['foo'],
          properties: {
            foo: {
              resolveToColumn: true
            }
          }
        } as unknown as FormConfigInternal;
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        formProcessor.setFormConfig(formConfig);
        const processedConfig = formProcessor.postProcessTableConfig([]);
        expect(processedConfig!.properties.foo.resolveToColumn).toBeUndefined();
      });
      it('removes the properties recursively', () => {
        const formConfig: FormConfigInternal = {
          dataSource: {
            tableName: 'test'
          },
          access: {
            write: true
          },
          includedPropertiesTable: ['foo'],
          properties: {
            foo: {
              type: 'object',
              properties: {
                bar: {
                  resolveToColumn: true
                }
              }
            }
          }
        } as unknown as FormConfigInternal;
        const opts = {} as Opts;
        const pgClient = {} as PostgrestClient<any, any, any>;
        const formProcessor = new FormConfigProcessor(opts, pgClient, '');
        formProcessor.setFormConfig(formConfig);
        const processedConfig = formProcessor.postProcessTableConfig([]);
        expect(processedConfig!.properties.foo.properties.bar.resolveToColumn).toBeUndefined();
      });
    });
    it('sets the editable property to true, if user has write access', () => {
      const formConfig: FormConfigInternal = {
        dataSource: {
          tableName: 'test'
        },
        access: {
          write: true
        },
        properties: {
          foo: {
            type: 'integer'
          }
        }
      } as unknown as FormConfigInternal;
      const opts = {} as Opts;
      const pgClient = {} as PostgrestClient<any, any, any>;
      const formProcessor = new FormConfigProcessor(opts, pgClient, '');
      formProcessor.setFormConfig(formConfig);
      const processedConfig = formProcessor.postProcessTableConfig(['foo']);
      expect(processedConfig!.editable).toBe(true);
    });
    it('sets the editable property to false, if user has no write access', () => {
      const formConfig: FormConfigInternal = {
        dataSource: {
          tableName: 'test'
        },
        access: {
          write: []
        },
        properties: {
          foo: {
            type: 'integer'
          }
        }
      } as unknown as FormConfigInternal;
      const opts = {} as Opts;
      const pgClient = {} as PostgrestClient<any, any, any>;
      const formProcessor = new FormConfigProcessor(opts, pgClient, '');
      formProcessor.setFormConfig(formConfig);
      const processedConfig = formProcessor.postProcessTableConfig(['foo']);
      expect(processedConfig!.editable).toBe(false);
    });
    it('sets the type always to object', () => {
      const formConfig: FormConfigInternal = {
        type: 'array',
        dataSource: {
          tableName: 'test'
        },
        access: {
          write: []
        },
        properties: {
          foo: {
            type: 'integer'
          }
        }
      } as unknown as FormConfigInternal;
      const opts = {} as Opts;
      const pgClient = {} as PostgrestClient<any, any, any>;
      const formProcessor = new FormConfigProcessor(opts, pgClient, '');
      formProcessor.setFormConfig(formConfig);
      const processedConfig = formProcessor.postProcessTableConfig(['foo']);
      expect(processedConfig!.type).toBe('object');
    });
    it('passes the format option through', () => {
      const formConfig: FormConfigInternal = {
        format: 'grid',
        dataSource: {
          tableName: 'test'
        },
        access: {
          write: []
        },
        properties: {
          foo: {
            type: 'integer'
          }
        }
      } as unknown as FormConfigInternal;
      const opts = {} as Opts;
      const pgClient = {} as PostgrestClient<any, any, any>;
      const formProcessor = new FormConfigProcessor(opts, pgClient, '');
      formProcessor.setFormConfig(formConfig);
      const processedConfig = formProcessor.postProcessTableConfig(['foo']);
      expect(processedConfig!.format).toBe('grid');
    });
  });
  describe('allowsReadForm', () => {
    it('returns true if form is publicly readable', () => {
      const formConfig: FormConfig = {
        access: {
          read: true,
          write: []
        }
      } as unknown as FormConfig;
      const userRoles: string[] = [];
      const canReadForm = FormConfigProcessor.allowsReadForm(formConfig, userRoles);
      expect(canReadForm).toBe(true);
    });
    it('returns true if user role has read access on form', () => {
      const formConfig: FormConfig = {
        access: {
          read: ['foo'],
          write: []
        }
      } as unknown as FormConfig;
      const userRoles: string[] = ['foo'];
      const canReadForm = FormConfigProcessor.allowsReadForm(formConfig, userRoles);
      expect(canReadForm).toBe(true);
    });
    it('returns true if form is writable by user', () => {
      const formConfig: FormConfig = {
        access: {
          read: [],
          write: true
        }
      } as unknown as FormConfig;
      const userRoles: string[] = [];
      const canReadForm = FormConfigProcessor.allowsReadForm(formConfig, userRoles);
      expect(canReadForm).toBe(true);
    });
    it('returns false if user role has neither read nor write access on form', () => {
      const formConfig: FormConfig = {
        access: {
          read: ['foo'],
          write: ['foo']
        }
      } as unknown as FormConfig;
      const userRoles: string[] = ['bar'];
      const canReadForm = FormConfigProcessor.allowsReadForm(formConfig, userRoles);
      expect(canReadForm).toBe(false);
    });
    it('returns false if form is private', () => {
      const formConfig: FormConfig = {
        access: {
          read: [],
          write: []
        }
      } as unknown as FormConfig;
      const userRoles: string[] = [];
      const canReadForm = FormConfigProcessor.allowsReadForm(formConfig, userRoles);
      expect(canReadForm).toBe(false);
    });
  });
  describe('allowsWriteForm', () => {
    it('returns true if form is publicly writable', () => {
      const formConfig: FormConfig = {
        access: {
          write: true
        }
      } as FormConfig;
      const userRoles: string[] = [];
      const canWriteForm = FormConfigProcessor.allowsWriteForm(formConfig, userRoles);
      expect(canWriteForm).toBe(true);
    });
    it('returns true if user role has write access on form', () => {
      const formConfig: FormConfigInternal = {
        access: {
          write: ['foo']
        }
      } as unknown as FormConfigInternal;
      const userRoles: string[] = ['foo'];
      const canWriteForm = FormConfigProcessor.allowsWriteForm(formConfig, userRoles);
      expect(canWriteForm).toBe(true);
    });
    it('returns false if user role has no write access on form', () => {
      const formConfig: FormConfigInternal = {
        access: {
          write: ['foo']
        }
      } as unknown as FormConfigInternal;
      const userRoles: string[] = ['bar'];
      const canWriteForm = FormConfigProcessor.allowsWriteForm(formConfig, userRoles);
      expect(canWriteForm).toBe(false);
    });
    it('returns false if form is private', () => {
      const formConfig: FormConfigInternal = {
        access: {
          write: []
        }
      } as unknown as FormConfigInternal;
      const userRoles: string[] = [];
      const canWriteForm = FormConfigProcessor.allowsWriteForm(formConfig, userRoles);
      expect(canWriteForm).toBe(false);
    });
  });

  describe('allowsTableView', () => {
    it('returns false if table view is disabled', () => {
      const formConfig: FormConfig = {
        views: {
          table: false
        }
      } as unknown as FormConfig;
      expect(FormConfigProcessor.allowsTableView(formConfig)).toBe(false);
    });
    it('returns true if table view is enabled', () => {
      const formConfig: FormConfig = {
        views: {
          table: true
        }
      } as unknown as FormConfig;
      expect(FormConfigProcessor.allowsTableView(formConfig)).toBe(true);
    });
  });
  describe('allowsItemView', () => {
    it('returns false if item view is disabled', () => {
      const formConfig: FormConfig= {
        views: {
          item: false
        }
      } as unknown as FormConfig;
      expect(FormConfigProcessor.allowsItemView(formConfig)).toBe(false);
    });
    it('returns true if item view is enabled', () => {
      const formConfig: FormConfig= {
        views: {
          item: true
        }
      } as unknown as FormConfig;
      expect(FormConfigProcessor.allowsItemView(formConfig)).toBe(true);
    });
  });
});
