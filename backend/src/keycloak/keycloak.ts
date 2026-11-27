import jwt, { JwtPayload, VerifyOptions } from 'jsonwebtoken';

import { setupLogger } from '../logger';
import { Opts } from '../types/opts';

const getRealmUrl = (baseUrl: string, realm: string) => {
  return `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}realms/${realm}`;
};

/** Realm URL for requests from the backend to Keycloak (may be an internal URL). */
const getKeycloakRealmUrl = (opts: Opts) => {
  return getRealmUrl(opts.KC_AUTH_SERVER_URL, opts.KC_REALM);
};

/**
 * Realm URL as seen by the browser. Keycloak uses it as issuer (`iss`)
 * of the tokens that users obtain when logging in.
 */
export const getPublicKeycloakRealmUrl = (opts: Opts) => {
  return getRealmUrl(opts.KC_PUBLIC_URL, opts.KC_REALM);
};

export const harmonizePublicKey = (pk: string|undefined) => {
  if (!pk) {
    return;
  }
  const prefix = '-----BEGIN PUBLIC KEY-----';
  const suffix = '-----END PUBLIC KEY-----';
  if (pk.startsWith(prefix) && pk.endsWith(suffix)) {
    return pk;
  }
  return `${prefix}\n${pk}\n${suffix}`;
};

export const decodeToken = (token: string|undefined, opts: Opts) => {
  const logger = setupLogger({ label: 'keycloak' });

  if (!token) {
    return;
  }

  // user tokens are issued to the browser, so their issuer is the public URL
  const issuerUrl = getPublicKeycloakRealmUrl(opts);
  const publicKey = opts.KC_PUBLIC_KEY;
  const verifyOpts: VerifyOptions = {
    issuer: issuerUrl,
  };
  try {
    const decodedToken = jwt.verify(token, publicKey, verifyOpts);
    if (decodedToken instanceof Error) {
      logger.debug('Failed to decode token. Token invalid.');
      return;
    }
    return decodedToken as JwtPayload;
  } catch (err) {
    logger.debug('Failed to decode token. Token invalid.', err);
  }
};

export const getTokenFromHeader = (authorization: string|undefined) => {
  if (!authorization) {
    return;
  }
  const [scheme, token] = authorization.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer') {
    return;
  }
  return token;
};

export const getRolesFromToken = (decodedToken: JwtPayload|undefined, opts: Opts) => {
  return decodedToken?.resource_access?.[opts.KC_CLIENT_APP_ID]?.roles ?? [];
};

// refresh the token this long before it expires, so it does not expire while a request is running
const POSTGREST_JWT_EXPIRY_MARGIN_MS = 30_000;
// shortcut: parallel requests on a cold cache each fetch a token; share an in-flight promise if Keycloak load matters
const postgrestJwtCache = new Map<string, { token: string; expiresAt: number }>();

/** Clears the cached postgrest tokens. */
export const clearPostgrestJwtCache = () => postgrestJwtCache.clear();

/**
 * Get the token used for authenticating with postgrest.
 * The token is cached until shortly before it expires.
 * @param opts The opts.
 * @returns The token or undefined if authentication failed.
 */
export const getPostgrestJwt = async (opts: Opts) => {
  const logger = setupLogger({ label: 'keycloak' });
  const url = `${getKeycloakRealmUrl(opts)}/protocol/openid-connect/token`;
  const cacheKey = `${url}|${opts.POSTGREST_JWT_CLIENT_ID}`;
  const cached = postgrestJwtCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  const payload = {
    // eslint-disable-next-line camelcase
    client_id: opts.POSTGREST_JWT_CLIENT_ID,
    // eslint-disable-next-line camelcase
    client_secret: opts.POSTGREST_KEYCLOAK_CLIENT_SECRET,
    // eslint-disable-next-line camelcase
    grant_type: 'client_credentials'
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(payload).toString()
  });
  if (!response.ok) {
    logger.error('Failed to get postgrest jwt');
    return;
  }
  const data = await response.json();

  if (opts.LOG_LEVEL === 'verbose') {
    logger.verbose('Got postgrest jwt');
    const jwtPayload = decodeToken(data.access_token, opts);
    logger.verbose(`Granted resources: ${JSON.stringify(jwtPayload?.resource_access ?? {})}`);
  }

  if (data.access_token && typeof data.expires_in === 'number') {
    postgrestJwtCache.set(cacheKey, {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000 - POSTGREST_JWT_EXPIRY_MARGIN_MS
    });
  }

  return data.access_token;
};
