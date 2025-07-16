import jwt, { JwtPayload, VerifyOptions } from 'jsonwebtoken';

import { setupLogger } from '../logger';
import { Opts } from '../types/opts';

const getKeycloakRealmUrl = (opts: Opts) => {
  return `${opts.KC_AUTH_SERVER_URL}${opts.KC_AUTH_SERVER_URL.endsWith('/') ? '' : '/'}realms/${opts.KC_REALM}`;
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

  const issuerUrl = getKeycloakRealmUrl(opts);
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

/**
 * Get the token used for authenticating with postgrest.
 * @param opts The opts.
 * @returns The token or undefined if authentication failed.
 */
export const getPostgrestJwt = async (opts: Opts) => {
  const logger = setupLogger({ label: 'keycloak' });
  const payload = {
    // eslint-disable-next-line camelcase
    client_id: opts.POSTGREST_JWT_CLIENT_ID,
    // eslint-disable-next-line camelcase
    client_secret: opts.POSTGREST_KEYCLOAK_CLIENT_SECRET,
    // eslint-disable-next-line camelcase
    grant_type: 'client_credentials'
  };
  const url = `${getKeycloakRealmUrl(opts)}/protocol/openid-connect/token`;
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
  return data.access_token;
};
