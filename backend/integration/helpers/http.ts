import { getPostgrestUrl } from './env';
import { postgrestToken } from './tokens';

interface RequestOpts {
  token?: string;
  method?: string;
  body?: unknown;
}

/** Calls the form-backend and returns status and parsed body. */
export const request = async (baseUrl: string, path: string, { token, method = 'GET', body }: RequestOpts = {}) => {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }
  return { status: response.status, body: json, text };
};

/** Calls the test postgrest directly as the formbackend role, e.g. to check or clean up data. */
export const postgrest = async (path: string, method = 'GET') => {
  const response = await fetch(`${getPostgrestUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${postgrestToken()}`,
      'Accept-Profile': 'sampledata',
      'Content-Profile': 'sampledata'
    }
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : undefined };
};

/** Ids of the seed fountains in integration/fixtures/sql/01_schema.sql. */
export const SEED_FOUNTAIN_COUNT = 12;

/** Removes fountains created by tests, so every test file starts with the seed data. */
export const removeCreatedFountains = () => postgrest(`/fountains?id=gt.${SEED_FOUNTAIN_COUNT}`, 'DELETE');
