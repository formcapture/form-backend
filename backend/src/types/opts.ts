/** Type for the form-backend environment variables. */
export interface Opts {
  /** Directory for the form configurations */
  FORM_CONFIGS_DIR: string;
  /** Directory for the file uploads */
  FILE_UPLOAD_DIR: string;
  /**
   * The size limit for incoming requests.
   * Expects a string like '1mb'. For more details see
   * https://expressjs.com/en/4x/api.html#express.json
   * */
  SIZE_LIMIT: string;
  /** Address for postgrest */
  POSTGREST_URL: string;
  /** The default schema for postgrest */
  POSTGREST_DEFAULT_SCHEMA: string;
  /**
   * The id of the keycloak client that authenticates
   * our backend with postgrest.
   */
  POSTGREST_JWT_CLIENT_ID: string;
  /**
   * The secret for the keycloak client that authenticates
   * our backend with postgrest.
   */
  POSTGREST_KEYCLOAK_CLIENT_SECRET: string;
  /** Keycloak realm */
  KC_REALM: string;
  /** Keycloak auth url */
  KC_AUTH_SERVER_URL: string;
  /**
   * The public key of the keycloak realm.
   * Works with both PEM and JWK format.
   */
  KC_PUBLIC_KEY: string;
  /**
   * The id of the keycloak client used for the app.
   * Only roles from this client will be taken into account.
   */
  KC_CLIENT_APP_ID: string;
  /**
   * The log level for the logger.
   */
  LOG_LEVEL?: 'debug' | 'verbose' | 'info' | 'warn' | 'error';
}
