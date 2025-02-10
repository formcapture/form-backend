import { ISimpleFilterModel } from '@ag-grid-community/core';

export const isFilterType = (value: any): value is ISimpleFilterModel['type'] => {
  return [
    'empty', 'equals', 'notEqual', 'lessThan', 'lessThanOrEqual',
    'greaterThan', 'greaterThanOrEqual', 'inRange', 'contains',
    'notContains', 'startsWith', 'endsWith', 'blank', 'notBlank'
  ].includes(value);
};
