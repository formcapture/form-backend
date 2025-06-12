import Logger from '@terrestris/base-util/dist/Logger';
import Keycloak from 'keycloak-js';

export const authenticatedFetch = async (url: string, opts: {[key: string]: any}, keycloak?: Keycloak) => {
  if (keycloak) {
    try {
      await keycloak.updateToken();
    } catch (err) {
      Logger.error('Failed to update token');
    }
  }
  let headers = opts.headers || {};
  if (keycloak?.token) {
    headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return fetch(url, {
    ...opts,
    headers
  });
};
