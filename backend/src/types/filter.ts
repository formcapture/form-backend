export interface FilterType {
  filterOp: 'equals' | 'notEqual' | 'like' | 'greaterThan' | 'lessThan' | 'contains';
  filterKey: string;
  filterValue: string;
}
