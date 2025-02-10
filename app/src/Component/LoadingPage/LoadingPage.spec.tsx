import {
  render,
  screen,
  cleanup,
} from '@testing-library/react';
import {
  describe,
  it,
  expect,
  afterEach,
} from 'vitest';

import LoadingPage from './LoadingPage';

describe('<LoadingPage />', () => {
  afterEach(() => {
    cleanup();
  });

  it('is defined', () => {
    expect(LoadingPage).not.toBeNull();
  });

  it('can be rendered', () => {
    render(<LoadingPage />);
    expect(screen.getByText('Seite wird geladen…')).toBeDefined();
    expect(document.querySelector('.load-content')).toBeDefined();
    expect(document.querySelector('.load-spinner')).toBeDefined();
  });
});
