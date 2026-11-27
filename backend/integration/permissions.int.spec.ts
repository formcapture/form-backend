import { startBackend, TestBackend } from './helpers/backend';
import { removeCreatedFountains, request } from './helpers/http';
import { userToken } from './helpers/tokens';

describe('permissions', () => {
  let backend: TestBackend;

  beforeAll(async () => {
    backend = await startBackend();
  });

  afterAll(async () => {
    await removeCreatedFountains();
    await backend.close();
  });

  it('allows anonymous users to read public forms', async () => {
    expect((await request(backend.url, '/form/fountains_public')).status).toBe(200);
  });

  it('does not allow writing a read-only form, even with a role', async () => {
    const { status } = await request(backend.url, '/form/fountains_public/item', {
      method: 'POST',
      token: userToken(['fountains_editor']),
      body: { name: 'Testobjekt' }
    });
    expect(status).toBe(401);
  });

  it('rejects anonymous users on protected forms', async () => {
    expect((await request(backend.url, '/form/fountains_editor')).status).toBe(401);
  });

  it('rejects users without the required role', async () => {
    const { status } = await request(backend.url, '/form/fountains_editor', { token: userToken(['other_role']) });
    expect(status).toBe(401);
  });

  it('allows users with the required role', async () => {
    const { status } = await request(backend.url, '/form/fountains_editor', { token: userToken(['fountains_editor']) });
    expect(status).toBe(200);
  });

  it.each([
    ['expired', userToken(['fountains_editor'], { expired: true })],
    ['signed with a foreign key', userToken(['fountains_editor'], { foreignKey: true })]
  ])('treats a token that is %s as anonymous', async (_, token) => {
    expect((await request(backend.url, '/form/fountains_editor', { token })).status).toBe(401);
    expect((await request(backend.url, '/form/fountains_public', { token })).status).toBe(200);
  });

  it('rejects the table view of a form without table view', async () => {
    expect((await request(backend.url, '/form/fountains_item_only')).status).toBe(401);
    expect((await request(backend.url, '/form/fountains_item_only/item/1')).status).toBe(200);
  });

  it('fetches the postgrest token only once for several requests', async () => {
    const before = backend.tokenStub.requestCount();
    await request(backend.url, '/form/fountains_public');
    await request(backend.url, '/form/fountains_public/item/1');
    expect(backend.tokenStub.requestCount() - before).toBeLessThanOrEqual(1);
  });
});
