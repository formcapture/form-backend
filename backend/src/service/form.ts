import { NextFunction, Response } from 'express';
import _isNil from 'lodash/isNil';
import _isFinite from 'lodash/isFinite';
import { Logger } from 'winston';

import { GenericRequestError } from '../errors/GenericRequestError';
import { checkFilterParams } from '../filter/filter';
import { getPostgrestJwt } from '../keycloak/keycloak';
import { setupLogger } from '../logger';
import { FileProcessor } from '../processor/file';
import { FormProcessor } from '../processor/form';
import { FormConfigRequest } from '../types/formConfigRequest';
import { Opts } from '../types/opts';

class FormService {
  #opts: Opts;
  #logger: Logger;

  constructor(opts: Opts) {
    this.#opts = opts;
    this.#logger = setupLogger({ label: 'formService' });
  }

  async getForm(req: FormConfigRequest, res: Response, next: NextFunction) {
    try {
      const formId = req.params.formId;
      const {
        formConfig,
        userRoles
      } = req;

      const {
        filterKey,
        filterOp,
        filterValue,
        order,
        orderBy,
        startRow,
        endRow
      } = req.query;
      if (order !== null && order !== undefined && order !== 'asc' && order !== 'desc') {
        throw new GenericRequestError('Invalid value for argument "order"');
      }
      // Query params are strings or arrays. We only support strings.
      if (orderBy !== null && orderBy !== undefined && typeof orderBy !== 'string') {
        throw new GenericRequestError('Invalid value for argument "orderBy"');
      }
      // Query params are strings or arrays. We only support strings.
      if (_isNil(startRow) || typeof startRow !== 'string') {
        throw new GenericRequestError('Invalid value for argument "startRow"');
      }
      if (_isNil(endRow) || typeof endRow !== 'string') {
        throw new GenericRequestError('Invalid value for argument "endRow"');
      }
      let filter;
      if (!checkFilterParams(filterKey as string, filterOp as string, filterValue as string)) {
        // Invalid set of filter params
        throw new GenericRequestError('Invalid filter parameter combination.');
      } else if (filterKey && typeof filterKey === 'string' &&
        filterOp && typeof filterOp === 'string' &&
        filterValue && typeof filterValue === 'string'
      ) {
        // Valid filter set
        filter = {
          filterKey,
          filterOp,
          filterValue
        };
      }

      let parsedStartRow, parsedEndRow;
      try {
        parsedStartRow = parseInt(startRow, 10);
        parsedEndRow = parseInt(endRow, 10);
        if (!_isFinite(parsedStartRow) || !_isFinite(parsedEndRow)) {
          throw new Error();
        }
      } catch {
        throw new GenericRequestError('Invalid value for argument "startRow" / "endRow". Must be a number.');
      }
      const postgrestToken = await getPostgrestJwt(this.#opts);
      if (!postgrestToken) {
        throw new GenericRequestError('Failed to get postgrest token');
      }

      const formProcessor = await FormProcessor.createFormProcessor(
        this.#opts,
        formConfig,
        formId,
        userRoles,
        postgrestToken,
        order,
        orderBy
      );

      const processedForm = await formProcessor.getTableForm(parsedStartRow, parsedEndRow, filter);
      return res.json(processedForm);
    } catch (err) {
      if (err instanceof GenericRequestError) {
        this.#logger.debug(`Cannot get form: ${err.message}`);
      } else if (err instanceof Error) {
        this.#logger.error(`Cannot get form: ${err.message}`);
      }
      next(err);
    }
  }

  async getEmptyForm(req: FormConfigRequest, res: Response, next: NextFunction) {
    try {
      const {
        formId
      } = req.params;

      const {
        formConfig,
        userRoles
      } = req;

      const postgrestToken = await getPostgrestJwt(this.#opts);
      if (!postgrestToken) {
        throw new GenericRequestError('Failed to get postgrest token');
      }

      const formProcessor = await FormProcessor.createFormProcessor(
        this.#opts,
        formConfig,
        formId,
        userRoles,
        postgrestToken
      );

      const processedForm = await formProcessor.getEmptyItemForm();
      return res.json(processedForm);
    } catch (err) {
      if (err instanceof GenericRequestError) {
        this.#logger.debug(`Cannot get empty form: ${err.message}`);
      } else if (err instanceof Error) {
        this.#logger.error(`Cannot get empty form: ${err.message}`);
      }
      next(err);
    }
  }

  async getFormItem(req: FormConfigRequest, res: Response, next: NextFunction) {
    try {
      const {
        formId,
        itemId
      } = req.params;
      const {
        formConfig,
        userRoles
      } = req;

      if (itemId === undefined || itemId === null) {
        throw new GenericRequestError('No formId or itemId provided');
      }

      const postgrestToken = await getPostgrestJwt(this.#opts);
      if (!postgrestToken) {
        throw new GenericRequestError('Failed to get postgrest token');
      }

      const formProcessor = await FormProcessor.createFormProcessor(
        this.#opts,
        formConfig,
        formId,
        userRoles,
        postgrestToken
      );

      const processedForm = await formProcessor.getItemForm(itemId);
      return res.json(processedForm);
    } catch (err) {
      if (err instanceof GenericRequestError) {
        this.#logger.debug(`Cannot get formItem: ${err.message}`);
      } else if (err instanceof Error) {
        this.#logger.error(`Cannot get formItem: ${err.message}`);
      }
      next(err);
    }
  }

  async createFormItem(req: FormConfigRequest, res: Response, next: NextFunction) {
    try {
      const formId = req.params.formId;
      const {
        formConfig,
        userRoles
      } = req;

      this.#logger.debug(`Creating form item ${JSON.stringify(req.body)} for formId ${formId}`);

      const postgrestToken = await getPostgrestJwt(this.#opts);
      if (!postgrestToken) {
        throw new GenericRequestError('Failed to get postgrest token');
      }

      const formProcessor = await FormProcessor.createFormProcessor(
        this.#opts,
        formConfig,
        formId,
        userRoles,
        postgrestToken
      );
      const createResponse = await formProcessor.createFormItem(req.body);

      return res.json(createResponse);
    } catch (err) {
      if (err instanceof GenericRequestError) {
        this.#logger.debug(`Cannot create formItem: ${err.message}`);
      } else if (err instanceof Error) {
        this.#logger.error(`Cannot create formItem: ${err.message}`);
      }
      next(err);
    }
  }

  async updateFormItem(req: FormConfigRequest, res: Response, next: NextFunction) {
    try {
      const {
        formId,
        itemId
      } = req.params;
      const {
        formConfig,
        userRoles
      } = req;

      if (itemId === undefined || itemId === null) {
        throw new GenericRequestError('No itemId provided');
      }

      this.#logger.debug(`Updating form item ${JSON.stringify(req.body)} for formId ${formId}`);

      const postgrestToken = await getPostgrestJwt(this.#opts);
      if (!postgrestToken) {
        throw new GenericRequestError('Failed to get postgrest token');
      }

      // TODO should we also check for active table/item view here?
      const formProcessor = await FormProcessor.createFormProcessor(
        this.#opts,
        formConfig,
        formId,
        userRoles,
        postgrestToken
      );
      const updateResponse = await formProcessor.updateFormItem(req.body, itemId);

      return res.json(updateResponse);
    } catch (err) {
      if (err instanceof GenericRequestError) {
        this.#logger.debug(`Cannot update formItem: ${err.message}`);
      } else if (err instanceof Error) {
        this.#logger.error(`Cannot update formItem: ${err.message}`);
      }
      next(err);
    }
  }

  async deleteFormItem(req: FormConfigRequest, res: Response, next: NextFunction) {
    try {
      const {
        formId,
        itemId
      } = req.params;
      const {
        formConfig,
        userRoles
      } = req;

      if (itemId === undefined || itemId === null) {
        throw new GenericRequestError('No itemId provided');
      }

      const postgrestToken = await getPostgrestJwt(this.#opts);
      if (!postgrestToken) {
        throw new GenericRequestError('Failed to get postgrest token');
      }

      const formProcessor = await FormProcessor.createFormProcessor(
        this.#opts,
        formConfig,
        formId,
        userRoles,
        postgrestToken
      );
      const deleteResponse = await formProcessor.deleteFormItem(itemId);

      return res.json(deleteResponse);
    } catch (err) {
      if (err instanceof GenericRequestError) {
        this.#logger.debug(`Cannot delete formItem: ${err.message}`);
      } else if (err instanceof Error) {
        this.#logger.error(`Cannot delete formItem: ${err.message}`);
      }
      next(err);
    }
  }

  async getFile(req: FormConfigRequest, res: Response, next: NextFunction) {
    try {
      const {
        formId,
      } = req.params;
      const fileIdentifier = req.params[0];

      const fileProcessor = new FileProcessor({ opts: this.#opts, formId });
      // Making sure file exists in expected directory
      // in order to prevent disclosing files from other directories/forms
      const fileExists = await fileProcessor.fileExists(fileIdentifier);
      if (!fileExists) {
        throw new GenericRequestError('File not found');
      }
      const filePath = fileProcessor.getFilePath(fileIdentifier);
      return res.sendFile(filePath, { root: this.#opts.FILE_UPLOAD_DIR });
    } catch (err) {
      if (err instanceof GenericRequestError) {
        this.#logger.debug(`Cannot get file: ${err.message}`);
      } else if (err instanceof Error) {
        this.#logger.error(`Cannot get file: ${err.message}`);
      }
      next(err);
    }
  }
}

export default FormService;
