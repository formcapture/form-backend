import { Response } from 'express';

import { FormConfig } from '../types/formConfig';
import { FormConfigRequest } from '../types/formConfigRequest';
import { Opts } from '../types/opts';

import FormService from './form';

const getPostgrestJwtMock = jest.fn();
jest.mock('../keycloak/keycloak', () => {
  return {
    getPostgrestJwt: () => getPostgrestJwtMock()
  };
});

const getTableFormMock = jest.fn();
const getEmptyItemFormMock = jest.fn();
const getItemFormMock = jest.fn();
const createFormItemMock = jest.fn();
const deleteFormItemMock = jest.fn();
const updateFormItemMock = jest.fn();

const createFormProcessorMock = jest.fn(() => {
  return {
    getTableForm: getTableFormMock,
    getEmptyItemForm: getEmptyItemFormMock,
    getItemForm: getItemFormMock,
    createFormItem: createFormItemMock,
    updateFormItem: updateFormItemMock,
    deleteFormItem: deleteFormItemMock
  };
});

jest.mock('../processor/form', () => {
  return {
    FormProcessor: {
      createFormProcessor: (...args: any[]) => createFormProcessorMock.apply(null, args)
    }
  };
});

const fileExistsMock = jest.fn();
const getFilePathMock = jest.fn();

jest.mock('../processor/file', () => {
  return {
    FileProcessor: jest.fn(() => ({
      fileExists: () => fileExistsMock(),
      getFilePath: (...args: any[]) => getFilePathMock.apply(null, args)
    }))
  };
});

const sendFileMock = jest.fn();
const createResponseMock = () => {
  const res: Response = {} as Response;
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);
  res.sendFile = sendFileMock;
  return res;
};

