import React, { useEffect, useState } from 'react';

import { JSONEditor } from '@json-editor/json-editor';
import Keycloak, { KeycloakConfig } from 'keycloak-js';

import ErrorPage from './Component/ErrorPage/ErrorPage';
import FileEditor from './Component/FileEditor/FileEditor';
import GeometryEditor from './Component/GeometryEditor/GeometryEditor';
import GeometrySelection from './Component/GeometrySelection/GeometrySelection';
import ItemView from './Component/ItemView/ItemView';
import LoadingPage from './Component/LoadingPage/LoadingPage';
import Location from './Component/Location/Location';
import TableView from './Component/TableView/TableView';
import ToastAlert from './Component/ToastAlert/ToastAlert';
import { TOAST_MESSAGE } from './constants/toastMessage';
import { getKeycloakInst, setKeycloakInst } from './singletons/keycloak';
import api from './util/api';
import { DE, isGeometryType } from './util/jsonEditor';
import { getFilterFromUrl, getOrderFromUrl, getPageFromUrl } from './util/url';

import './App.css';

export type EnumValue = {
  title?: string;
  value?: string | number;
};

export type EnumSource = {
  source?: EnumValue[];
  title?: string;
  value?: string;
};

export type FormItemProperty = {
  type?: 'string';
  readonly?: boolean;
};

export type FormItem = {
  properties?: Record<string, FormItemProperty>;
  readOnly?: boolean;
  type?: 'object';
};

export type FormPropertyFormat = 'integer' | 'character varying' | 'table' | 'location' | 'double precision' |
  'geometry' | 'geometrySelection' | `geometry.(${string})` | `${string}.geometry` | `${string}.geometry(${string})`;

export type FormProperty = {
  format?: FormPropertyFormat;
  type?: 'integer' | 'string' | 'boolean' | 'array' | 'object' | 'number';
  description?: string;
  readOnly?: boolean;
  enumSource?: EnumSource[];
  items?: FormItem;
  properties?: FormItem['properties'];
  title?: string;
  media?: any;
};

export type FormConfiguration = {
  config: {
    title?: string;
    description?: string;
    editable: boolean;
    idColumn: string;
    properties: Record<string, FormProperty>;
    views: {
      table: boolean;
      item: boolean;
      pageSize: number;
    };
    order: 'asc' | 'desc';
    orderBy: string;
  };
  data: {
    count: number;
    data: Record<string, string | number | object>[];
  };
};

export type ItemId = number | string;

// TODO improve this. Cf. App.spec.tsx
if (JSONEditor && JSONEditor.defaults && JSONEditor.defaults.editors && JSONEditor.defaults.resolvers) {
  JSONEditor.defaults.languages.de = DE;
  JSONEditor.defaults.language = 'de';
  JSONEditor.defaults.editors.geometry = GeometryEditor;
  JSONEditor.defaults.editors.geometrySelection = GeometrySelection;
  JSONEditor.defaults.editors.location = Location;
  JSONEditor.defaults.editors.file = FileEditor;

  JSONEditor.defaults.resolvers.unshift((schema: any) => {
    const isGeometry = isGeometryType(schema.format);
    if (schema.type === 'string' && schema.format === 'geometrySelection') {
      return 'geometrySelection';
    }
    if (schema.type === 'string' && schema.format === 'location') {
      return 'location';
    }
    if (schema.type === 'string' && isGeometry) {
      return 'geometry';
    }
  });
  JSONEditor.defaults.resolvers.unshift((schema: any) => {
    return schema.type === 'string' && schema.media && schema.media.binaryEncoding === 'base64' && 'file';
  });
}

