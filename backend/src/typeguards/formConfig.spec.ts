import { FormConfigInternal } from '../types/formConfigInternal';
import { JoinTable } from '../types/joinTable';
import { Relationship } from '../types/relationship';

import { isFormConfig } from './formConfig';

describe('FormConfigTypeGuards', () => {
  describe('isFormConfig', () => {
    it('returns true for FormConfig', () => {
      const formConfig: FormConfigInternal = {
        title: 'foo',
        description: 'bar',
        dataSource: {
          tableName: 'foo',
          idColumn: 'id',
          order: 'asc',
          orderBy: 'id'
        },
        access: {
          read: true,
          write: true
        },
        views: {
          table: true,
          item: true,
          pageSize: 10
        },
        includedProperties: ['id'],
        includedPropertiesTable: ['id'],
        properties: {
          id: {
            type: 'number'
          }
        }
      };
      expect(isFormConfig(formConfig)).toBe(true);
    });
    it('returns false for JoinTable config', () => {
      const joinTableConfig: JoinTable = {
        relationship: Relationship.ONE_TO_ONE,
        dataSource: {
          tableName: 'foo',
          idColumn: 'id'
        }
      };
      expect(isFormConfig(joinTableConfig)).toBe(false);
    });
    it('returns false for empty inputs', () => {
      expect(isFormConfig(undefined)).toBe(false);
    });
  });
});