describe('FormService', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('can be created', () => {
    const opts: Opts = {
      FORM_CONFIGS_DIR: 'foo',
      POSTGREST_URL: 'baz',
    } as Opts;
    const formService = new FormService(opts);
    expect(formService).toBeDefined();
  });

  describe('getForm', () => {
    it('gets the form', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo',
      } as Opts;
      const mockedFormConfig: FormConfig = {
        foo: 'bar'
      } as unknown as FormConfig;
      const req: FormConfigRequest = {
        params: {
          formId: 'foo'
        },
        query: {},
        headers: {
          authorization: 'Bearer bar'
        },
        formConfig: mockedFormConfig,
        userRoles: []
      } as unknown as FormConfigRequest;
      const res = createResponseMock();
      const next = jest.fn();
      const formService = new FormService(opts);

      getPostgrestJwtMock.mockResolvedValue('baz');
      getTableFormMock.mockResolvedValue(mockedFormConfig);

      await formService.getForm(req, res, next);
      expect(res.json).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockedFormConfig);
    });

    it('checks if system is authenticated against postgrest', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo'
      } as Opts;
      const req: FormConfigRequest = {
        params: {
          formId: 'foo'
        },
        query: {}
      } as FormConfigRequest;
      getPostgrestJwtMock.mockResolvedValue(undefined);
      const res = createResponseMock();
      const next = jest.fn();
      const formService = new FormService(opts);

      await formService.getForm(req, res, next);
      expect(getPostgrestJwtMock).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
    it('handles query parameter "order"', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo',
      } as Opts;
      const req: FormConfigRequest = {
        params: {
          formId: 'foo'
        },
        query: {
          order: 'asc'
        },
        formConfig: {},
        userRoles: []
      } as unknown as FormConfigRequest;
      const res = createResponseMock();
      const next = jest.fn();
      const formService = new FormService(opts);
      getPostgrestJwtMock.mockResolvedValue('baz');

      await formService.getForm(req, res, next);

      expect(createFormProcessorMock).toHaveBeenCalledWith(opts, {}, 'foo', [], 'baz', 'asc', undefined);
    });
    it('handles query parameter "orderBy"', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo',
      } as Opts;
      const req: FormConfigRequest = {
        params: {
          formId: 'foo'
        },
        query: {
          orderBy: 'my_col'
        },
        formConfig: {},
        userRoles: []
      } as unknown as FormConfigRequest;
      const res = createResponseMock();
      const next = jest.fn();
      const formService = new FormService(opts);
      getPostgrestJwtMock.mockResolvedValue('baz');

      await formService.getForm(req, res, next);

      expect(createFormProcessorMock).toHaveBeenCalledWith(opts, {}, 'foo', [], 'baz', undefined, 'my_col');
    });
    it('handles query parameter "filter"', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo',
      } as Opts;
      const req: FormConfigRequest = {
        params: {
          formId: 'foo'
        },
        query: {
          filterKey: 'my_col',
          filterOp: 'contains',
          filterValue: 'my_value'
        },
        formConfig: {},
        userRoles: []
      } as unknown as FormConfigRequest;
      const res = createResponseMock();
      const next = jest.fn();
      const formService = new FormService(opts);
      getPostgrestJwtMock.mockResolvedValue('baz');

      await formService.getForm(req, res, next);

      expect(getTableFormMock).toHaveBeenCalledWith(undefined, {
        filterKey: 'my_col',
        filterOp: 'contains',
        filterValue: 'my_value'
      });
    });
  });

  describe('getEmptyForm', () => {
    it('gets the empty form', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo',
      } as Opts;
      const mockedFormConfig: FormConfig = {
        foo: 'bar'
      } as unknown as FormConfig;
      const req: FormConfigRequest = {
        params: {
          formId: 'foo'
        },
        headers: {
          authorization: 'Bearer bar'
        },
        formConfig: mockedFormConfig
      } as FormConfigRequest;
      const res = createResponseMock();
      const next = jest.fn();
      const formService = new FormService(opts);

      getPostgrestJwtMock.mockResolvedValue('baz');
      getEmptyItemFormMock.mockResolvedValue(mockedFormConfig);

      await formService.getEmptyForm(req, res, next);
      expect(res.json).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockedFormConfig);
    });

    it('checks if system is authenticated against postgrest', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo'
      } as Opts;
      const req: FormConfigRequest = {
        params: {
          formId: 'foo'
        },
        formConfig: {}
      } as FormConfigRequest;
      getPostgrestJwtMock.mockResolvedValue(undefined);
      const res = createResponseMock();
      const next = jest.fn();
      const formService = new FormService(opts);

      await formService.getEmptyForm(req, res, next);
      expect(getPostgrestJwtMock).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getFormItem', () => {
    it('returns the form item', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo',
      } as Opts;
      const mockedFormConfig: FormConfig = {
        foo: 'bar'
      } as unknown as FormConfig;
      const req: FormConfigRequest = {
        params: {
          formId: 'foo',
          itemId: 'bar'
        },
        headers: {
          authorization: 'Bearer bar'
        },
        formConfig: mockedFormConfig,
        userRoles: []
      } as unknown as FormConfigRequest;
      const res = createResponseMock();
      const next = jest.fn();
      const formService = new FormService(opts);

      getPostgrestJwtMock.mockResolvedValue('baz');
      getItemFormMock.mockResolvedValue(mockedFormConfig);

      await formService.getFormItem(req, res, next);
      expect(res.json).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockedFormConfig);
    });

    it('returns 401 if itemId is not provided', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo',
      } as Opts;
      const req: FormConfigRequest = {
        params: {
          formId: 'foo'
        },
        formConfig: {}
      } as FormConfigRequest;
      const res = createResponseMock();
      const next = jest.fn();
      const formService = new FormService(opts);

      await formService.getFormItem(req, res, next);
      expect(next).toHaveBeenCalled();
    });
    it('checks if system is authenticated against postgrest', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo'
      } as Opts;
      const req: FormConfigRequest = {
        params: {
          formId: 'foo',
          itemId: 'bar'
        },
        formConfig: {}
      } as unknown as FormConfigRequest;
      getPostgrestJwtMock.mockResolvedValue(undefined);
      const res = createResponseMock();
      const next = jest.fn();
      const formService = new FormService(opts);

      await formService.getFormItem(req, res, next);
      expect(getPostgrestJwtMock).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
  describe('createFormItem', () => {
    it('creates the form item', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo',
      } as Opts;
      const req: FormConfigRequest = {
        params: {
          formId: 'foo',
          itemId: 'bar'
        },
        headers: {
          authorization: 'Bearer bar'
        },
        formConfig: {},
        userRoles: []
      } as unknown as FormConfigRequest;
      const res = createResponseMock();
      const next = jest.fn();
      const formService = new FormService(opts);

      getPostgrestJwtMock.mockResolvedValue('baz');
      createFormItemMock.mockReturnValue({ success: true });

      await formService.createFormItem(req, res, next);
      expect(res.json).toHaveBeenCalled();
    });

    it('checks if system is authenticated against postgrest', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo'
      } as Opts;
      const req: FormConfigRequest = {
        params: {
          formId: 'foo',
          itemId: 'bar'
        },
        formConfig: {}
      } as unknown as FormConfigRequest;
      getPostgrestJwtMock.mockResolvedValue(undefined);
      const res = createResponseMock();
      const next = jest.fn();
      const formService = new FormService(opts);

      await formService.createFormItem(req, res, next);
      expect(getPostgrestJwtMock).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('updateFormItem', () => {
    it('updates the form item', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo',
      } as Opts;
      const req: FormConfigRequest = {
        params: {
          formId: 'foo',
          itemId: 'bar'
        },
        headers: {
          authorization: 'Bearer bar'
        },
        formConfig: {}
      } as unknown as FormConfigRequest;
      const res = createResponseMock();
      const next = jest.fn();
      const formService = new FormService(opts);

      getPostgrestJwtMock.mockResolvedValue('baz');

      await formService.updateFormItem(req, res, next);
      expect(res.json).toHaveBeenCalled();
    });

    it('returns 401 if itemId is not provided', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo',
      } as Opts;
      const req: FormConfigRequest = {
        params: {
          formId: 'foo'
        },
        formConfig: {}
      } as FormConfigRequest;
      const res = createResponseMock();
      const next = jest.fn();
      const formService = new FormService(opts);

      await formService.updateFormItem(req, res, next);
      expect(next).toHaveBeenCalled();
    });
    it('checks if system is authenticated against postgrest', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo'
      } as Opts;
      const req: FormConfigRequest = {
        params: {
          formId: 'foo',
          itemId: 'bar'
        },
        formConfig: {}
      } as unknown as FormConfigRequest;
      getPostgrestJwtMock.mockResolvedValue(undefined);
      const res = createResponseMock();
      const next = jest.fn();
      const formService = new FormService(opts);

      await formService.updateFormItem(req, res, next);
      expect(getPostgrestJwtMock).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
  describe('deleteFormItem', () => {
    it('deletes the form item', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo',
      } as Opts;
      const mockedFormConfig: FormConfig = {
        foo: 'bar'
      } as unknown as FormConfig;
      const req: FormConfigRequest = {
        params: {
          formId: 'foo',
          itemId: 'bar'
        },
        headers: {
          authorization: 'Bearer bar'
        },
        formConfig: mockedFormConfig,
        userRoles: []
      } as unknown as FormConfigRequest;
      const res = createResponseMock();
      const next = jest.fn();
      const formService = new FormService(opts);
      const deleteFormItemResponse = {
        success: true,
        id: 'bar'
      };

      getPostgrestJwtMock.mockResolvedValue('baz');
      deleteFormItemMock.mockReturnValue(deleteFormItemResponse);

      await formService.deleteFormItem(req, res, next);
      expect(res.json).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(deleteFormItemResponse);
    });

    it('returns 401 if itemId is not provided', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo',
      } as Opts;
      const req: FormConfigRequest = {
        params: {
          formId: 'foo'
        },
        formConfig: {}
      } as FormConfigRequest;
      const res = createResponseMock();
      const next = jest.fn();
      const formService = new FormService(opts);

      await formService.deleteFormItem(req, res, next);
      expect(next).toHaveBeenCalled();
    });
    it('checks if system is authenticated against postgrest', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'foo'
      } as Opts;
      const req: FormConfigRequest = {
        params: {
          formId: 'foo',
          itemId: 'bar'
        },
        formConfig: {}
      } as unknown as FormConfigRequest;
      getPostgrestJwtMock.mockResolvedValue(undefined);
      const res = createResponseMock();
      const next = jest.fn();
      const formService = new FormService(opts);

      await formService.deleteFormItem(req, res, next);
      expect(getPostgrestJwtMock).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
  describe('getFile', () => {
    it('gets the file', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'forms',
        FILE_UPLOAD_DIR: 'uploads'
      } as Opts;

      const req: FormConfigRequest = {
        params: {
          formId: 'foo',
          0: 'file_1.png'
        }
      } as unknown as FormConfigRequest;

      fileExistsMock.mockResolvedValue(true);
      getFilePathMock.mockReturnValue('foo/file_1.png');

      const res = createResponseMock();
      const formService = new FormService(opts);
      await formService.getFile(req, res, jest.fn());

      expect(sendFileMock).toHaveBeenCalledWith('foo/file_1.png', { root: 'uploads' });
    });
    it('fails if the file does not exist', async () => {
      const opts: Opts = {
        FORM_CONFIGS_DIR: 'forms',
        FILE_UPLOAD_DIR: 'uploads'
      } as Opts;

      const req: FormConfigRequest = {
        params: {
          formId: 'foo',
          0: 'file_1.png'
        }
      } as unknown as FormConfigRequest;

      fileExistsMock.mockResolvedValue(false);

      const next = jest.fn();
      const formService = new FormService(opts);
      await formService.getFile(req, {} as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
