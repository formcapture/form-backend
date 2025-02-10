export const checkFilterParams = (filterKey?: string, filterOp?: string, filterValue?: string) => {
  const allDefined = filterKey !== undefined && filterOp !== undefined && filterValue !== undefined;
  const allUndefined = filterKey === undefined && filterOp === undefined && filterValue === undefined;

  return allDefined || allUndefined;
};
