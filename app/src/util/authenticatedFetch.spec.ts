import Logger from '@terrestris/base-util/dist/Logger';
import Keycloak from 'keycloak-js';
import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';

import { authenticatedFetch } from './authenticatedFetch';

global.fetch = vi.fn();

describe('authenticatedFetch', () => {
  let mockKeycloak: Mocked<Keycloak>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockKeycloak = {
      updateToken: vi.fn().mockResolvedValue(undefined),
      token: 'mocked-token',
    } as any;
  });

  it('updates the token if keycloak is provided', async () => {
    await authenticatedFetch('https://example.com', {}, mockKeycloak);

    expect(mockKeycloak.updateToken).toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith('https://example.com', {
      headers: {
        Authorization: 'Bearer mocked-token',
      },
    });
  });

  it('logs an error if token update fails', async () => {
    vi.spyOn(Logger, 'error');
    mockKeycloak.updateToken.mockRejectedValue(new Error('Token update failed'));

    await authenticatedFetch('https://example.com', {}, mockKeycloak);

    expect(Logger.error).toHaveBeenCalledWith('Failed to update token');
    expect(fetch).toHaveBeenCalledWith('https://example.com', {
      headers: {
        Authorization: 'Bearer mocked-token',
      },
    });
  });

  it('should not set Authorization header if no keycloak is provided', async () => {
    await authenticatedFetch('https://example.com', {});

    expect(fetch).toHaveBeenCalledWith('https://example.com', {
      headers: {},
    });
  });

  it('preserves existing headers and add Authorization header', async () => {
    const existingHeaders = {
      'Content-Type': 'application/json',
    };

    await authenticatedFetch('https://example.com', { headers: existingHeaders }, mockKeycloak);

    expect(fetch).toHaveBeenCalledWith('https://example.com', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mocked-token',
      },
    });
  });

  it('should work even if headers are not provided in opts', async () => {
    await authenticatedFetch('https://example.com', {}, mockKeycloak);

    expect(fetch).toHaveBeenCalledWith('https://example.com', {
      headers: {
        Authorization: 'Bearer mocked-token',
      },
    });
  });
});
