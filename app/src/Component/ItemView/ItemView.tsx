/* eslint-disable camelcase */
import React, { useEffect, useRef, useState } from 'react';

import { ISimpleFilterModel } from '@ag-grid-community/core';
import { JSONEditor } from '@json-editor/json-editor';

import Keycloak from 'keycloak-js';
import _isEmpty from 'lodash/isEmpty';

import { useTranslation } from 'react-i18next';

import Logger from '@terrestris/base-util/dist/Logger';

import { FormConfiguration, ItemId } from '../../App';
import { RECEIVE_EVENTS, SEND_EVENTS } from '../../constants/events';
import { TOAST_MESSAGE } from '../../constants/toastMessage';
import api from '../../util/api';
import { receiveMessage, sendMessage } from '../../util/postMessage';
import { getFeaturesFromTableData, getGeometryColumns } from '../../util/table';
import {
  createItemViewUrl,
  createTableViewUrl,
  getPageFromUrl,
  ItemViewQueryParams,
  TableViewQueryParams
} from '../../util/url';
import ConfirmDelete from '../ConfirmDelete/ConfirmDelete';

import { errorCodeToMessage } from '../ErrorPage/errors.ts';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './ItemView.css';

interface ItemViewProps {
  data: FormConfiguration;
  formId: string;
  itemId?: ItemId;
  previousView: string | null;
  keycloak?: Keycloak;
  internalMap?: boolean;
  showToast?: (message: TOAST_MESSAGE, additionalMessage?: string) => void;
}

const staticEditorConfig = {
  ajax: false,
  disable_collapse: true,
  disable_edit_json: true,
  disable_properties: true,
  disable_array_reorder: true,
  prompt_before_delete: false,
  theme: 'bootstrap5'
};

