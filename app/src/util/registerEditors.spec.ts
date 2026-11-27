import { JSONEditor } from '@json-editor/json-editor';

import { describe, expect, it } from 'vitest';

import { registerCustomEditors } from './registerEditors';

describe('registerCustomEditors', () => {
  registerCustomEditors();
  const [fileResolver, geometryResolver] = JSONEditor.defaults.resolvers;

  it('sets the german language', () => {
    expect(JSONEditor.defaults.language).toBe('de');
    expect(JSONEditor.defaults.languages.de.button_upload).toBe('Hochladen');
  });

  it('resolves the geometry editors', () => {
    expect(geometryResolver({ type: 'string', format: 'geometrySelection' })).toBe('geometrySelection');
    expect(geometryResolver({ type: 'string', format: 'location' })).toBe('location');
    expect(geometryResolver({ type: 'string', format: 'geometry(Point)' })).toBe('geometry');
    expect(geometryResolver({ type: 'string', format: 'date' })).toBeUndefined();
    expect(geometryResolver({ type: 'integer', format: 'geometry' })).toBeUndefined();
  });

  it('resolves the file editor', () => {
    expect(fileResolver({ type: 'string', media: { binaryEncoding: 'base64' } })).toBe('file');
    expect(fileResolver({ type: 'string' })).toBeFalsy();
  });
});
