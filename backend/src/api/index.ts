import express from 'express';

import { Opts } from '../types/opts';

import createFormRouter from './form';
import createKeycloakRouter from './keycloak';
import { errorMiddleware } from '../errors/errorMiddleware';

const createApiRouter = (opts: Opts) => {
  const router = express.Router();

  router.use('/form', createFormRouter(opts));
  router.use('/keycloak', createKeycloakRouter(opts));
  router.use(errorMiddleware);

  return router;
};

export default createApiRouter;
