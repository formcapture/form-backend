import { describe, it, expect } from 'vitest';

import { isGeometryType } from './jsonEditor';

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
});
