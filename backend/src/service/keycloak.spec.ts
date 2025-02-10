import { Request, Response } from 'express';

import { Opts } from '../types/opts';

import KeycloakService from './keycloak';

const createResponseMock = () => {
  const res: Response = {} as Response;
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);
  return res;
};

describe('KeycloakService', () => {
  describe('getPublicKeycloakConfig', () => {
    it('should return the public keycloak config', () => {
      const opts: Opts = {
        KC_AUTH_SERVER_URL: 'foo',
        KC_REALM: 'bar',
        KC_CLIENT_APP_ID: 'baz'
      } as Opts;
      const service = new KeycloakService(opts);
      const res = createResponseMock();
      service.getPublicKeycloakConfig({} as Request, res);
      expect(res.json).toHaveBeenCalledWith({
        url: 'foo',
        realm: 'bar',
        clientId: 'baz'
      });
    });
  });
});
