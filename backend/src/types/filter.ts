export interface FilterType {
  filterKey: string;
  filterOp: 'contains' | 'equals' | 'greaterThan' | 'lessThan' | 'like' | 'notEqual';
  filterValue: string;
}
