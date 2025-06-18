import { IGetRowsParams, ISimpleFilterModel } from '@ag-grid-community/core';
import Keycloak from 'keycloak-js';

import { ItemId } from '../App';

import { authenticatedFetch } from './authenticatedFetch';
import Logger from '@terrestris/base-util/dist/Logger';
import _isNil from 'lodash/isNil';

const fetchTableData = async (formId: string, getRowsParams: Partial<IGetRowsParams>, keycloak?: Keycloak) => {
  const defaultItems = {
    data: {
      results: [],
      count: 0
    }
  };
  if (formId === null) {
    Logger.error('Cannot fetch data. No formId provided');
    return defaultItems;
  }



  // const response = await getForm(formId, getRowsParams.startRow ?? 0, null, null, null, undefined, null, keycloak);
  let url = `../form/${formId}`;

  const params = new URLSearchParams({
    startRow: `${getRowsParams.startRow}`,
    endRow:`${getRowsParams.endRow}`,
  });

  if (!_isNil(getRowsParams.sortModel)) {
    const sortModel = getRowsParams.sortModel[0];
    console.log('sortModel', sortModel);
    if (sortModel) {
      params.append('order', sortModel.sort);
      params.append('orderBy', sortModel.colId);
    }
  }

  if (!_isNil(getRowsParams.filterModel)) {
    const filterModel = getRowsParams.filterModel;
    const filterKey = Object.keys(filterModel)[0];
    console.log('filterModel', filterModel);
    if (filterKey) {
      const filterValue = filterModel[filterKey].filter;
      const filterOp = filterModel[filterKey].type;
      params.append('filterKey', filterKey);
      params.append('filterValue', filterValue);
      params.append('filterOp', filterOp);
    }
  }
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await authenticatedFetch(url, {
    headers: {
      'Content-Type': 'application/json'
    }
  }, keycloak);

  if (response.status === 401) {
    return {
      error: 401
    };
  }
  if (response.status !== 200) {
    throw new Error('Failed to fetch data');
  }
  const json = await response.json();
  if (json.data === undefined) {
    throw new Error('Failed to fetch data');
  }

  return json;
};


const getForm = async (
  formId: string,
  page: number,
  filterKey?: string | null,
  filterOp?: ISimpleFilterModel['type'] | null,
  filterValue?: string | null,
  order?: 'asc' | 'desc',
  orderBy?: string | null,
  kc?: Keycloak
) => {
  let url = `../form/${formId}`;

  const params = new URLSearchParams({
    page: page.toString()
  });
  if (order) {
    params.append('order', order);
  }
  if (orderBy) {
    params.append('orderBy', orderBy);
  }
  if (filterKey) {
    params.append('filterKey', filterKey);
  }
  if (filterOp) {
    params.append('filterOp', filterOp);
  }
  if (filterValue) {
    params.append('filterValue', filterValue);
  }
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  return authenticatedFetch(url, {
    headers: {
      'Content-Type': 'application/json'
    }
  }, kc);
};

const getEmptyForm = async (formId: string, kc?: Keycloak) => {
  const url = `../form/${formId}/new`;

  return authenticatedFetch(url, {
    headers: {
      'Content-Type': 'application/json'
    }
  }, kc);
};

const getFormItem = async (formId: string, itemId: ItemId, kc?: Keycloak) => {
  const url = `../form/${formId}/item/${itemId}`;

  return authenticatedFetch(url, {
    headers: {
      'Content-Type': 'application/json'
    }
  }, kc);
};

const deleteItem = async (formId: string, itemId: ItemId, kc?: Keycloak) => {
  const url = `../form/${formId}/item/${itemId}`;

  return authenticatedFetch(url, { method: 'DELETE' }, kc);
};

const updateItem = async (formId: string, itemId: ItemId, body: object, kc?: Keycloak) => {
  const url = `../form/${formId}/item/${itemId}`;

  return authenticatedFetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }, kc);
};

const createItem = async (formId: string, body: object, kc?: Keycloak) => {
  const url = `../form/${formId}/item`;
  return authenticatedFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }, kc);
};

const fetchKeycloakConfig = async () => {
  return fetch('../keycloak/config');
};

const fetchFile = async (fileIdentifier: string, kc?: Keycloak) => {
  const fileUrl =  `../form/files/${fileIdentifier}`;
  return authenticatedFetch(fileUrl, {
    headers: {
      'Content-Type': 'application/octet-stream'
    }
  }, kc);
};

export default {
  fetchTableData,
  createItem,
  deleteItem,
  getEmptyForm,
  getForm,
  getFormItem,
  fetchFile,
  fetchKeycloakConfig,
  updateItem
};
