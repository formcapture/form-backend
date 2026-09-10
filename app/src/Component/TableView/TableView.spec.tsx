import {
  render,
  screen,
  waitFor
} from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  Mock,
  vi
} from 'vitest';

import { FormConfiguration } from '../../App';
import { authenticatedFetch } from '../../util/authenticatedFetch';

import TableView from './TableView';

vi.mock('../../util/authenticatedFetch', () => ({
  authenticatedFetch: vi.fn()
}));

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
        item: true
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

  beforeEach(() => {
    (authenticatedFetch as Mock).mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify(mockData), {status: 200})
    ));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('is defined', () => {
    expect(TableView).not.toBeNull();
  });

  it('renders the table with correct headers and data', async () => {
    render(
      <TableView
        data={mockData}
        formId={mockFormId}
      />
    );

    await waitFor(() => {
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

  });

  it('creates correct edit URL', () => {
    render(
      <TableView
        data={mockData}
        formId={mockFormId}
      />
    );
  });

  it('renders the zoomToFeatures button correctly', async () => {
    render(
      <TableView
        data={mockData}
        formId={mockFormId}
      />
    );
    await waitFor(() => {
      // use i18n key to check if the button is rendered
      expect(screen.getAllByLabelText('TableView.zoomToGeometryTooltip')).toBeDefined();
    });
  });
});
