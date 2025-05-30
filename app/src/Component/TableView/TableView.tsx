import React, { useEffect, useMemo, useState } from 'react';

import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import {
  ColDef,
  GridReadyEvent,
  ModuleRegistry,
  PaginationChangedEvent,
  SortChangedEvent,
  FilterChangedEvent,
  CellClickedEvent,
  ICellRendererParams,
  CellMouseOverEvent,
  ISimpleFilterModel
} from '@ag-grid-community/core';
import { AG_GRID_LOCALE_DE } from '@ag-grid-community/locale';
import { AgGridReact, CustomCellEditorProps } from '@ag-grid-community/react';
import Keycloak from 'keycloak-js';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';

import { FormConfiguration, ItemId } from '../../App';
import { RECEIVE_EVENTS, SEND_EVENTS } from '../../constants/events';
import { TOAST_MESSAGE } from '../../constants/toastMessage';

import api from '../../util/api';
import { isGeometryType } from '../../util/jsonEditor';
import { receiveMessage, sendMessage } from '../../util/postMessage';
import { getFeaturesFromTableData, getGeometryColumns, isFilterableProp, isSortableProp } from '../../util/table';
import { createItemViewUrl, createTableViewUrl, ItemViewQueryParams, TableViewQueryParams } from '../../util/url';
import ConfirmDelete from '../ConfirmDelete/ConfirmDelete';

import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-quartz.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './TableView.css';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

export type FilterType = {
  filterOp: 'equals' | 'notEqual' | 'like' | 'greaterThan' | 'lessThan';
  filterKey: string;
  filterValue: string;
};

interface TableViewProps {
  data: FormConfiguration;
  filter?: FilterType;
  formId: string;
  page: number;
  keycloak?: Keycloak;
  order?: 'asc' | 'desc' | null;
  orderBy?: string | null;
  showToast?: (message: TOAST_MESSAGE) => void;
}

