import {
  cleanup,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import Keycloak, { KeycloakConfig } from 'keycloak-js';
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  Mock
} from 'vitest';

import App, { FormConfiguration } from './App';
import { setKeycloakInst } from './singletons/keycloak';
import { authenticatedFetch } from './util/authenticatedFetch';

let mockKeycloak: any;

vi.mock('./util/authenticatedFetch', () => ({
  authenticatedFetch: vi.fn()
}));

vi.mock('keycloak-js', () => ({
  default: vi.fn(() => mockKeycloak),
}));

describe('App', () => {
  function createFetchResponse(data: any, status: number) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const mockData: FormConfiguration = {
    config: {
      properties: {
        key: {},
        name: {},
        value: {},
        city: {
          enumSource: [{ source: [{ value: 'BN', title: 'Bonn' }] }],
        },
      },
      views: {
        table: true,
        item: true,
        pageSize: 10
      },
      idColumn: 'id',
      editable: true,
      order: 'asc',
      orderBy: 'name'
    },
    data: {
      count: 1,
      data: [
        { key: 'Item 1', id: 2, name: 'Test-Object 1', value: 20, city: 'BN' },
      ]
    },
  };

  const mockKeycloakConfig: KeycloakConfig = {
    url: 'http://keycloak-server/auth',
    realm: 'myrealm',
    clientId: 'myapp',
  };

  const mockFetch = vi.fn(() => Promise.resolve(new Response(JSON.stringify(mockKeycloakConfig), { status: 200 })));

  // TODO mock also JSONEditor.defaults (editors and resolvers)
  vi.mock('@json-editor/json-editor', () => {
    return {
      JSONEditor: vi.fn().mockImplementation(() => ({
        setValue: vi.fn(),
        on: vi.fn(),
        getValue: vi.fn(() => mockData.config)
      })),
    };
  });

  beforeEach(() => {
    (global.window as any).location = {
      href: 'http://localhost?formId=abc&itemId=123',
      origin: 'http://localhost?formId=abc&itemId=123',
      search: '?formId=123&itemId=456&prev=view',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
      toString: vi.fn().mockReturnValue(''),
    } as unknown as Location;

    mockKeycloak = {
      init: vi.fn().mockResolvedValue(true),
      token: 'mock-token' as string | null,
      authenticated: true,
    };

    (Keycloak as any).mockImplementation(() => mockKeycloak);

    global.fetch = mockFetch;
    (authenticatedFetch as Mock).mockResolvedValue(createFetchResponse(mockData, 200));

    setKeycloakInst(undefined as unknown as Keycloak);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('is defined', () => {
    expect(App).not.toBeNull();
  });

  it('renders loading message initially', () => {
    render(<App />);
    expect(screen.getByText('Seite wird geladen…')).not.toBeNull();
  });

  it('renders error message when formId is missing', async () => {
    delete (global as any).window.location;
    (global as any).window.location = new URL('http://localhost?itemId=123');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Hoppla, da ist etwas schiefgelaufen!')).not.toBeNull();
    });
  });

  it('initializes Keycloack and renders TableView when formId is present but itemId is missing', async () => {
    delete (global as any).window.location;
    (global as any).window.location = new URL('http://localhost?view=table&formId=abc',);

    render(<App />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledOnce();
      expect(screen.queryByText('Seite wird geladen…')).toBeNull();
      expect(screen.queryByText('Test-Object 1')).not.toBeNull();
    }, { timeout: 400 });
  });

  it('handles Keycloak initialization errors', async () => {
    delete (global as any).window.location;
    (global as any).window.location = new URL('http://localhost?formId=abc&itemId=123');

    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => { });
    (mockKeycloak.init as Mock).mockRejectedValueOnce(new Error('Initialization failed'));

    const localMockFetch = vi.fn(
      () => Promise.resolve(new Response(JSON.stringify(mockKeycloakConfig), { status: 200 }))
    );
    global.fetch = localMockFetch;

    (authenticatedFetch as Mock).mockResolvedValue(createFetchResponse(mockData, 200));

    render(<App />);

    await waitFor(() => {
      expect(localMockFetch).toHaveBeenCalled();
      expect(Keycloak).toHaveBeenCalled();
      expect(consoleLog).toHaveBeenCalledWith('Failed to initialize keycloak', new Error('Initialization failed'));
    });
    consoleLog.mockRestore();
  });

  it('should return immediately if keycloak is already set', async () => {
    const { rerender } = render(<App />);
    await waitFor(() => {
      expect(screen.queryByText('Seite wird geladen…')).toBeNull();
    }, { timeout: 400 });

    mockKeycloak.init.mockClear();
    mockKeycloak.token = 'new-token';

    rerender(<App />);

    expect(Keycloak).toHaveBeenCalledOnce();
    expect(mockKeycloak.init).not.toHaveBeenCalled();
  });

  it('throws error when data can not be fetched', async () => {
    delete (global as any).window.location;
    (global as any).window.location = new URL('http://localhost?formId=abc&itemId=123');
    const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => {});

    (authenticatedFetch as Mock).mockResolvedValue(createFetchResponse(mockData, 500));

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText('Seite wird geladen…')).not.toBeNull();
    }, { timeout: 400 });

    expect(consoleLogMock).toHaveBeenCalled();
    expect(consoleLogMock).toHaveBeenCalledWith(
      expect.any(Error)
    );

    consoleLogMock.mockRestore();
  });

  it('throws error when keycloak config can not be fetched', async () => {
    delete (global as any).window.location;
    (global as any).window.location = new URL('http://localhost?formId=abc&itemId=123');
    const consoleDebugMock = vi.spyOn(console, 'debug').mockImplementation(() => { });

    const localMockFetch = vi.fn(
      () => Promise.resolve(new Response(JSON.stringify(mockKeycloakConfig), { status: 500 }))
    );
    global.fetch = localMockFetch;

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText('Seite wird geladen…')).not.toBeNull();
    }, { timeout: 400 });

    expect(consoleDebugMock).toHaveBeenCalled();
    expect(consoleDebugMock).toHaveBeenCalledWith(
      expect.any(Error)
    );

    consoleDebugMock.mockRestore();
  });

  it('redirects to login page without token', async () => {
    delete (global as any).window.location;
    (global as any).window.location = new URL('http://localhost?view=item&formId=abc&itemId=123');
    mockKeycloak.token = null;
    const localMockFetch = vi.fn(
      () => Promise.resolve(new Response(JSON.stringify(mockKeycloakConfig), { status: 200 }))
    );
    global.fetch = localMockFetch;
    (authenticatedFetch as Mock).mockResolvedValue(createFetchResponse(mockData, 401));

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText('Seite wird geladen…')).toBeNull();
      expect(screen.queryByText('Hoppla, da ist etwas schiefgelaufen!')).toBeNull();
    }, { timeout: 400 });
  });

  it('shows error if unauthorized with token', async () => {
    delete (global as any).window.location;
    (global as any).window.location = new URL('http://localhost?formId=abc&itemId=123');
    const localMockFetch = vi.fn(
      () => Promise.resolve(new Response(JSON.stringify(mockKeycloakConfig), { status: 200 }))
    );
    global.fetch = localMockFetch;
    (authenticatedFetch as Mock).mockResolvedValue(createFetchResponse(mockData, 401));

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText('Seite wird geladen…')).toBeNull();
      expect(screen.getByText('Hoppla, da ist etwas schiefgelaufen!')).not.toBeNull();
    }, { timeout: 400 });
  });

  it('renderes content if authorized with token', async () => {
    delete (global as any).window.location;
    (global as any).window.location = new URL('http://localhost?view=item&formId=abc&itemId=123');

    render(<App />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
      expect(screen.queryByText('Seite wird geladen…')).toBeNull();
      expect(screen.getByText('Speichern')).not.toBeNull();
    }, { timeout: 400 });
  });

  it('takes the order URL parameter into account', async () => {
    delete (global as any).window.location;
    (global as any).window.location = new URL('http://localhost?view=table&formId=abc&order=asc&page=1');

    render(<App />);

    await waitFor(() => {
      expect(authenticatedFetch).toHaveBeenCalledWith(
        '../form/abc?page=0&order=asc',
        {headers: {'Content-Type': 'application/json'}},
        mockKeycloak
      );
    }, { timeout: 400 });
  });

  it('takes the orderBy URL parameter into account', async () => {
    delete (global as any).window.location;
    (global as any).window.location = new URL('http://localhost?view=table&formId=abc&orderBy=foo&page=1');

    render(<App />);

    await waitFor(() => {
      expect(authenticatedFetch).toHaveBeenCalledWith(
        '../form/abc?page=0&orderBy=foo',
        {headers: {'Content-Type': 'application/json'}},
        mockKeycloak
      );
    }, { timeout: 400 });
  });
});
