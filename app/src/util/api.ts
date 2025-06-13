import { ISimpleFilterModel } from '@ag-grid-community/core';
import Keycloak from 'keycloak-js';

import { ItemId } from '../App';

import { authenticatedFetch } from './authenticatedFetch';

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
  createItem,
  deleteItem,
  getEmptyForm,
  getForm,
  getFormItem,
  fetchFile,
  fetchKeycloakConfig,
  updateItem
};
