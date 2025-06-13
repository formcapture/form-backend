import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from '@testing-library/react';
import {
  describe,
  it,
  expect,
  beforeAll,
  vi,
  afterEach,
} from 'vitest';

import { FormConfiguration } from '../../App';

import ItemView from './ItemView';

describe('<ItemView />', () => {
  const mockData: FormConfiguration = {
    config: {
      properties: {
        name: { type: 'string' },
        value: { type: 'integer' },
      },
      editable: true,
      idColumn: '1',
      views: {
        table: true,
        item: true,
        pageSize: 10
      },
      order: 'desc',
      orderBy: 'foo'
    },
    data: {
      count: 1,
      data: [
        { name: 'Test-Object 1', value: 1 },
      ]
    },
  };

  const formId = '123';
  const itemId = '1';
  const previousView = '/previous';

  vi.mock('@json-editor/json-editor', () => ({
    JSONEditor: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      setValue: vi.fn(),
      getValue: () => ({ name: 'Test-Object 1', value: 1 }),
    })),
  }));

  beforeAll(() => {
    Object.defineProperty(global.window, 'location', {
      value: {
        href: '',
        origin: '',
        assign: vi.fn(),
        replace: vi.fn(),
        reload: vi.fn(),
        toString: vi.fn().mockReturnValue(''),
      },
      writable: true
    });

    Object.defineProperty(global.window, 'history', {
      value: {
        pushState: vi.fn(),
        replaceState: vi.fn(),
        go: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
      },
      writable: true
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('is defined', () => {
    expect(ItemView).not.toBeNull();
  });

  it('renders the editor and handles back button', async () => {
    render(
      <ItemView
        data={mockData}
        formId={formId}
        itemId={itemId}
        previousView={previousView}
      />
    );

    const backButton = screen.getByText('< Zurück');
    expect(backButton).not.toBeNull();

    fireEvent.click(backButton);
    await waitFor(() => {
      expect(window.location.href).toBe(window.location.origin + previousView);
    });
  });

  it('handles the save action', async () => {
    render(
      <ItemView
        data={mockData}
        formId={formId}
        itemId={itemId}
        previousView={previousView}
      />
    );

    function createFetchResponse(data: any) {
      return {
        success: true,
        status: 200,
        json: () => new Promise((resolve) => resolve(data)),
      };
    }

    global.fetch = vi.fn().mockResolvedValue(createFetchResponse({ success: true }));

    const saveButton = await screen.findByText('Speichern');
    expect(saveButton).not.toBeNull();
    fireEvent.click(saveButton);
    await new Promise(process.nextTick);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`../form/${formId}/item/${itemId}`, expect.objectContaining({
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'Test-Object 1', value: 1 })
      }));
    });
  });
});
