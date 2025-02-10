import express from 'express';

import { authorization, userRolesLoader as userRolesLoaderCreator } from '../middleware/authorization';
import { formConfigLoader } from '../middleware/formConfigLoader';
import FormService from '../service/form';
import { FormConfigRequest } from '../types/formConfigRequest';
import { Opts } from '../types/opts';

export const createFormRouter = (opts: Opts) => {
  const router = express.Router();
  router.use(express.json({
    limit: opts.SIZE_LIMIT
  }));
  const configLoader = formConfigLoader({ formConfigsDir: opts.FORM_CONFIGS_DIR });
  const userRolesLoader = userRolesLoaderCreator({ opts });

  const service = new FormService(opts);

  /** Get the form config and data */
  router.get('/:formId',
    configLoader,
    (req, res, next) => userRolesLoader(req as FormConfigRequest, res, next),
    (req, res, next) => {
      const authorizationChecker = authorization({ opts, requiredPermissions: ['readForm', 'tableView'] });
      authorizationChecker(req as FormConfigRequest, res, next);
    },
    (req, res, next) => service.getForm(req as FormConfigRequest, res, next)
  );
  /** Get the form config without data */
  router.get('/:formId/new',
    configLoader,
    (req, res, next) => userRolesLoader(req as FormConfigRequest, res, next),
    (req, res, next) => {
      const authorizationChecker = authorization({ opts, requiredPermissions: ['readForm', 'itemView'] });
      authorizationChecker(req as FormConfigRequest, res, next);
    },
    (req, res, next) => service.getEmptyForm(req as FormConfigRequest, res, next)
  );
  /** Get the form config and a single form item */
  router.get('/:formId/item/:itemId',
    configLoader,
    (req, res, next) => userRolesLoader(req as FormConfigRequest, res, next),
    (req, res, next) => {
      const authorizationChecker = authorization({ opts, requiredPermissions: ['readForm', 'itemView'] });
      authorizationChecker(req as FormConfigRequest, res, next);
    },
    (req, res, next) => service.getFormItem(req as FormConfigRequest, res, next)
  );
  /** Create a new form item */
  router.post('/:formId/item',
    configLoader,
    (req, res, next) => userRolesLoader(req as FormConfigRequest, res, next),
    (req, res, next) => {
      const authorizationChecker = authorization({ opts, requiredPermissions: ['writeForm'] });
      authorizationChecker(req as FormConfigRequest, res, next);
    },
    (req, res, next) => service.createFormItem(req as FormConfigRequest, res, next)
  );
  /** Update an existing form item */
  router.patch('/:formId/item/:itemId',
    configLoader,
    (req, res, next) => userRolesLoader(req as FormConfigRequest, res, next),
    (req, res, next) => {
      const authorizationChecker = authorization({ opts, requiredPermissions: ['writeForm'] });
      authorizationChecker(req as FormConfigRequest, res, next);
    },
    (req, res, next) => service.updateFormItem(req as FormConfigRequest, res, next)
  );
  /** Delete an existing form item */
  router.delete('/:formId/item/:itemId',
    configLoader,
    (req, res, next) => userRolesLoader(req as FormConfigRequest, res, next),
    (req, res, next) => {
      const authorizationChecker = authorization({ opts, requiredPermissions: ['writeForm'] });
      authorizationChecker(req as FormConfigRequest, res, next);
    },
    (req, res, next) => service.deleteFormItem(req as FormConfigRequest, res, next)
  );
  /** Get a single file for an item */
  router.get('/files/:formId/*',
    configLoader,
    (req, res, next) => userRolesLoader(req as FormConfigRequest, res, next),
    (req, res, next) => {
      const authorizationChecker = authorization({ opts, requiredPermissions: ['readForm', 'itemView'] });
      authorizationChecker(req as FormConfigRequest, res, next);
    },
    (req, res, next) => service.getFile(req as FormConfigRequest, res, next)
  );
  return router;
};

export default createFormRouter;
