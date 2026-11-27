import { startBackend, TestBackend } from './helpers/backend';
import { removeCreatedFountains, request, SEED_FOUNTAIN_COUNT } from './helpers/http';

describe('reading a public form', () => {
  let backend: TestBackend;
  const get = (path: string) => request(backend.url, path);

  beforeAll(async () => {
    await removeCreatedFountains();
    backend = await startBackend();
  });

  afterAll(async () => {
    await backend.close();
  });

  it('returns the configured columns of the first page', async () => {
    const { status, body } = await get('/form/fountains_public');

    expect(status).toBe(200);
    expect(body.data.count).toBe(SEED_FOUNTAIN_COUNT);
    expect(body.data.data).toHaveLength(10);
    expect(body.data.data[0]).toEqual({ id: 1, name: 'Brunnen 01', type: 2 });
    expect(Object.keys(body.config.properties)).toEqual(['id', 'name', 'type']);
    expect(body.config.editable).toBe(false);
  });

  it('pages with startRow and endRow', async () => {
    const { body } = await get('/form/fountains_public?startRow=10&endRow=20');

    expect(body.data.count).toBe(SEED_FOUNTAIN_COUNT);
    expect(body.data.data.map((f: any) => f.id)).toEqual([11, 12]);
  });

  it('orders by the given column', async () => {
    const { body } = await get('/form/fountains_public?order=desc&orderBy=name&startRow=0&endRow=3');

    expect(body.data.data.map((f: any) => f.name)).toEqual(['Brunnen 12', 'Brunnen 11', 'Brunnen 10']);
  });

  it.each([
    ['equals', 'name', 'Brunnen 05', 1],
    ['notEqual', 'name', 'Brunnen 05', SEED_FOUNTAIN_COUNT - 1],
    ['greaterThan', 'id', '10', 2],
    ['lessThan', 'id', '3', 2],
    ['contains', 'name', 'Brunnen 1', 3],
    ['like', 'name', 'brunnen 0', 9]
  ])('filters with %s', async (filterOp, filterKey, filterValue, expectedCount) => {
    const query = new URLSearchParams({ filterKey, filterOp, filterValue });
    const { status, body } = await get(`/form/fountains_public?${query}`);

    expect(status).toBe(200);
    expect(body.data.count).toBe(expectedCount);
  });

  it('returns a single item', async () => {
    const { status, body } = await get('/form/fountains_public/item/5');

    expect(status).toBe(200);
    expect(body.data.data).toEqual([{ id: 5, name: 'Brunnen 05', type: 2 }]);
  });

  it('returns the config of an empty item', async () => {
    const { status, body } = await get('/form/fountains_public/new');

    expect(status).toBe(200);
    expect(body.data).toEqual([]);
    expect(body.config.idColumn).toBe('id');
  });

  it('answers unknown forms with 404', async () => {
    const { status, body } = await get('/form/does_not_exist');
    expect(status).toBe(404);
    expect(body.message).toBe('Form config for formId does_not_exist not found');
  });

  it.each([
    ['order=foo'],
    ['orderBy=a&orderBy=b'],
    ['startRow=5&endRow=2'],
    ['filterKey=name']
  ])('answers invalid parameters (%s) with 400', async (query) => {
    expect((await get(`/form/fountains_public?${query}`)).status).toBe(400);
  });
});