const App: React.FC = () => {
  const view = new URLSearchParams(window.location.search).get('view');
  const formId = new URLSearchParams(window.location.search).get('formId');
  const itemId: ItemId | undefined = new URLSearchParams(window.location.search).get('itemId') ?? undefined;
  const previousView = new URLSearchParams(window.location.search).get('prev');
  const order = getOrderFromUrl(window.location.href);
  const orderBy = new URLSearchParams(window.location.search).get('orderBy');
  const page = getPageFromUrl(window.location.href);
  const {
    filterKey,
    filterOp,
    filterValue
  } = getFilterFromUrl(window.location.href);
  const message = new URLSearchParams(window.location.search).get('msg');

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unauthorizedWithToken, setUnauthorizedWithToken] = useState(false);
  const [toastVisible, setToastVisible] = useState(message ? true : false);
  const [toastMessageType, setToastMessageType] = useState<TOAST_MESSAGE>(message as TOAST_MESSAGE);

  const handleUnauthorized = (keycloakConfig: KeycloakConfig, kc?: Keycloak) => {
    if (kc?.token) {
      setUnauthorizedWithToken(true);
      return;
    }
    redirectToLogin(keycloakConfig);
  };

  const redirectToLogin = async (keycloakConfig: KeycloakConfig) => {
    const newKc = new Keycloak(keycloakConfig);
    try {
      // Will always redirect to login
      // since user is not authenticated.
      // Will force a reload afterwards so
      // we do not have to put this into state.
      await newKc.init({
        onLoad: 'login-required'
      });
    } catch (err) {
      console.log('Failed to initialize keycloak', err);
    }
  };

  const fetchData = async (kc?: Keycloak) => {
    if (formId === null) {
      console.log('Cannot fetch data. No formId provided');
      return;
    }

    try {
      let response;

      if (view === 'table') {
        response = await api.getForm(formId, page, filterKey, filterOp, filterValue, order, orderBy, kc);
      } else if (view === 'item' && itemId !== undefined) {
        response = await api.getFormItem(formId, itemId, kc);
      } else {
        response = await api.getEmptyForm(formId, kc);
      }
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
    } catch (e) {
      console.log(e);
    }
  };

  const fetchKeycloakConfig = async () => {
    try {
      const response = await api.fetchKeycloakConfig();
      if (response.status !== 200) {
        throw new Error('Failed to fetch keycloak config');
      }
      const config = await response.json();
      return config;
    } catch (e) {
      console.debug(e);
    }
  };

  const initializeKeycloak = async (kcConfig: KeycloakConfig) => {
    const keycloak = getKeycloakInst();
    if (keycloak) {
      return;
    }

    const kc = new Keycloak(kcConfig);

    try {
      await kc.init({
        onLoad: 'check-sso'
      });
    } catch (err) {
      console.log('Failed to initialize keycloak', err);
    }
    return kc;
  };

  useEffect(() => {
    if (!formId) {
      setIsLoading(false);
      return;
    }
    const initialize = async () => {
      const start = Date.now();
      const keycloakConfig = await fetchKeycloakConfig();
      const kc = await initializeKeycloak(keycloakConfig);
      const fetchedData = await fetchData(kc);
      if (fetchedData && fetchedData.error === 401) {
        handleUnauthorized(keycloakConfig, kc);
      }
      if (kc) {
        setKeycloakInst(kc);
      }
      setData(fetchedData);
      // ensure loading animation for at least 300ms
      const requestDuration = Date.now() - start;
      if (requestDuration > 300) {
        setIsLoading(false);
      } else {
        setTimeout(() => {
          setIsLoading(false);
        }, 300 - requestDuration);
      }
    };

    initialize();
  }, []);

  const isValidUrl = (view === 'table' && formId && !itemId) || (view === 'item' && formId);

  const shouldShowError = () => {
    if (!isLoading && !isValidUrl) {
      return true;
    }
    if (unauthorizedWithToken) {
      return true;
    }

    return false;
  };
  const showTableView = data && formId && view === 'table';
  const showItemView = view === 'item' && data && formId;

  if (shouldShowError()) {
    return <ErrorPage />;
  }

  if (isLoading) {
    return <LoadingPage />;
  }

  const onShowToast = (newMessage: TOAST_MESSAGE) => {
    setToastVisible(true);
    setToastMessageType(newMessage);
  };

  const onHideToast = () => {
    setToastVisible(false);
  };

  return (
    <div>
      <ToastAlert
        messageType={toastMessageType}
        show={toastVisible}
        onClose={onHideToast}
      />
      {
        showTableView && (
          <TableView
            data={data}
            filter={
              {
                filterKey,
                filterOp,
                filterValue
              }
            }
            formId={formId}
            keycloak={getKeycloakInst()}
            order={order}
            orderBy={orderBy}
            page={page}
            showToast={onShowToast}
          />
        )
      }
      {
        showItemView && (
          <ItemView
            data={data}
            formId={formId}
            itemId={itemId}
            previousView={previousView}
            keycloak={getKeycloakInst()}
            internalMap={true}
            showToast={onShowToast}
          />
        )
      }
    </div>
  );
};

export default App;
