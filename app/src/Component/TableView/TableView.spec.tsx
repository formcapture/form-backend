import {
  cleanup,
  fireEvent,
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

import Logger from '@terrestris/base-util/dist/Logger';

import { FormConfiguration } from '../../App';
import { RECEIVE_EVENTS, SEND_EVENTS } from '../../constants/events';
import { TOAST_MESSAGE } from '../../constants/toastMessage';
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
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
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

  describe('actions', () => {
    const originalLocation = window.location;
    let assignMock: Mock;

    beforeEach(() => {
      assignMock = vi.fn();
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { href: 'http://localhost:3000/?view=table&formId=123', assign: assignMock }
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    });

    const confirmDeleteOfFirstItem = async (deleteResponse: () => Promise<Response>) => {
      const deleteButtons = await screen.findAllByLabelText('TableView.deleteTooltip');
      (authenticatedFetch as Mock).mockImplementation(deleteResponse);
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(await screen.findByText('Löschen'));
    };

    it('deletes an item and reloads the table view', async () => {
      const postMessageSpy = vi.spyOn(window, 'postMessage').mockImplementation(() => undefined);
      const data = {...mockData, config: {...mockData.config, refreshLayersIds: ['l1']}};
      render(<TableView data={data} formId={mockFormId} />);
      await confirmDeleteOfFirstItem(() => Promise.resolve(new Response(null, {status: 200})));

      await waitFor(() => expect(assignMock).toHaveBeenCalled());
      expect((authenticatedFetch as Mock).mock.calls)
        .toContainEqual(['../form/123/item/1', {method: 'DELETE'}, undefined]);
      expect(assignMock.mock.calls[0][0]).toContain(`msg=${TOAST_MESSAGE.deleteSuccess}`);
      expect(postMessageSpy).toHaveBeenCalledWith({type: SEND_EVENTS.refreshLayer, payload: 'l1'}, window.origin);
    });

    it('shows an error toast if deleting fails', async () => {
      const showToast = vi.fn();
      render(<TableView data={mockData} formId={mockFormId} showToast={showToast} />);
      await confirmDeleteOfFirstItem(() => Promise.resolve(new Response(null, {status: 500})));

      await waitFor(() => expect(showToast).toHaveBeenCalledWith(TOAST_MESSAGE.deleteError));
      expect(assignMock).not.toHaveBeenCalled();
    });

    it('logs an error if the delete request throws', async () => {
      const loggerSpy = vi.spyOn(Logger, 'error').mockImplementation(() => undefined);
      render(<TableView data={mockData} formId={mockFormId} />);
      await confirmDeleteOfFirstItem(() => Promise.reject(new Error('network')));

      await waitFor(() => expect(loggerSpy).toHaveBeenCalledWith('Failed to delete item', expect.any(Error)));
    });

    it('closes the delete dialog on cancel', async () => {
      render(<TableView data={mockData} formId={mockFormId} />);
      const deleteButtons = await screen.findAllByLabelText('TableView.deleteTooltip');
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(await screen.findByText('Abbrechen'));
      await waitFor(() => expect(screen.queryByText('Löschen')).toBeNull());
    });

    it('sends zoomToFeature for a row', async () => {
      const postMessageSpy = vi.spyOn(window, 'postMessage').mockImplementation(() => undefined);
      render(<TableView data={mockData} formId={mockFormId} />);
      const zoomButtons = await screen.findAllByLabelText('TableView.zoomToGeometryTooltip');
      fireEvent.click(zoomButtons[0]);
      expect(postMessageSpy.mock.calls.some(([msg]: any[]) => msg.type === SEND_EVENTS.zoomToFeature)).toBe(true);
    });

    it('opens the item view for an editRecord message', async () => {
      render(<TableView data={mockData} formId={mockFormId} />);
      window.dispatchEvent(new MessageEvent('message', {
        data: {type: RECEIVE_EVENTS.editRecord, payload: {itemId: 2}},
        origin: window.origin
      }));
      expect(assignMock).toHaveBeenCalledTimes(1);
      expect(assignMock.mock.calls[0][0]).toContain('view=item');
      expect(assignMock.mock.calls[0][0]).toContain('itemId=2');
    });

    it('opens an empty item view on create click', async () => {
      render(<TableView data={mockData} formId={mockFormId} />);
      fireEvent.click(screen.getByLabelText('TableView.createEntryText'));
      expect(assignMock.mock.calls[0][0]).toContain('view=item');
      expect(assignMock.mock.calls[0][0]).not.toContain('itemId');
    });
  });

  it('calls the keycloak login if fetching the rows is unauthorized', async () => {
    const keycloak = {login: vi.fn(), token: 'abc'} as any;
    (authenticatedFetch as Mock).mockResolvedValue(new Response(null, {status: 401}));
    render(<TableView data={mockData} formId={mockFormId} keycloak={keycloak} />);
    await waitFor(() => expect(keycloak.login).toHaveBeenCalled());
  });

  it('logs a warning if fetching the rows fails', async () => {
    const loggerSpy = vi.spyOn(Logger, 'warn').mockImplementation(() => undefined);
    (authenticatedFetch as Mock).mockResolvedValue(new Response(null, {status: 500}));
    render(<TableView data={mockData} formId={mockFormId} />);
    await waitFor(() => {
      expect(loggerSpy).toHaveBeenCalledWith('Error while fetching rows for table', expect.any(Error));
    });
  });
});
