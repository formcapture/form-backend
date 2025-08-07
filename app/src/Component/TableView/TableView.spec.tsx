import {
  render,
  screen
} from '@testing-library/react';
import {
  describe,
  expect,
  it
} from 'vitest';

import { FormConfiguration } from '../../App';

import TableView from './TableView';

describe('<TableView />', () => {
  const mockData: FormConfiguration = {
    config: {
      properties: {
        key: {},
        Name: {},
        Value: {},
        City: {
          enumSource: [{source: [{value: 'BN', title: 'Bonn'}, {value: 'K', title: 'Cologne'}]}],
        },
        geom: {
          type: 'string',
          format: 'geometry'
        }
      },
      idColumn: 'id',
      editable: true,
      views: {
        table: true,
        item: true,
        pageSize: 10
      },
      order: 'desc',
      orderBy: 'name',
    },
    data: {
      count: 2,
      data: [
        {key: 'Item 1', id: 1, Name: 'Test-Object 1', Value: 10, City: 'BN', geom: 'Point(1,2)'},
        {key: 'Item 2', id: 2, Name: 'Test-Object 2', Value: 20, City: 'K', geom: 'Point(2,1)'},
      ]
    },
  };

  const mockFormId = '123';

  it('is defined', () => {
    expect(TableView).not.toBeNull();
  });

  it('renders the table with correct headers and data', () => {
    render(
      <TableView
        data={mockData}
        formId={mockFormId}
        page={0}
      />
    );

    Object.keys(mockData.config.properties).forEach(col => {
      expect(screen.getByText(col)).toBeDefined();
    });

    mockData.data.data.forEach(record => {
      Object.keys(mockData.config.properties)
        // we only render an icon for geometries, so we filter them out in this test
        .filter(col => mockData.config.properties[col].format !== 'geometry')
        .forEach(col => {
          const cellValue = record[col] as string;
          const expectedValue = col === 'City' ? (cellValue === 'BN' ? 'Bonn' : 'Cologne') : cellValue;
          expect(screen.getByText(expectedValue)).not.toBeNull();
        });

    });
  });

  it('creates correct edit URL', () => {
    render(
      <TableView
        data={mockData}
        formId={mockFormId}
        page={0}
      />
    );
  });

  it('renders the zoomToFeatures button correctly', () => {
    render(
      <TableView
        data={mockData}
        formId={mockFormId}
        page={0}
      />
    );

    expect(screen.getAllByLabelText('Auf Geometrie zoomen')).toBeDefined();
  });
});
