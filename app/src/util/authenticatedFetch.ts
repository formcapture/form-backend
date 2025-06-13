import Keycloak from 'keycloak-js';

import Logger from '@terrestris/base-util/dist/Logger';

export const authenticatedFetch = async (url: string, opts: Record<string, any>, keycloak?: Keycloak) => {
  if (keycloak) {
    try {
      await keycloak.updateToken();
    } catch (e) {
      Logger.error(`Failed to update token: ${e}`);
    }
  }
  const headers = opts.headers || {};
  if (keycloak?.token) {
    headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return fetch(url, {
    ...opts,
    headers
  });
};
