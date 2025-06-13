import { readdir, readFile, unlink, writeFile } from '../../__mocks__/node:fs/promises';
import { FormConfigInternal } from '../types/formConfigInternal';

import FileProcessor, { FileProcessorOpts } from './file';


jest.mock('node:fs/promises');

describe('FileProcessor', () => {

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('can be created', () => {
    const fileProcessor = new FileProcessor({} as any);
    expect(fileProcessor).toBeDefined();
  });
  describe('validateFileFields', () => {
    it('returns true, if files are valid base64 strings', () => {
      const fileProcessor = new FileProcessor({} as any);
      const item = { file: 'data:image/png;base64,abc123' };
      const formConfig: FormConfigInternal = {
        properties: {
          file: {
            type: 'string',
            media: {
              binaryEncoding: 'base64'
            }
          }
        }
      } as unknown as FormConfigInternal;
      const result = fileProcessor.validateFileFields(item, formConfig);
      expect(result).toBe(true);
    });
    it('returns true, if files have valid mime types', () => {
      const fileProcessor = new FileProcessor({} as any);
      const item = { file: 'data:image/png;base64,abc123' };
      const formConfig: FormConfigInternal = {
        properties: {
          file: {
            type: 'string',
            media: {
              binaryEncoding: 'base64',
            },
            options: {
              // eslint-disable-next-line camelcase
              mime_type: ['image/png']
            }
          }
        }
      } as unknown as FormConfigInternal;
      const result = fileProcessor.validateFileFields(item, formConfig);
      expect(result).toBe(true);
    });
    it('returns false, if files have invalid mime types', () => {
      const fileProcessor = new FileProcessor({} as any);
      const item = { file: 'data:image/png;base64,abc123' };
      const formConfig: FormConfigInternal = {
        properties: {
          file: {
            type: 'string',
            media: {
              binaryEncoding: 'base64',
            },
            options: {
              // eslint-disable-next-line camelcase
              mime_type: ['image/jpeg']
            }
          }
        }
      } as unknown as FormConfigInternal;
      const result = fileProcessor.validateFileFields(item, formConfig);
      expect(result).toBe(false);
    });
    it('returns true, if files are within size limits', () => {
      const fileProcessor = new FileProcessor({} as any);
      const item = { file: 'data:image/png;base64,abc123' };
      const formConfig: FormConfigInternal = {
        properties: {
          file: {
            type: 'string',
            media: {
              binaryEncoding: 'base64',
            },
            options: {
              // eslint-disable-next-line camelcase
              max_upload_size: 1000
            }
          }
        }
      } as unknown as FormConfigInternal;
      const result = fileProcessor.validateFileFields(item, formConfig);
      expect(result).toBe(true);
    });
    it('returns false, if files are out of size limits', () => {
      const fileProcessor = new FileProcessor({} as any);
      const item = { file: 'data:image/png;base64,abc123' };
      const formConfig: FormConfigInternal = {
        properties: {
          file: {
            type: 'string',
            media: {
              binaryEncoding: 'base64',
            },
            options: {
              // eslint-disable-next-line camelcase
              max_upload_size: 1
            }
          }
        }
      } as unknown as FormConfigInternal;
      const result = fileProcessor.validateFileFields(item, formConfig);
      expect(result).toBe(false);
    });
    it('returns true, if files are filepath strings', () => {
      const fileProcessor = new FileProcessor({formId: 'foo'} as any);
      const item = { id: 1, file: 'foo/file_1.png' };
      const formConfig: FormConfigInternal = {
        dataSource: {
          idColumn: 'id'
        },
        properties: {
          id: {
            type: 'number'
          },
          file: {
            type: 'string',
            media: {
              binaryEncoding: 'base64'
            }
          }
        }
      } as unknown as FormConfigInternal;
      const result = fileProcessor.validateFileFields(item, formConfig);
      expect(result).toBe(true);
    });
    it('returns true, if files are nullish', () => {
      const fileProcessor = new FileProcessor({} as any);
      const item = { file: null, file2: '', file3: undefined };
      const formConfig: FormConfigInternal = {
        dataSource: {
          idColumn: 'id'
        },
        properties: {
          id: {
            type: 'number'
          },
          file: {
            type: 'string',
            media: {
              binaryEncoding: 'base64'
            }
          },
          file2: {
            type: 'string',
            media: {
              binaryEncoding: 'base64'
            }
          },
          file3: {
            type: 'string',
            media: {
              binaryEncoding: 'base64'
            }
          }
        }
      } as unknown as FormConfigInternal;
      const result = fileProcessor.validateFileFields(item, formConfig);
      expect(result).toBe(true);
    });
    it('returns false, otherwise', () => {
      const fileProcessor = new FileProcessor({} as any);
      const item = { file: 'foo' };
      const formConfig: FormConfigInternal = {
        dataSource: {
          idColumn: 'id'
        },
        properties: {
          id: {
            type: 'number'
          },
          file: {
            type: 'string',
            media: {
              binaryEncoding: 'base64'
            }
          }
        }
      } as unknown as FormConfigInternal;
      const result = fileProcessor.validateFileFields(item, formConfig);
      expect(result).toBe(false);
    });
  });

  describe('createFiles', () => {
    it('removes old files', async () => {
      const item = {
        id: '1',
        file: 'data:image/png;base64,abc123',
        file2: 'data:image/png;base64,abc123'
      };
      const keysAndFiles = {
        file: item.file,
        file2: item.file2
      };
      const formConfig = {
        dataSource: {
          idColumn: 'id'
        }
      } as FormConfigInternal;
      const fileProcessor = new FileProcessor({opts: {}} as FileProcessorOpts);

      readdir.mockResolvedValue(['file_1', 'file2_1']);

      await fileProcessor.createFiles({item, keysAndFiles, formConfig});

      expect(unlink).toHaveBeenCalledTimes(2);
    });
    it('creates new files', async () => {
      const item = {
        id: '1',
        file: 'data:image/png;base64,abc123',
        file2: 'data:image/png;base64,abc123'
      };
      const keysAndFiles = {
        file: item.file,
        file2: item.file2
      };
      const formConfig: FormConfigInternal = {
        dataSource: {
          idColumn: 'id'
        }
      } as unknown as FormConfigInternal;
      const fileProcessor = new FileProcessor({opts: {FILE_UPLOAD_DIR: ''}, formId: 'foo'} as FileProcessorOpts);
      readdir.mockResolvedValue([]);

      await fileProcessor.createFiles({item, keysAndFiles, formConfig});

      expect(writeFile).toHaveBeenCalledTimes(2);
    });
    it('returns the item with updated file identifiers', async () => {
      const item = {
        id: '1',
        file: 'data:image/png;base64,abc123',
        file2: 'data:image/png;base64,abc123'
      };
      const keysAndFiles = {
        file: item.file,
        file2: item.file2
      };
      const formConfig: FormConfigInternal = {
        dataSource: {
          idColumn: 'id'
        }
      } as unknown as FormConfigInternal;
      const fileProcessor = new FileProcessor({opts: {FILE_UPLOAD_DIR: ''}, formId: 'foo'} as FileProcessorOpts);
      readdir.mockResolvedValue([]);

      const result = await fileProcessor.createFiles({item, keysAndFiles, formConfig});

      expect(result).toEqual({ id: '1', file: 'foo/file_1.png', file2: 'foo/file2_1.png' });
    });
  });

  describe('deleteFiles', () => {
    it('deletes files', async () => {
      readdir.mockResolvedValue(['file_1']);
      unlink.mockResolvedValue(undefined);
      const fileProcessor = new FileProcessor({opts: {}} as FileProcessorOpts);
      const itemId = '1';
      const formConfig: FormConfigInternal = {
        properties: {
          file: {
            type: 'string',
            media: {
              binaryEncoding: 'base64'
            }
          }
        }
      } as unknown as FormConfigInternal;
      await fileProcessor.deleteFiles(itemId, formConfig);
      expect(unlink).toHaveBeenCalled();
    });
  });

  describe('getFilesFromItem', () => {
    it('returns files from item', () => {
      const fileProcessor = new FileProcessor({} as any);
      const item = { file: 'data:image/png;base64,abc123', id: 1 };
      const formConfig: FormConfigInternal = {
        properties: {
          file: {
            type: 'string',
            media: {
              binaryEncoding: 'base64'
            }
          },
          id: {
            type: 'number'
          }
        }
      } as unknown as FormConfigInternal;
      const result = fileProcessor.getFilesFromItem(item, formConfig);
      expect(result).toEqual({ file: item.file });
    });
  });

  describe('getEmptyFileFields', () => {
    it('returns empty file fields', () => {
      const fileProcessor = new FileProcessor({} as any);
      const item = { file: 'data:image/png;base64,abc123', file2: null };
      const formConfig: FormConfigInternal = {
        properties: {
          file: {
            type: 'string',
            media: {
              binaryEncoding: 'base64'
            }
          },
          file2: {
            type: 'string',
            media: {
              binaryEncoding: 'base64'
            }
          }
        }
      } as unknown as FormConfigInternal;
      const result = fileProcessor.getEmptyFileFields(item, formConfig);
      expect(result).toEqual(['file2']);
    });
  });

  describe('getItemWithoutFiles', () => {
    it('returns item without files', () => {
      const fileProcessor = new FileProcessor({} as any);
      const item = { file: 'data:image/png;base64,abc123', id: 1 };
      const keys = ['file'];
      const result = fileProcessor.getItemWithoutFiles(item, keys);
      expect(result).toEqual({ id: item.id });
    });
  });

  describe('fileExists', () => {
    it('returns true, if a file exists', async () => {
      const fileProcessor = new FileProcessor({opts: {FILE_UPLOAD_DIR: ''}, formId: 'foo'} as FileProcessorOpts);
      readdir.mockReturnValue(['file_1.png']);
      const result = await fileProcessor.fileExists('file_1.png');
      expect(result).toBe(true);
    });
    it('returns false, if a file does not exist', async () => {
      const fileProcessor = new FileProcessor({opts: {FILE_UPLOAD_DIR: ''}, formId: 'foo'} as FileProcessorOpts);
      readdir.mockReturnValue(['foo_1.png']);
      const result = await fileProcessor.fileExists('file_1.png');
      expect(result).toBe(false);
    });
    it('only checks for files in the form directory', async () => {
      const fileProcessor = new FileProcessor({opts: {FILE_UPLOAD_DIR: ''}, formId: 'foo'} as FileProcessorOpts);
      readdir.mockReturnValue(['file_1.png']);
      await fileProcessor.fileExists('file_1.png');
      expect(readdir).toHaveBeenCalledWith('/foo', { encoding: 'utf-8', recursive: true });
    });
  });

  describe('getFilePath', () => {
    it('gets the file path from a file identifier', () => {
      const fileProcessor = new FileProcessor({formId: 'foo'} as any);
      const fileIdentifier = 'file_1.png';
      const result = fileProcessor.getFilePath(fileIdentifier);
      expect(result).toBe('foo/file_1.png');
    });
  });
});
