import { describe, it, expect } from 'vitest';

import { FormConfiguration } from '../App';

import { getFeaturesFromTableData, getGeometryColumns, isFilterableProp, isSortableProp } from './table';

describe('Table', () => {
  const mockDataSuccess: FormConfiguration = {
    config: {
      properties: {
        key: {},
        Name: {},
        Value: {},
        geom: {
          type: 'string',
          format: 'geometry'
        }
      },
      idColumn: 'id',
      editable: true,
      views: {
        table: true,
        item: true,
        pageSize: 10
      },
      order: 'desc',
      orderBy: 'name',
    },
    data: {
      count: 2,
      data: [
        { key: 'Item 1', id: 1, Name: 'Test-Object 1', Value: 10, City: 'BN', geom: 'Point(1,2)'},
        { key: 'Item 2', id: 2, Name: 'Test-Object 2', Value: 20, City: 'K' , geom: 'Point(2,1)'},
      ]
    },
  };
  const mockDataFailure: FormConfiguration = {
    config: {
      properties: {
        key: {},
        Name: {},
        Value: {}
      },
      idColumn: 'id',
      editable: true,
      views: {
        table: true,
        item: true,
        pageSize: 10
      },
      order: 'desc',
      orderBy: 'name',
    },
    data: {
      count: 2,
      data: [
        { key: 'Item 1', id: 1, Name: 'Test-Object 1', Value: 10, City: 'BN'},
        { key: 'Item 2', id: 2, Name: 'Test-Object 2', Value: 20, City: 'K'},
      ]
    },
  };

  describe('isFilterableProp', () => {
    it('returns true if prop is a string', () => {
      expect(isFilterableProp({ type: 'string' })).toBe(true);
    });
    it('returns true if prop is a number', () => {
      expect(isFilterableProp({ type: 'number' })).toBe(true);
    });
    it('returns true if prop is an integer', () => {
      expect(isFilterableProp({ type: 'integer' })).toBe(true);
    });
    it('returns false if prop is a boolean', () => {
      expect(isFilterableProp({ type: 'boolean' })).toBe(false);
    });
    it('returns false if prop is a file upload', () => {
      expect(isFilterableProp({ type: 'string', media: { binaryEncoding: 'base64' } })).toBe(false);
    });
    it('returns false if prop is a geometry', () => {
      expect(isFilterableProp({ type: 'string', format: 'geometry' })).toBe(false);
    });
    it('returns false if prop is an enum', () => {
      expect(isFilterableProp({ type: 'string', enumSource: [] })).toBe(false);
    });
  });

  describe('isSortableProp', () => {
    it('returns true if prop is a string', () => {
      expect(isSortableProp({ type: 'string' })).toBe(true);
    });
    it('returns true if prop is a number', () => {
      expect(isSortableProp({ type: 'number' })).toBe(true);
    });
    it('returns true if prop is an integer', () => {
      expect(isSortableProp({ type: 'integer' })).toBe(true);

    });
    it('returns true if prop is a boolean', () => {
      expect(isSortableProp({ type: 'boolean' })).toBe(true);
    });
    it('returns true if prop is an enum', () => {
      expect(isSortableProp({ type: 'string', enumSource: [] })).toBe(true);
    });
    it('returns false if prop is a file upload', () => {
      expect(isSortableProp({ type: 'string', media: { binaryEncoding: 'base64' } })).toBe(false);
    });
    it('returns false if prop is a geometry', () => {
      expect(isSortableProp({ type: 'string', format: 'geometry' })).toBe(false);
    });
  });

  describe('getGeometryColumns', () => {
    it('returns the correct geometry columns', () => {
      expect(getGeometryColumns(mockDataSuccess.config)).toHaveLength(1);
      expect(getGeometryColumns(mockDataFailure.config)).toHaveLength(0);
    });
  });
  describe('getFeaturesFromTableData', () => {
    it('returns the correct number of features', () => {
      expect(getFeaturesFromTableData(
        mockDataSuccess.data.data,
        mockDataSuccess.config,
        ['geom'])).toHaveLength(2);
      expect(getFeaturesFromTableData(
        mockDataFailure.data.data,
        mockDataFailure.config,
        [])).toHaveLength(0);
    });
  });
});
