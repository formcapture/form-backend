# Form-Backend

Backend providing form configuration and data input.

## Development

Expects a running instance of postgrest and keycloak.

Run the form backend as follows:

```bash
cd backend
npm ci
npm run dev
```

or use the VSCode `Backend Run Dev Server` configuration.

Application will be accessible on `localhost:3000`.

See `localhost:3000/docs` for the documentation.

<!-- Todo: docker based dev setup -->

## Configuration

Create a `.env` file with all needed config parameters. Every key
defined in the `Opts` type in `./src/types/opts.ts` can be used as
variable here.

| **Environment Variable**                  | **Description**                                                                                                                                           |
|------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| `FORM_CONFIGS_DIR`                        | Directory for the form configurations                                                                                                                     |
| `FILE_UPLOAD_DIR`                         | Directory for the file uploads                                                                                                                            |
| `SIZE_LIMIT`                              | The size limit for incoming requests. Expects a string like `'1mb'`. See: [Express JSON API](https://expressjs.com/en/4x/api.html#express.json)         |
| `POSTGREST_URL`                           | Address for PostgREST                                                                                                                                     |
| `POSTGREST_DEFAULT_SCHEMA`                | The default schema for PostgREST                                                                                                                          |
| `POSTGREST_SCHEMA`                        | A comma-separated list of schemas that are exposed by PostgREST                                                                                           |
| `POSTGREST_JWT_CLIENT_ID`                 | The ID of the Keycloak client that authenticates the backend with PostgREST                                                                               |
| `POSTGREST_KEYCLOAK_CLIENT_SECRET`        | The secret for the Keycloak client that authenticates the backend with PostgREST                                                                          |
| `KC_REALM`                                | Keycloak realm                                                                                                                                            |
| `KC_AUTH_SERVER_URL`                      | Keycloak auth URL                                                                                                                                         |
| `KC_PUBLIC_KEY`                           | The public key of the Keycloak realm. Works with both PEM and JWK format                                                                                  |
| `KC_CLIENT_APP_ID`                        | The ID of the Keycloak client used for the app. Only roles from this client will be considered                                                           |
| `LOG_LEVEL`                               | The log level for the logger. Optional. Valid values: `'debug'`, `'verbose'`, `'info'`, `'warn'`, `'error'`                                              |
