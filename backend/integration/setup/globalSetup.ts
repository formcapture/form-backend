import { compose } from './compose';

const POSTGREST_READY_TIMEOUT_MS = 60_000;

const waitForPostgrest = async (url: string) => {
  const deadline = Date.now() + POSTGREST_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // not reachable yet
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`PostgREST at ${url} did not become ready within ${POSTGREST_READY_TIMEOUT_MS} ms`);
};

/** Starts a fresh database and postgrest for the integration tests. */
export default async () => {
  // start from a clean database, also if a previous run was aborted
  compose('down', '-v', '--remove-orphans');
  compose('up', '-d', '--wait');

  // e.g. "127.0.0.1:55012"
  const address = compose('port', 'postgrest', '3000').trim();
  const url = `http://${address}`;
  await waitForPostgrest(url);

  // tests run in band, so they see these
  process.env.INTEGRATION_POSTGREST_URL = url;
  process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'warn';
};
