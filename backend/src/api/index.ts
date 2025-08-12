import express from 'express';

import { errorMiddleware } from '../errors/errorMiddleware';
import { Opts } from '../types/opts';

import createFormRouter from './form';
import createKeycloakRouter from './keycloak';

const createApiRouter = (opts: Opts) => {
  const router = express.Router();

  router.use('/form', createFormRouter(opts));
  router.use('/keycloak', createKeycloakRouter(opts));

  // add error handling middleware
  router.use(errorMiddleware);

  return router;
};

export default createApiRouter;