const TableView: React.FC<TableViewProps> = ({
  data,
  filter,
  formId,
  keycloak,
  order,
  orderBy,
  page,
  showToast = () => { }
}) => {
  /**
   *
   * @param colNames string[] The column names to filter.
   * @returns string[] The filtered column names with subitems.
   */
  const filterColsWithSubitems = (colNames: string[]) => {
    return colNames.filter((name) => {
      return data.config?.properties[name]?.items || data.config?.properties[name]?.properties;
    });
  };
  const columnNames = Object.keys(data.config.properties);
  const colsWithSubitems = filterColsWithSubitems(columnNames);

  const allowItemView = data.config.views?.item;
  const editable = data.config.editable;

  const containsGeometryColumns = () => !!getGeometryColumns(data.config)?.length;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [idToDelete, setIdToDelete] = useState<ItemId>();

  const deleteItem = async (fId: string, itemId: ItemId) => {
    try {
      const response = await api.deleteItem(fId, itemId, keycloak);
      if (!response.ok) {
        setShowDeleteDialog(false);
        showToast(TOAST_MESSAGE.deleteError);
        return;
      }
      const queryParams: TableViewQueryParams = {
        formId: formId,
        message: TOAST_MESSAGE.deleteSuccess,
        page: page + 1,
        order: order ?? undefined,
        orderBy: order ?? undefined,
        filterValue: filter?.filterValue,
        filterOp: filter?.filterOp as ISimpleFilterModel['type'],
        filterKey: filter?.filterKey
      };
      const nextUrl = createTableViewUrl(window.location.href, queryParams);
      window.location.assign(nextUrl);
    } catch (e) {
      console.debug(e);
    }
  };

  const renderCell = (colName: string, value: unknown | unknown[]) => {
    if (colsWithSubitems.includes(colName)) {
      return 'Siehe Detailansicht';
    }

    if (data.config.properties?.[colName]?.enumSource) {
      const sources = data.config.properties?.[colName]?.enumSource?.[0]?.source ?? [];
      const resolvedEnum = sources.find((source: any) => source.value === value);
      if (resolvedEnum?.title) {
        return resolvedEnum.title;
      }
    }

    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      return JSON.stringify(value);
    }

    if (typeof value !== 'string') {
      return JSON.stringify(value);
    }

    return value;
  };

  const renderGeometryCell = (value: unknown) => {
    if (!value) {
      return;
    }

    return (
      <div>
        <i className="bi bi-bounding-box-circles"></i>
      </div>
    );
  };

  const renderGeometryTooltip = () => {
    return 'Geometrie';
  };

  const renderRowNumberCell = (rowProps: CustomCellEditorProps) => {
    if (!rowProps.data) {
      return;
    }

    const tableViewQueryParams: TableViewQueryParams = {
      formId: formId,
      page: page + 1,
      order: order ?? undefined,
      orderBy: order ?? undefined,
      filterValue: filter?.filterValue,
      filterOp: filter?.filterOp as ISimpleFilterModel['type'],
      filterKey: filter?.filterKey
    };
    const prevUrl = createTableViewUrl(window.location.href, tableViewQueryParams);
    const itemViewQueryParams: ItemViewQueryParams = {
      formId: formId,
      itemId: rowProps.data[data.config.idColumn] as ItemId,
      prev: prevUrl
    };
    const itemViewUrl = createItemViewUrl(window.location.href, itemViewQueryParams);
    return (
      <div className="formbackend-row-number-cell">
        <OverlayTrigger placement="top" overlay={viewTooltip}>
          {
            allowItemView ?
              <a
                className="btn btn-link actions"
                href={itemViewUrl}
              >
                {(rowProps.node.rowIndex ?? 0) + 1}
              </a>
              : <span>{(rowProps.node.rowIndex ?? 0) + 1}</span>
          }
        </OverlayTrigger>
        {
          allowItemView && !editable && (
            <OverlayTrigger placement="top" overlay={viewTooltip}>
              <Button
                className="actions"
                variant='link'
                onClick={() => {
                  disableItemSelection();
                  window.location.assign(itemViewUrl);
                }}
              >
                <i className="bi bi-eye"></i>
              </Button>
            </OverlayTrigger>
          )
        }
        {
          containsGeometryColumns() && (
            <OverlayTrigger placement="top" overlay={zoomToTooltip}>
              <button
                className="btn btn-link actions"
                type="button"
                onClick={() => zoomToFeature(rowProps)}
                aria-label="Auf Geometrie zoomen"
              >
                <i className="bi bi-search"></i><span className="d-none d-sm-inline">&ensp;</span>
              </button>
            </OverlayTrigger>
          )
        }
        {
          allowItemView && editable && (
            <OverlayTrigger placement="top" overlay={editTooltip}>
              <Button
                className="actions"
                variant='link'
                onClick={() => {
                  disableItemSelection();
                  window.location.assign(itemViewUrl);
                }}
              >
                <i className="bi bi-pencil"></i><span className="d-none d-sm-inline">&ensp;</span>
              </Button>
            </OverlayTrigger>
          )
        }
        {
          editable && (
            <OverlayTrigger placement="top" overlay={deleteTooltip}>
              <button
                className="btn btn-link actions"
                type="button"
                onClick={() => {
                  setShowDeleteDialog(true);
                  setIdToDelete(rowProps.data[data.config.idColumn] as ItemId);
                }}
                aria-label="Eintrag löschen"
              >
                <i className="bi bi-trash3"></i><span className="d-none d-sm-inline">&ensp;</span>
              </button>
            </OverlayTrigger>
          )
        }
      </div>
    );
  };

  const renderColumnTitle = (colName: any) => {
    return data.config.properties[colName].title ?? colName;
  };

  const applyFilter = (setFilterModel: any, filterToApply: any) => {
    const filterModel = {
      [filterToApply.filterKey]: {
        type: filterToApply.filterOp,
        filter: filterToApply.filterValue,
        filterType: 'text'
      }
    };
    setFilterModel(filterModel);
  };

  const filterParams: any = {
    textFilterParams: {
      filterOptions: ['contains', 'equals', 'notEqual'],
      trimInput: true,
      buttons: ['reset', 'apply'],
      maxNumConditions: 1
    },
    numberFilterParams: {
      filterOptions: ['equals', 'notEqual', 'greaterThan', 'lessThan'],
      trimInput: true,
      buttons: ['reset', 'apply'],
      maxNumConditions: 1
    }
  };

  const isGeometryColumn = (format?: string) => {
    return (format && isGeometryType(format)) || format === 'geometrySelection' || format === 'location';
  };

  const columnDefs = useMemo(() => {
    return columnNames
      .map(colName => {
        const colDef: ColDef = {
          field: colName,
          headerValueGetter: () => renderColumnTitle(colName)
        };

        if (isGeometryColumn(data.config.properties?.[colName]?.format)) {
          colDef.cellRenderer = (params: ICellRendererParams) => renderGeometryCell(params.value);
          colDef.tooltipValueGetter = renderGeometryTooltip;
        } else {
          colDef.valueFormatter = params => renderCell(colName, params.value);
          colDef.tooltipValueGetter = params => renderCell(colName, params.value);
        }


        if (data.config.orderBy === colName) {
          colDef.sort = data.config.order;
        }
        // orderBy property takes higher precedence than config.orderBy
        if (orderBy === colName) {
          colDef.sort = order;
        }

        if (colDef.field) {
          const { type: dataType } = data.config.properties[colDef.field];
          // exclude geometries, file uploads, enums and join tables from sorting
          if (isFilterableProp(data.config.properties[colDef.field])) {
            if (dataType === 'string') {
              colDef.filter = 'agTextColumnFilter';
              colDef.filterParams = filterParams.textFilterParams;
            } else if (dataType === 'integer' || dataType === 'number') {
              colDef.filter = 'agNumberColumnFilter';
              colDef.filterParams = filterParams.numberFilterParams;
            }
          }
          // exclude geometries, file uploads and join tables from sorting
          if (!isSortableProp(data.config.properties[colDef.field])) {
            colDef.sortable = false;
          }
        }

        return colDef;
      })
      .concat(
        [
          {
            lockPosition: 'left',
            suppressMovable: true,
            sortable: false,
            cellRenderer: renderRowNumberCell,
          }
        ]
      );
  }, [columnNames, data]);

  const defaultColumnDefs = useMemo(() => {
    return {
      comparator: () => 0
    };
  }, []);

  const viewTooltip = (
    <Tooltip id="tooltip">
      Anzeigen
    </Tooltip>
  );

  const zoomToTooltip = (
    <Tooltip id="zoom-to-tooltip">
      Auf Geometrie zoomen
    </Tooltip>
  );

  const editTooltip = (
    <Tooltip id="tooltip">
      Bearbeiten
    </Tooltip>
  );

  const deleteTooltip = (
    <Tooltip id="tooltip">
      Eintrag löschen
    </Tooltip>
  );

  const onCancelDelete = () => {
    setShowDeleteDialog(false);
    setIdToDelete(undefined);
  };

  const onDelete = () => {
    if (!idToDelete) {
      return;
    }
    deleteItem(formId, idToDelete);
  };

  const onSortChanged = (event: SortChangedEvent) => {
    const col = event.columns?.[event.columns.length - 1];
    const colId = col?.getId();
    const newSort = col?.getSort();
    const queryParams: TableViewQueryParams = {
      formId: formId,
      page: page + 1,
      order: newSort ?? undefined,
      orderBy: colId ?? undefined,
      filterValue: filter?.filterValue,
      filterOp: filter?.filterOp as ISimpleFilterModel['type'],
      filterKey: filter?.filterKey
    };
    const newUrl = createTableViewUrl(window.location.href, queryParams);
    window.location.assign(newUrl);
  };

  const onPaginationChanged = (event: PaginationChangedEvent) => {
    if (!event.newPage) {
      return;
    }
    // URL query param `page` will be 1-indexed, but ag-grid is 0-indexed
    const nextPage = event.api.paginationGetCurrentPage() + 1;
    const queryParams: TableViewQueryParams = {
      formId: formId,
      page: nextPage,
      order: order ?? undefined,
      orderBy: orderBy ?? undefined,
      filterValue: filter?.filterValue,
      filterOp: filter?.filterOp as ISimpleFilterModel['type'],
      filterKey: filter?.filterKey
    };
    const newUrl = createTableViewUrl(window.location.href, queryParams);
    window.location.assign(newUrl);
  };

  // We have to fill the data with empty objects to
  // make the table display the right pagination.
  const paddData = () => {
    const leftPaddedData = Array(page * data.config.views.pageSize).fill(undefined);
    const rightPaddedData = Array(data.data.count - leftPaddedData.length - data.data.data.length).fill(undefined);
    const paddedData = [...leftPaddedData, ...data.data.data, ...rightPaddedData];
    return paddedData;
  };

  const onGridReady = (event: GridReadyEvent) => {
    if (filter && filter.filterKey && filter.filterOp && filter.filterValue) {
      applyFilter(event.api.setFilterModel, filter);
    }
    // Set onFilterChanged callback after filter has initially been set.
    event.api.addEventListener('filterChanged', onFilterChanged);
    event.api.paginationGoToPage(page);
    event.api.addEventListener('paginationChanged', onPaginationChanged);
  };

  const onFilterChanged = ({ api: gridApi }: FilterChangedEvent) => {
    const filterModel = gridApi.getFilterModel();

    // We only allow one filter per table
    if (filter && Object.keys(filterModel).includes(filter?.filterKey)) {
      // delete filter that is currently active
      delete filterModel[filter.filterKey];
    }

    const queryParams = {
      formId,
      page,
      order: order ?? undefined,
      orderBy: orderBy ?? undefined,
      ...(Object.keys(filterModel).length > 0 && {
        filterKey: Object.keys(filterModel)[0],
        filterOp: Object.values(filterModel)[0].type,
        filterValue: Object.values(filterModel)[0].filter
      })
    };

    const newUrl = createTableViewUrl(window.location.href, queryParams);
    window.location.assign(newUrl);
  };

  const enableItemSelection = () => {
    if (!data.config.views.item) {
      return;
    }
    sendMessage(window.parent, SEND_EVENTS.enableItemSelection);
  };

  const disableItemSelection = () => {
    sendMessage(window.parent, SEND_EVENTS.disableItemSelection);
  };

  useEffect(() => {
    if (!containsGeometryColumns()) {
      return;
    }
    const showFeaturesInMap = () => {
      // Find columns of geometry type
      const geometryColumns = getGeometryColumns(data.config);

      if (!geometryColumns || !geometryColumns.length) {
        return;
      }

      const featuresToMap = getFeaturesFromTableData(data.data.data, data.config, geometryColumns);

      sendMessage(window.parent, SEND_EVENTS.displayFormData, featuresToMap);
    };

    showFeaturesInMap();
    enableItemSelection();

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
        case RECEIVE_EVENTS.editRecord:
          if (payload.itemId) {
            onEditRecord(payload.itemId);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', postMessageListener);

    return () => {
      window.removeEventListener('message', postMessageListener);
    };

  }, [data]);

  const onEditRecord = (itemId: ItemId) => {
    if (!data.config.views.item) {
      return;
    }
    const tableViewQueryParams: TableViewQueryParams = {
      formId: formId,
      page: page + 1,
      order: order ?? undefined,
      orderBy: order ?? undefined,
      filterValue: filter?.filterValue,
      filterOp: filter?.filterOp as ISimpleFilterModel['type'],
      filterKey: filter?.filterKey
    };
    const prevUrl = createTableViewUrl(window.location.href, tableViewQueryParams);
    const itemViewQueryParams: ItemViewQueryParams = {
      formId: formId,
      itemId,
      prev: prevUrl
    };
    const itemViewUrl = createItemViewUrl(window.location.href, itemViewQueryParams);

    window.location.assign(itemViewUrl);
  };

  const onCellClicked = (event: CellClickedEvent) => {
    if (!event.colDef.field) {
      // do not trigger highlighting when the options column has been clicked
      return;
    }
    const geometryColumns = getGeometryColumns(data.config);
    if (!geometryColumns || !geometryColumns.length) {
      return;
    }
    const features = getFeaturesFromTableData([event.data], data.config, geometryColumns);

    sendMessage(window.parent, SEND_EVENTS.startHighlighting, features);
  };

  const zoomToFeature = (rowProps: any) => {
    const geometryColumns = getGeometryColumns(data.config);
    if (!geometryColumns || !geometryColumns.length) {
      return;
    }
    const features = getFeaturesFromTableData([rowProps.data], data.config, geometryColumns);

    sendMessage(window.parent, SEND_EVENTS.zoomToFeature, features);
  };

  const onCellMouseOver = (event: CellMouseOverEvent) => {
    const geometryColumns = getGeometryColumns(data.config);
    if (!geometryColumns || !geometryColumns.length) {
      return;
    }
    const features = getFeaturesFromTableData([event.data], data.config, geometryColumns);

    sendMessage(window.parent, SEND_EVENTS.startHighlighting, features);
  };

  const onCellMouseOut = () => {
    sendMessage(window.parent, SEND_EVENTS.stopHighlighting);
  };

  const onCreateBtnClick = () => {
    const tableViewQueryParams: TableViewQueryParams = {
      formId,
      page: page + 1,
      order: order ?? undefined,
      orderBy: orderBy ?? undefined,
      filterValue: filter?.filterValue,
      filterOp: filter?.filterOp as ISimpleFilterModel['type'],
      filterKey: filter?.filterKey
    };
    const prevUrl = createTableViewUrl(window.location.href, tableViewQueryParams);
    const itemViewQueryParams: ItemViewQueryParams = {
      formId,
      prev: prevUrl
    };
    const itemViewUrl = createItemViewUrl(window.location.href, itemViewQueryParams);

    disableItemSelection();
    window.location.assign(itemViewUrl);
  };

  return (
    <div>
      <h3>{data.config.title ?? formId}</h3>
      {
        data.config.description && (
          <span>{data.config.description}</span>
        )
      }
      {
        idToDelete &&
        <ConfirmDelete
          show={showDeleteDialog}
          itemId={idToDelete}
          onCancel={onCancelDelete}
          onDelete={onDelete}
        />
      }
      <div className="content-box">
        <Button
          className='create-button'
          variant='primary'
          onClick={onCreateBtnClick}
          aria-label="Eintrag erstellen"
        >
          <i className="bi bi-plus-lg"></i><span className="d-none d-sm-inline">&ensp;Eintrag erstellen</span>
        </Button>
        <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
          <AgGridReact
            rowData={paddData()}
            columnDefs={columnDefs}
            defaultColDef={defaultColumnDefs}
            onSortChanged={onSortChanged}
            suppressMultiSort
            pagination
            paginationPageSize={data.config.views.pageSize}
            paginationPageSizeSelector={false}
            onGridReady={onGridReady}
            onCellClicked={onCellClicked}
            onCellMouseOver={onCellMouseOver}
            onCellMouseOut={onCellMouseOut}
            localeText={AG_GRID_LOCALE_DE}
            // Automatically set the height of the table depending on the data.
            // Might become slow with a lot of data (1000+ rows).
            domLayout='autoHeight'
          />
        </div>
      </div>
    </div>
  );
};

export default TableView;
