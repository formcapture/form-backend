import { access, readFile } from 'fs/promises';
import path from 'path';

import { startBackend, TestBackend } from './helpers/backend';
import { postgrest, removeCreatedFountains, request } from './helpers/http';
import { userToken } from './helpers/tokens';

describe('creating, updating and deleting items with joins and files', () => {
  let backend: TestBackend;
  const token = userToken(['fountains_editor']);
  const call = (urlPath: string, method = 'GET', body?: unknown) =>
    request(backend.url, urlPath, { token, method, body });
  const getItem = async (id: number) => (await call(`/form/fountains_editor/item/${id}`)).body.data.data[0];

  beforeAll(async () => {
    await removeCreatedFountains();
    backend = await startBackend();
  });

  afterAll(async () => {
    await removeCreatedFountains();
    await backend.close();
  });

  it('resolves lookup and join tables of an item', async () => {
    const item = await getItem(1);

    expect(item).toEqual({
      id: 1,
      name: 'Brunnen 01',
      type: 2,
      contacts: [{ id: 1, name: 'Schmidt' }, { id: 2, name: 'Müller' }],
      // eslint-disable-next-line camelcase
      fountains_pictures: []
    });
  });

  it('creates, updates and deletes an item including join rows and files', async () => {
    // create with a lookup value, a many-to-many relation and a one-to-many file
    const created = await call('/form/fountains_editor/item', 'POST', {
      name: 'Testobjekt',
      type: 3,
      contacts: [{ id: 1 }, { id: 3 }],
      // eslint-disable-next-line camelcase
      fountains_pictures: [{ img_path: `data:text/plain;base64,${Buffer.from('Hallo').toString('base64')}` }]
    });
    expect(created.status).toBe(200);
    expect(created.body.success).toBe(true);
    const id = created.body.id;

    const item = await getItem(id);
    expect(item.name).toBe('Testobjekt');
    expect(item.type).toBe(3);
    expect(item.contacts).toEqual([{ id: 1, name: 'Schmidt' }, { id: 3, name: 'Meyer' }]);
    expect(item.fountains_pictures).toHaveLength(1);

    // the file is stored in the upload dir and served by the files endpoint
    const filePath = item.fountains_pictures[0].img_path;
    expect(await readFile(path.join(backend.uploadDir, filePath), 'utf8')).toBe('Hallo');
    const file = await call(`/form/files/${filePath}`);
    expect(file.status).toBe(200);
    expect(file.text).toBe('Hallo');

    // update: change a column and replace a relation
    const updated = await call(`/form/fountains_editor/item/${id}`, 'PATCH', {
      ...item,
      name: 'Testobjekt geändert',
      contacts: [{ id: 2 }]
    });
    expect(updated.status).toBe(200);
    const updatedItem = await getItem(id);
    expect(updatedItem.name).toBe('Testobjekt geändert');
    expect(updatedItem.contacts).toEqual([{ id: 2, name: 'Müller' }]);
    // many-to-many: only the relation is removed, the contacts themselves stay
    expect((await postgrest('/contacts?select=id')).body).toHaveLength(3);

    // delete removes the item, its join rows and its files
    const deleted = await call(`/form/fountains_editor/item/${id}`, 'DELETE');
    expect(deleted.status).toBe(200);
    expect((await postgrest(`/fountains?id=eq.${id}`)).body).toEqual([]);
    expect((await postgrest(`/fountains_contacts?fountain_id=eq.${id}`)).body).toEqual([]);
    expect((await postgrest(`/fountains_pictures?fountain_id=eq.${id}`)).body).toEqual([]);
    // one-to-many items are deleted, not only unjoined
    expect((await postgrest('/fountains_pictures?fountain_id=is.null')).body).toEqual([]);
    await expect(access(path.join(backend.uploadDir, filePath))).rejects.toThrow();
  });

  it('removes the one-to-many items and their files when deleting an item', async () => {
    const created = await call('/form/fountains_editor/item', 'POST', {
      name: 'Testobjekt mit Bild',
      // eslint-disable-next-line camelcase
      fountains_pictures: [{ img_path: `data:text/plain;base64,${Buffer.from('Bild').toString('base64')}` }]
    });
    const id = created.body.id;
    const filePath = (await getItem(id)).fountains_pictures[0].img_path;

    const pictureId = (await getItem(id)).fountains_pictures[0].id;

    await call(`/form/fountains_editor/item/${id}`, 'DELETE');

    expect((await postgrest(`/fountains_pictures?id=eq.${pictureId}`)).body).toEqual([]);
    await expect(access(path.join(backend.uploadDir, filePath))).rejects.toThrow();
  });

  it('only unjoins one-to-many items that are removed while updating', async () => {
    const created = await call('/form/fountains_editor/item', 'POST', {
      name: 'Testobjekt mit entferntem Bild',
      // eslint-disable-next-line camelcase
      fountains_pictures: [{ img_path: `data:text/plain;base64,${Buffer.from('Bild').toString('base64')}` }]
    });
    const id = created.body.id;
    const item = await getItem(id);
    const pictureId = item.fountains_pictures[0].id;

    // eslint-disable-next-line camelcase
    await call(`/form/fountains_editor/item/${id}`, 'PATCH', { ...item, fountains_pictures: [] });

    const picture = (await postgrest(`/fountains_pictures?id=eq.${pictureId}`)).body;
    // eslint-disable-next-line camelcase
    expect(picture).toEqual([expect.objectContaining({ id: pictureId, fountain_id: null })]);
    await postgrest(`/fountains_pictures?id=eq.${pictureId}`, 'DELETE');
  });

  it('answers a missing file with 404', async () => {
    expect((await call('/form/files/fountains_editor/fountains_pictures/does_not_exist.png')).status).toBe(404);
  });

  it('rejects files with a mime type that is not allowed', async () => {
    const created = await call('/form/fountains_editor/item', 'POST', {
      name: 'Testobjekt mit falscher Datei',
      // eslint-disable-next-line camelcase
      fountains_pictures: [{ img_path: 'data:application/zip;base64,UEsDBA==' }]
    });
    expect(created.status).toBeGreaterThanOrEqual(400);
  });
});
