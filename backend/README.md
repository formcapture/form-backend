# Form-Backend

Backend providing form configuration and data input.

## Development

Expects a running instance of postgrest and keycloak.
The compose setup in `masterportal-docker` can be used for that.

Run the form backend as follows:

```bash
cd backend
npm ci
npm run dev
```

or use the VSCode `Backend Run Dev Server` configuration.

Application will be accessible on `localhost:3000`.

See `localhost:3000/docs` for the documentation.

## Configuration

Create a `.env` file with all needed config parameters. Every key
defined in the `Opts` type in `./src/types/opts.ts` can be used as
variable here.
