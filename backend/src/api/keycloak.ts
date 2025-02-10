import express from 'express';

import KeycloakService from '../service/keycloak';
import { Opts } from '../types/opts';

export const createKeycloakRouter = (opts: Opts) => {
  const router = express.Router();
  router.use(express.json());
  const service = new KeycloakService(opts);

  router.get('/config', (req, res) => service.getPublicKeycloakConfig(req, res));

  return router;
};

export default createKeycloakRouter;
