/** Shared settings of the integration test stack (see integration/docker-compose.yml). */
export const COMPOSE_PROJECT = 'fb-integration';

// test-only secret, must match PGRST_JWT_SECRET in integration/docker-compose.yml
export const POSTGREST_JWT_SECRET = 'integration-test-secret-not-for-production-use';

export const KC_REALM = 'test';
export const KC_PUBLIC_URL = 'https://auth.integration.test/auth';
export const KC_CLIENT_APP_ID = 'form-backend-app';
export const POSTGREST_JWT_CLIENT_ID = 'postgrest-client';

/** Relative to the backend folder, the form-backend resolves it against the working directory. */
export const FORM_CONFIGS_DIR = 'integration/fixtures/form_configs';

export const getPostgrestUrl = () => {
  const url = process.env.INTEGRATION_POSTGREST_URL;
  if (!url) {
    throw new Error('INTEGRATION_POSTGREST_URL is not set. Run the tests via `npm run test:integration`.');
  }
  return url;
};
