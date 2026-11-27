import { describe, it, expect } from 'vitest';

import { getItemId, isGeometryType } from './jsonEditor';

describe('jsonEditor', () => {

  describe('isGeometryType', () => {
    it('returns true for geometry types', () => {
      expect(isGeometryType('geometry')).toBe(true);
      expect(isGeometryType('geometry(POINT)')).toBe(true);
      expect(isGeometryType('geometry(POINT, 4326)')).toBe(true);
      expect(isGeometryType('myschema.geometry')).toBe(true);
      expect(isGeometryType('myschema.geometry(POINT)')).toBe(true);
      expect(isGeometryType('myschema.geometry(POINT, 4326)')).toBe(true);
      expect(isGeometryType('geometry(LINESTRING)')).toBe(true);
      expect(isGeometryType('geometry(LINESTRING, 4326)')).toBe(true);
      expect(isGeometryType('myschema.geometry(LINESTRING)')).toBe(true);
      expect(isGeometryType('myschema.geometry(LINESTRING, 4326)')).toBe(true);
    });
    it('returns false for non-geometry types', () => {
      expect(isGeometryType('string')).toBe(false);
    });
  });

  describe('isGeometryType with empty values', () => {
    it('returns false', () => {
      expect(isGeometryType('')).toBe(false);
      expect(isGeometryType(undefined as unknown as string)).toBe(false);
    });
  });

  describe('getItemId', () => {
    it('returns the id of the root editor', () => {
      // eslint-disable-next-line camelcase
      const root = { original_schema: { idColumn: 'id' }, value: { id: 5 } };
      expect(getItemId({ parent: { parent: root } })).toBe(5);
      expect(getItemId(root)).toBe(5);
    });
  });
});