const ItemView: React.FC<ItemViewProps> = ({
  data,
  formId,
  itemId,
  previousView,
  keycloak,
  internalMap,
  showToast = () => undefined
}) => {

  const { t } = useTranslation();

  const [editor, setEditor] = useState<any>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const [editorData, setEditorData] = useState<any>(data?.data?.data?.[0]);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteItem = async (fId: string, iId: ItemId) => {
    try {
      const response = await api.deleteItem(fId, iId, keycloak);
      if (!response.ok) {
        const responseData = await response.json();
        setShowDeleteDialog(false);
        let additionalMessage = responseData.message;
        if (!_isEmpty(responseData?.extra)) {
          additionalMessage = errorCodeToMessage(responseData?.extra, t, formId);
        }
        showToast(TOAST_MESSAGE.deleteError, additionalMessage);
        return;
      }
      if (previousView) {
        const previousViewUrl = new URL(previousView);
        const queryParams: TableViewQueryParams = {
          formId: formId,
          message: TOAST_MESSAGE.deleteSuccess,
          page: getPageFromUrl(previousView) + 1,
          order: previousViewUrl.searchParams.get('order') ?? undefined,
          orderBy: previousViewUrl.searchParams.get('orderBy') ?? undefined,
          filterValue: previousViewUrl.searchParams.get('filterValue') ?? undefined,
          filterOp: (previousViewUrl.searchParams.get('filterOp') as ISimpleFilterModel['type']) ?? undefined,
          filterKey: previousViewUrl.searchParams.get('filterKey') ?? undefined
        };
        const nextUrl = createTableViewUrl(previousView, queryParams);
        window.location.assign(nextUrl);
      }
      // TODO handle if no previousView is provided (maybe remove button from itemView?)
    } catch (e) {
      Logger.error('Failed to delete item', e);
    }
  };

  const editable = data?.config?.editable;

  useEffect(() => {
    if (!data) {
      return;
    }
    if (editor) {
      if (editorData) {
        editor?.setValue(editorData);
      }
      return;
    }
    const editorEl = editorRef.current;
    const editorInst = new JSONEditor(editorEl, {
      ...staticEditorConfig,
      disable_array_add: !editable,
      disable_array_delete: !editable,
      form_name_root: formId,
      schema: data.config,
      // TODO check embedded mode
      internalMap: internalMap
    });
    editorInst.on('ready', () => {
      if (editorData) {
        editorInst.setValue(editorData);
      }
      if (!editable) {
        editorInst.disable();
      }
    });
    setEditor(editorInst);
  }, [data, editable, editor, editorRef, editorData, formId, internalMap]);

  const onUpdateItem = async (e: any) => {
    e.preventDefault();

    if (itemId === undefined) {
      return;
    }

    sendMessage(window.parent, SEND_EVENTS.stopDrawing);
    const value = editor.getValue();
    try {
      const response = await api.updateItem(formId, itemId, value, keycloak);
      const responseData = await response.json();
      if (!response.ok) {
        let additionalMessage = responseData.message;
        if (!_isEmpty(responseData?.extra)) {
          additionalMessage = errorCodeToMessage(responseData?.extra, t, formId);
        }
        showToast(TOAST_MESSAGE.updateError, additionalMessage);
        return;
      }
      const queryParams: ItemViewQueryParams = {
        formId,
        itemId,
        message: TOAST_MESSAGE.updateSuccess,
        prev: previousView ?? undefined
      };
      const nextUrl = createItemViewUrl(window.location.href, queryParams);
      window.location.assign(nextUrl);
    } catch (err) {
      Logger.error('failed to update item', err);
    }
  };

  const onCreateItem = async (e: any) => {
    e.preventDefault();

    sendMessage(window.parent, SEND_EVENTS.stopDrawing);
    const value = editor.getValue();
    try {
      const response = await api.createItem(formId, value, keycloak);
      const responseData = await response.json();
      if (!response.ok) {
        let additionalMessage = responseData.message;
        if (!_isEmpty(responseData?.extra)) {
          additionalMessage = errorCodeToMessage(responseData?.extra, t, formId);
        }
        showToast(TOAST_MESSAGE.createError, additionalMessage);
        return;
      }
      if (!responseData.success) {
        showToast(TOAST_MESSAGE.createError);
        return;
      }
      const queryParams: ItemViewQueryParams = {
        formId,
        itemId: responseData.id,
        message: TOAST_MESSAGE.createSuccess,
        prev: previousView ?? undefined
      };
      const itemViewUrl = createItemViewUrl(window.location.href, queryParams);
      window.location.assign(itemViewUrl);
    } catch (err) {
      showToast(TOAST_MESSAGE.createError);
      Logger.error('failed to update item', err);
    }
  };

  const onGoBack = async () => {
    // Small helper to ensure there is enough time between
    // the two postMessage calls as we have no (simple) way to know
    // which one is processed first.
    const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    sendMessage(window.parent, SEND_EVENTS.stopDrawing);
    await sleep(100);
    sendMessage(window.parent, SEND_EVENTS.clearFormData);
    if (previousView) {
      window.location.href = decodeURI(previousView);
    }
  };

  const onCancelDelete = () => {
    setShowDeleteDialog(false);
  };

  const onDelete = async () => {
    if (!itemId) {
      return;
    }
    await deleteItem(formId, itemId);
  };

  useEffect(() => {
    const displayFeatures = () => {
      // Find columns having type geometry
      const geometryColumns = getGeometryColumns(data.config);
      if (!geometryColumns || !geometryColumns.length) {
        return;
      }

      const featuresToMap = getFeaturesFromTableData([editorData], data.config, geometryColumns);
      sendMessage(window.parent, SEND_EVENTS.displayFormData, featuresToMap);
    };

    displayFeatures();

    const postMessageListener = (evt: MessageEvent) => {
      const message = receiveMessage(window.parent, evt);
      if (!message || !evt) {
        return;
      }

      const {
        type: evtType,
        payload
      } = evt.data;

      switch (evtType) {
        case RECEIVE_EVENTS.sendFeature:
          setEditorData(() => {
            return {
              ...editor.getValue(),
              [payload.columnId]: payload.geom.geometry
            };
          });
          break;
        case RECEIVE_EVENTS.drawingStopped:
          displayFeatures();
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', postMessageListener);

    return () => {
      window.removeEventListener('message', postMessageListener);
    };
  }, [editorData, data.config, editor]);

  return (
    <div>
      <ConfirmDelete
        itemId={itemId}
        onCancel={onCancelDelete}
        onDelete={onDelete}
        show={showDeleteDialog}
      />
      <form>
        <div className="navigation-actions">
          {
            previousView && (
              <button
                className="btn btn-light"
                type="button"
                onClick={onGoBack}
              >
                &lt; {t('ItemView.backTxt')}
              </button>
            )
          }
        </div>
        <div className="formbackend-editor" ref={editorRef}></div>
        <div className="form-actions">
          {
            itemId && editor && editable && (
              <button
                className="btn btn-primary"
                type="submit"
                aria-label={t('ItemView.saveTxt')}
                onClick={onUpdateItem}
              >
                <i className="bi bi-floppy"></i>
                <span className="d-none d-sm-inline">&ensp;{t('ItemView.saveTxt')}</span>
              </button>
            )
          }
          {
            !itemId && editor && editable && (
              <button
                className="btn btn-primary"
                type="submit"
                aria-label={t('ItemView.saveTxt')}
                onClick={onCreateItem}
              >
                <i className="bi bi-floppy"></i>
                <span className="d-none d-sm-inline">&ensp;{t('ItemView.saveTxt')}</span>
              </button>
            )
          }
          {
            itemId && editable && (
              <button
                className="btn btn-outline-danger"
                type="button"
                aria-label={t('ItemView.deleteEntryMsg')}
                onClick={() => {
                  setShowDeleteDialog(true);
                }}
              >
                <i className="bi bi-trash3"></i>
                <span className="d-none d-sm-inline">&ensp;{t('ItemView.deleteEntryMsg')}</span>
              </button>
            )
          }
        </div>
      </form>
    </div>
  );
};

export default ItemView;
