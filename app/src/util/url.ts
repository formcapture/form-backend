import { ISimpleFilterModel } from '@ag-grid-community/core';

import { ItemId } from '../App';
import { isFilterType } from '../typeguards';
import Logger from '@terrestris/base-util/dist/Logger';

export const getOrderFromUrl = (url: string) => {
  const urlInst = new URL(url);
  const order = new URLSearchParams(urlInst.search).get('order');
  if (order === 'asc' || order === 'desc') {
    return order;
  }
  return;
};

export const getFilterFromUrl: any = (url: string) => {
  const urlInst = new URL(url);
  const filterKey = new URLSearchParams(urlInst.search).get('filterKey');
  const filterOp = new URLSearchParams(urlInst.search).get('filterOp');
  const filterValue = new URLSearchParams(urlInst.search).get('filterValue');

  const filterOpTyped = isFilterType(filterOp) ? filterOp : undefined;

  return {
    filterKey,
    filterOp: filterOpTyped,
    filterValue
  };
};

export const getPageFromUrl = (url: string) => {
  const urlInst = new URL(url);
  const page = new URLSearchParams(urlInst.search).get('page');
  if (!page) {
    return 0;
  }
  try {
    const parsedPage = parseInt(page, 10);
    if (Number.isNaN(parsedPage) || parsedPage < 1) {
      return 0;
    }
    return parsedPage - 1;
  } catch (e) {
    Logger.warn('Could not parse page from URL', e);
    return 0;
  }
};

export interface ItemViewQueryParams {
  formId: string;
  itemId?: ItemId;
  message?: string;
  prev?: string;
}

export const createItemViewUrl = (
  baseUrl: string,
  {formId, itemId, prev, message}: ItemViewQueryParams
) => {
  const cleanBaseUrl = baseUrl.split('?')[0];
  const url = new URL(cleanBaseUrl);
  url.searchParams.set('view', 'item');
  url.searchParams.set('formId', formId);
  if (itemId !== null && itemId !== undefined) {
    url.searchParams.set('itemId', itemId.toString());
  }
  if (prev) {
    url.searchParams.set('prev', prev);
  }
  if (message) {
    url.searchParams.set('msg', message);
  }
  return url.toString();
};

export interface TableViewQueryParams {
  formId: string;
  message?: string;
  page?: number;
  order?: string;
  orderBy?: string;
  filterKey?: string;
  filterOp?: ISimpleFilterModel['type'];
  filterValue?: string;
}

export const createTableViewUrl = (
  baseUrl: string,
  {
    formId,
    message,
    page,
    order,
    orderBy,
    filterValue,
    filterOp,
    filterKey
  }: TableViewQueryParams
) => {
  const cleanBaseUrl = baseUrl.split('?')[0];
  const url = new URL(cleanBaseUrl);
  url.searchParams.set('view', 'table');
  url.searchParams.set('formId', formId);
  if (message) {
    url.searchParams.set('msg', message);
  }
  if (page) {
    url.searchParams.set('page', page.toString());
  }
  if (order) {
    url.searchParams.set('order', order);
  }
  if (orderBy) {
    url.searchParams.set('orderBy', orderBy);
  }
  if (filterKey) {
    url.searchParams.set('filterKey', filterKey);
  }
  if (filterOp) {
    url.searchParams.set('filterOp', filterOp);
  }
  if (filterValue) {
    url.searchParams.set('filterValue', filterValue);
  }
  return url.toString();
};
