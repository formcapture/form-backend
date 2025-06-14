export interface FilterType {
  filterOp: 'equals' | 'notEqual' | 'like' | 'greaterThan' | 'lessThan';
  filterKey: string;
  filterValue: string;
}
