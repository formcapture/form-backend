import { execFileSync } from 'child_process';
import path from 'path';

import { COMPOSE_PROJECT } from '../helpers/env';

const composeFile = path.join(__dirname, '..', 'docker-compose.yml');

/** Runs `docker compose` for the integration test project and returns its stdout. */
export const compose = (...args: string[]) => execFileSync(
  'docker',
  ['compose', '--progress', 'quiet', '-p', COMPOSE_PROJECT, '-f', composeFile, ...args],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }
);
