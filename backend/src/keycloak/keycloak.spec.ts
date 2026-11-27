import { generateKeyPairSync } from 'crypto';

import jwt, { JwtPayload } from 'jsonwebtoken';

import { Opts } from '../types/opts';

import {
  clearPostgrestJwtCache,
  decodeToken,
  getTokenFromHeader,
  getRolesFromToken,
  getPostgrestJwt,
  getPublicKeycloakRealmUrl,
  harmonizePublicKey
} from './keycloak';

jest.mock('jsonwebtoken');

describe('Keycloak', () => {

  const fetchMock = jest.fn();
  global.fetch = fetchMock;

  const opts: Opts = {
    KC_AUTH_SERVER_URL: 'http://foo/auth',
    KC_PUBLIC_URL: 'https://public.foo/auth',
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
    it('verifies the issuer against the public keycloak url, not the internal one', () => {
      const verifyMock = jest.fn();
      jwt.verify = verifyMock;
      decodeToken('foo', opts);
      expect(verifyMock).toHaveBeenCalledWith('foo', opts.KC_PUBLIC_KEY, {
        issuer: 'https://public.foo/auth/realms/foo'
      });
    });

    describe('with real tokens', () => {
      const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
      const realOpts: Opts = {
        ...opts,
        KC_PUBLIC_KEY: publicKey.export({ type: 'spki', format: 'pem' }).toString()
      };
      const { sign, verify } = jest.requireActual('jsonwebtoken');
      const signToken = (iss: string) => sign(
        // eslint-disable-next-line camelcase
        { resource_access: { foo: { roles: ['editor'] } } },
        privateKey,
        { algorithm: 'RS256', issuer: iss }
      );

      beforeEach(() => {
        jwt.verify = verify;
      });

      it('accepts a token issued by the public keycloak url', () => {
        const decodedToken = decodeToken(signToken('https://public.foo/auth/realms/foo'), realOpts);
        expect(getRolesFromToken(decodedToken, realOpts)).toEqual(['editor']);
      });
      it('rejects a token issued by the internal keycloak url', () => {
        const decodedToken = decodeToken(signToken('http://foo/auth/realms/foo'), realOpts);
        expect(decodedToken).toBeUndefined();
      });
    });
  });

  describe('getPublicKeycloakRealmUrl', () => {
    it('builds the realm url from KC_PUBLIC_URL', () => {
      expect(getPublicKeycloakRealmUrl(opts)).toBe('https://public.foo/auth/realms/foo');
    });
    it('handles a trailing slash in KC_PUBLIC_URL', () => {
      const realmUrl = getPublicKeycloakRealmUrl({ ...opts, KC_PUBLIC_URL: 'https://public.foo/auth/' });
      expect(realmUrl).toBe('https://public.foo/auth/realms/foo');
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
    const tokenResponse = (token: string, expiresIn?: number) => ({
      ok: true,
      // eslint-disable-next-line camelcase
      json: async () => ({ access_token: token, expires_in: expiresIn })
    });

    beforeEach(() => {
      clearPostgrestJwtCache();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('caches the token until shortly before it expires', async () => {
      const now = 1_000_000;
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now);
      fetchMock.mockResolvedValueOnce(tokenResponse('first', 60)).mockResolvedValueOnce(tokenResponse('second', 60));

      expect(await getPostgrestJwt(opts)).toBe('first');
      nowSpy.mockReturnValue(now + 29_000);
      expect(await getPostgrestJwt(opts)).toBe('first');
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // 60s lifetime minus 30s margin
      nowSpy.mockReturnValue(now + 30_000);
      expect(await getPostgrestJwt(opts)).toBe('second');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('does not cache tokens without expiry', async () => {
      fetchMock.mockResolvedValue(tokenResponse('foo'));

      await getPostgrestJwt(opts);
      await getPostgrestJwt(opts);

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('does not cache failed token requests', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 401 }).mockResolvedValueOnce(tokenResponse('foo', 60));

      expect(await getPostgrestJwt(opts)).toBeUndefined();
      expect(await getPostgrestJwt(opts)).toBe('foo');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('caches tokens per client', async () => {
      fetchMock.mockResolvedValueOnce(tokenResponse('a', 60)).mockResolvedValueOnce(tokenResponse('b', 60));

      expect(await getPostgrestJwt({ ...opts, POSTGREST_JWT_CLIENT_ID: 'a' })).toBe('a');
      expect(await getPostgrestJwt({ ...opts, POSTGREST_JWT_CLIENT_ID: 'b' })).toBe('b');
    });

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
    it('returns undefined if the token request fails', async () => {
      fetchMock.mockReturnValue({ ok: false, status: 401 });

      expect(await getPostgrestJwt(opts)).toBeUndefined();
    });
    it('decodes the token for logging if log level is verbose', async () => {
      const verifyMock = jest.fn().mockReturnValue({});
      jwt.verify = verifyMock;
      fetchMock.mockReturnValue({
        ok: true,
        // eslint-disable-next-line camelcase
        json: async () => ({ access_token: 'foo' })
      });

      const postgrestJwt = await getPostgrestJwt({ ...opts, LOG_LEVEL: 'verbose' } as Opts);

      expect(verifyMock).toHaveBeenCalledWith('foo', expect.anything(), expect.anything());
      expect(postgrestJwt).toBe('foo');
    });
  });
});
