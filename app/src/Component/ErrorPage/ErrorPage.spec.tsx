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

import ErrorPage from './ErrorPage';

describe('<ErrorPage />', () => {
  afterEach(() => {
    cleanup();
  });

  it('is defined', () => {
    expect(ErrorPage).not.toBeNull();
  });

  it('can be rendered', () => {
    render(<ErrorPage />);
    expect(screen.getByText('Hoppla, da ist etwas schiefgelaufen!')).toBeDefined();
    expect(document.querySelector('.content')).toBeDefined();
    expect(document.querySelector('.bi-emoji-dizzy')).toBeDefined();
    expect(document.querySelector('.content')?.innerHTML).toContain('richtige Adresse eingegeben');
  });
});
