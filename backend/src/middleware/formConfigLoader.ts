import fs from 'node:fs/promises';
import path from 'path';

import { NextFunction, Request, Response } from 'express';

import { GenericRequestError } from '../errors/GenericRequestError';
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
        throw new GenericRequestError('No formId provided');
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
        throw new GenericRequestError(`FormConfig not found for id ${formId}`);
      }
      const formConfigStr = await fs.readFile(formConfigPath, { encoding: 'utf-8' });
      const formConfig: FormConfig = JSON.parse(formConfigStr);
      // minor hack to allows overwriting the type of req
      const modifiedRequest = req as FormConfigRequest;
      modifiedRequest.formConfig = formConfig;
      next();
    } catch (err) {
      logger.debug('Cannot get form.', err);
      next(err);
    }
  };
};
