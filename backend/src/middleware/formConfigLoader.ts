import fs from 'node:fs/promises';
import path from 'path';

import { NextFunction, Request, Response } from 'express';

import { FormBackendErrorCode } from '../errors/FormBackendErrorCode';
import { GenericRequestError, InternalServerError } from '../errors/GenericRequestError';
import { setupLogger } from '../logger';
import { FormConfig } from '../types/formConfig';
import { FormConfigRequest } from '../types/formConfigRequest';

export const formConfigLoader = ({formConfigsDir}: {formConfigsDir: string}) => {

  const configsDir = path.join(process.cwd(), formConfigsDir);

  const logger = setupLogger({ label: 'formConfigLoader' });

  /**
   * Middleware loading the form config from the file system.
   * Adds the formConfig to the request object.
   */
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const formId = req.params.formId;
      if (!formId) {
        next(new GenericRequestError('No formId provided', 400, {errorCode: FormBackendErrorCode.FORM_ID_MISSING}));
      }
      // TODO validate formConfig
      const formConfigPath = path.join(configsDir, formId + '.json');
      const formConfigsDirContent = await fs.readdir(
        configsDir,
        { encoding: 'utf-8' }
      );
      const formConfigs = formConfigsDirContent
        .filter(f => f.endsWith('.json'))
        .map(f => f.split('.')[0]);
      if (!formConfigs.includes(formId)) {
        next(new GenericRequestError(
          'No formId provided', 404, {errorCode: FormBackendErrorCode.FORM_CONFIG_NOT_FOUND})
        );
        return;
      }
      const formConfigStr = await fs.readFile(formConfigPath, { encoding: 'utf-8' });
      const formConfig: FormConfig = JSON.parse(formConfigStr);
      // minor hack to allow overwriting the type of req
      const modifiedRequest = req as FormConfigRequest;
      modifiedRequest.formConfig = formConfig;
      next();
    } catch (err) {
      logger.debug('Cannot get form.', err);
      next(new InternalServerError());
    }
  };
};
