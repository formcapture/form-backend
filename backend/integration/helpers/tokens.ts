import { generateKeyPairSync } from 'crypto';

import jwt from 'jsonwebtoken';

import { KC_CLIENT_APP_ID, KC_PUBLIC_URL, KC_REALM, POSTGREST_JWT_SECRET } from './env';

const createKeyPair = () => generateKeyPairSync('rsa', { modulusLength: 2048 });

// stands in for the keycloak realm key
const realmKeys = createKeyPair();

export const kcPublicKey = realmKeys.publicKey.export({ type: 'spki', format: 'pem' }).toString();

interface UserTokenOpts {
  expired?: boolean;
  /** Sign with a key that is not the realm key. */
  foreignKey?: boolean;
}

/** A user token as keycloak would issue it for the app client. */
export const userToken = (roles: string[], { expired = false, foreignKey = false }: UserTokenOpts = {}) => {
  const privateKey = foreignKey ? createKeyPair().privateKey : realmKeys.privateKey;
  return jwt.sign(
    // eslint-disable-next-line camelcase
    { resource_access: { [KC_CLIENT_APP_ID]: { roles } } },
    privateKey,
    {
      algorithm: 'RS256',
      issuer: `${KC_PUBLIC_URL}/realms/${KC_REALM}`,
      expiresIn: expired ? -10 : '5m'
    }
  );
};

/** The token the form-backend uses for postgrest, accepted by the test postgrest. */
export const postgrestToken = () => jwt.sign(
  { role: 'formbackend' },
  POSTGREST_JWT_SECRET,
  { algorithm: 'HS256', expiresIn: '5m' }
);
