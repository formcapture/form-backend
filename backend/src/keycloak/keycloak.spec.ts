import jwt, { JwtPayload } from 'jsonwebtoken';

import { Opts } from '../types/opts';

import {
  decodeToken,
  getTokenFromHeader,
  getRolesFromToken,
  getPostgrestJwt,
  harmonizePublicKey
} from './keycloak';

jest.mock('jsonwebtoken');

describe('Keycloak', () => {

  const fetchMock = jest.fn();
  global.fetch = fetchMock;

  const opts: Opts = {
    KC_AUTH_SERVER_URL: 'http://foo/auth',
    KC_REALM: 'foo',
    KC_PUBLIC_KEY: 'foo',
    KC_CLIENT_APP_ID: 'foo',
  } as Opts;

  beforeEach(() => {
    fetchMock.mockClear();
  });

  describe('harmonizePublicKey', () => {
    const prefix = '-----BEGIN PUBLIC KEY-----';
    const suffix = '-----END PUBLIC KEY-----';
    const jwk = 'foo';
    const pem = `${prefix}\nfoo\n${suffix}`;

    it('returns the public key if it is already in PEM format', () => {
      const harmonizedPk = harmonizePublicKey(pem);
      expect(harmonizedPk).toBe(pem);
    });
    it('returns the public key in PEM format if it is in JWK format', () => {
      const harmonizedPk = harmonizePublicKey(jwk);
      expect(harmonizedPk).toBe(pem);
    });
    it('returns undefined if the public key is not present', () => {
      const harmonizedPk = harmonizePublicKey(undefined);
      expect(harmonizedPk).toBeUndefined();
    });
  });

  describe('decodeToken', () => {
    it('returns the decoded token if token is valid', () => {
      const token = 'foo';
      const decodedTokenMock = { foo: 'bar'};
      const verifyMock = jest.fn();
      jwt.verify = verifyMock;
      verifyMock.mockReturnValue(decodedTokenMock);
      const decodedToken = decodeToken(token, opts);
      expect(decodedToken).toEqual(decodedTokenMock);
    });
    it('returns undefined if token is not present', () => {
      const decodedToken = decodeToken(undefined, opts);
      expect(decodedToken).toBeUndefined();
    });
    it('returns undefined if token is invalid', () => {
      const token = 'foo';
      const verifyMock = jest.fn(() => (new Error() as any));
      jwt.verify = verifyMock;
      const decodedToken = decodeToken(token, opts);
      expect(decodedToken).toBeUndefined();
    });
  });
  describe('getTokenFromHeader', () => {
    it('returns the token from the authorization header', () => {
      const authorization = 'Bearer foo';
      const token = getTokenFromHeader(authorization);
      expect(token).toBe('foo');
    });
    it('returns undefined if the authorization header is not present', () => {
      const token = getTokenFromHeader(undefined);
      expect(token).toBeUndefined();
    });
    it('returns undefined if the authorization header is not a bearer token', () => {
      const authorization = 'Foo foo';
      const token = getTokenFromHeader(authorization);
      expect(token).toBeUndefined();
    });
  });
  describe('getRolesFromToken', () => {
    it('returns the roles from the decoded token', () => {
      const decodedToken = {
        // eslint-disable-next-line camelcase
        resource_access: {
          foo: {
            roles: ['foo', 'bar']
          }
        }
      } as JwtPayload;
      const roles = getRolesFromToken(decodedToken, opts);
      expect(roles).toEqual(['foo', 'bar']);
    });
    it('returns empty array if the roles are not present', () => {
      const decodedToken = {} as JwtPayload;
      const roles = getRolesFromToken(decodedToken, opts);
      expect(roles).toEqual([]);
    });
  });
  describe('getPostgrestJwt', () => {
    it('returns the token used for authenticating with postgrest', async () => {
      const mockData = {
        // eslint-disable-next-line camelcase
        access_token: 'foo'
      };
      fetchMock.mockReturnValue({
        success: true,
        status: 200,
        ok: true,
        json: () => new Promise((resolve) => resolve(mockData))
      });

      const postgrestJwt = await getPostgrestJwt(opts);
      expect(postgrestJwt).toBe(mockData.access_token);
    });
  });
});
