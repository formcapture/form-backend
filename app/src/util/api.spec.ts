import { afterEach, describe, expect, it, vi } from 'vitest';

import Logger from '@terrestris/base-util/dist/Logger';

import api from './api';
import { authenticatedFetch } from './authenticatedFetch';

vi.mock('./authenticatedFetch', () => ({
  authenticatedFetch: vi.fn()
}));

const fetchMock = vi.mocked(authenticatedFetch);

const jsonResponse = (body: any, status = 200) => new Response(JSON.stringify(body), { status });

describe('api', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('fetchTableData', () => {
    it('returns empty data without formId', async () => {
      vi.spyOn(Logger, 'error').mockImplementation(() => undefined);
      const result = await api.fetchTableData(null as unknown as string, {});
      expect(result).toEqual({ data: { results: [], count: 0 } });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('requests the data with sort and filter params', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: { count: 1 } }));
      const result = await api.fetchTableData('f1', {
        startRow: 0,
        endRow: 10,
        sortModel: [{ colId: 'name', sort: 'desc' }],
        filterModel: { name: { filter: 'abc', type: 'contains' } }
      });
      expect(result).toEqual({ data: { count: 1 } });
      expect(fetchMock.mock.calls[0][0]).toBe(
        '../form/f1?startRow=0&endRow=10&order=desc&orderBy=name&filterKey=name&filterValue=abc&filterOp=contains'
      );
    });

    it('ignores empty sort and filter models', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: {} }));
      await api.fetchTableData('f1', { startRow: 0, endRow: 10, sortModel: [], filterModel: {} });
      expect(fetchMock.mock.calls[0][0]).toBe('../form/f1?startRow=0&endRow=10');
    });

    it('returns an error object on 401', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}, 401));
      expect(await api.fetchTableData('f1', {})).toEqual({ error: 401 });
    });

    it('throws on other errors and missing data', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({}, 500));
      await expect(api.fetchTableData('f1', {})).rejects.toThrow('Failed to fetch data');
      fetchMock.mockResolvedValueOnce(jsonResponse({}));
      await expect(api.fetchTableData('f1', {})).rejects.toThrow('Failed to fetch data');
    });
  });

  describe('getForm', () => {
    it('adds all given params', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}));
      await api.getForm('f1', 'name', 'contains', 'abc', 'asc', 'name');
      expect(fetchMock.mock.calls[0][0]).toBe(
        '../form/f1?order=asc&orderBy=name&filterKey=name&filterOp=contains&filterValue=abc'
      );
    });

    it('adds no query without params', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}));
      await api.getForm('f1');
      expect(fetchMock.mock.calls[0][0]).toBe('../form/f1');
    });
  });

  it('requests empty forms and items', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await api.getEmptyForm('f1');
    await api.getFormItem('f1', 3);
    expect(fetchMock.mock.calls[0][0]).toBe('../form/f1/new');
    expect(fetchMock.mock.calls[1][0]).toBe('../form/f1/item/3');
  });

  it('deletes, updates and creates items', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    await api.deleteItem('f1', 3);
    await api.updateItem('f1', 3, { a: 1 });
    await api.createItem('f1', { a: 2 });
    expect(fetchMock.mock.calls[0]).toEqual(['../form/f1/item/3', { method: 'DELETE' }, undefined]);
    expect(fetchMock.mock.calls[1][0]).toBe('../form/f1/item/3');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PATCH', body: '{"a":1}' });
    expect(fetchMock.mock.calls[2][0]).toBe('../form/f1/item');
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: 'POST', body: '{"a":2}' });
  });

  it('fetches files and the keycloak config', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    const globalFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}));
    await api.fetchFile('root/file_a.png');
    await api.fetchKeycloakConfig();
    expect(fetchMock.mock.calls[0][0]).toBe('../form/files/root/file_a.png');
    expect(globalFetch).toHaveBeenCalledWith('../keycloak/config');
  });
});
