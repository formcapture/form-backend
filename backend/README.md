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

## Tests

```bash
npm test                  # unit tests with coverage, no external services
npm run test:integration  # integration tests, needs docker
```

The integration tests in `integration/` run the real backend against a real PostgREST and PostGIS.
`integration/docker-compose.yml` starts both with the test data from `integration/fixtures/sql` and
removes them afterwards. Keycloak is not started: the tests sign user tokens with their own RS256 key
and a small stub hands out the PostgREST tokens (see `integration/helpers`).

- Show the backend logs: `npm run test:integration -- --silent=false`
- Keep the containers after the run for inspection: `INTEGRATION_KEEP_STACK=1 npm run test:integration`,
  remove them with `docker compose -p fb-integration down -v`

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
| `KC_AUTH_SERVER_URL`                      | Keycloak auth URL used by the backend to request tokens for PostgREST. May be an internal URL, e.g. `http://keycloak:8080/auth`                           |
| `KC_PUBLIC_URL`                           | Keycloak auth URL as reached by the browser, e.g. `https://auth.example.org/auth`. Must match the issuer of user tokens (`<KC_PUBLIC_URL>/realms/<KC_REALM>`) |
| `KC_PUBLIC_KEY`                           | The public key of the Keycloak realm. Works with both PEM and JWK format. User tokens must be signed with RS256 (the Keycloak default)                    |
| `KC_CLIENT_APP_ID`                        | The ID of the Keycloak client used for the app. Only roles from this client will be considered                                                           |
| `LOG_LEVEL`                               | The log level for the logger. Optional. Valid values: `'debug'`, `'verbose'`, `'info'`, `'warn'`, `'error'`                                              |
