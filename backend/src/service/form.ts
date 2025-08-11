import { NextFunction, Response } from 'express';
import { Logger } from 'winston';

import {
  AuthenticationError,
  FormRequestError,
  GenericRequestError,
  InternalServerError
} from '../errors/GenericRequestError';
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
        page
      } = req.query;
      let parsedPage;
      if (order !== null && order !== undefined && order !== 'asc' && order !== 'desc') {
        next(new FormRequestError(
          'Invalid value for argument "order". Must be "asc" or "desc"', 400, {
            errorCode: 'INVALID_ORDER'
          }));
        return;
      }
      // Query params are strings or arrays. We only support strings.
      if (orderBy !== null && orderBy !== undefined && typeof orderBy !== 'string') {
        next(new FormRequestError(
          'Invalid value for argument "orderBy"', 400, {
            errorCode: 'INVALID_ORDER_BY'
          }));
        return;
      }
      // Query params are strings or arrays. We only support strings.
      if (page !== null && page !== undefined && typeof page !== 'string') {
        next(new FormRequestError(
          'Invalid value for argument "page"', 400, {
            errorCode: 'INVALID_PAGE'
          }));
        return;
      }
      let filter;
      if (!checkFilterParams(filterKey as string, filterOp as string, filterValue as string)) {
        // Invalid set of filter params
        next(new FormRequestError(
          'Invalid filter parameter combination.', 400, {
            errorCode: 'INVALID_FILTER'
          }));
        return;
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
      if (page) {
        try {
          parsedPage = parseInt(page, 10);
          if (isNaN(parsedPage)) {
            next(new InternalServerError('Could not parse page number'));
            return;
          }
        } catch {
          next(new FormRequestError(
            'Invalid value for argument "page"', 400, {
              errorCode: 'INVALID_PAGE'
            }));
          return;
        }
      }
      const postgrestToken = await getPostgrestJwt(this.#opts);
      if (!postgrestToken) {
        next(new AuthenticationError('Failed to get postgrest token'));
        return;
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

      const processedForm = await formProcessor.getTableForm(parsedPage, filter);
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
        next(new AuthenticationError('Failed to get postgrest token'));
        return;
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

      if (!formId) {
        next(new GenericRequestError('No formId provided', 400, {errorCode: 'FORM_ID_MISSING'}));
        return;
      }
      if (!itemId) {
        next(new GenericRequestError('No itemId provided', 400, {errorCode: 'ITEM_ID_MISSING'}));
        return;
      }

      const postgrestToken = await getPostgrestJwt(this.#opts);
      if (!postgrestToken) {
        next(new AuthenticationError('Failed to get postgrest token'));
        return;
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
        next(new AuthenticationError('Failed to get postgrest token'));
        return;
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

      if (!itemId) {
        next(new GenericRequestError('No itemId provided', 400, {errorCode: 'ITEM_ID_MISSING'}));
        return;
      }

      this.#logger.debug(`Updating form item ${JSON.stringify(req.body)} for formId ${formId}`);

      const postgrestToken = await getPostgrestJwt(this.#opts);
      if (!postgrestToken) {
        next(new AuthenticationError('Failed to get postgrest token'));
        return;
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

      if (!itemId) {
        next(new GenericRequestError('No itemId provided', 400, {errorCode: 'ITEM_ID_MISSING'}));
        return;
      }

      const postgrestToken = await getPostgrestJwt(this.#opts);
      if (!postgrestToken) {
        next(new AuthenticationError('Failed to get postgrest token'));
        return;
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
      // Making sure that file exists in the expected directory
      // to prevent disclosing files from other directories/forms
      const fileExists = await fileProcessor.fileExists(fileIdentifier);
      if (!fileExists) {
        next(new GenericRequestError('Invalid file(s).', 500, {
          errorCode: 'INVALID_FILE',
          detailedMessage: 'One or more files are invalid or missing.'
        }));
        return;
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
