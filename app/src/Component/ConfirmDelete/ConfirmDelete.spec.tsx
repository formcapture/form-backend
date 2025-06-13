import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import ConfirmDelete from './ConfirmDelete';

describe('<ConfirmDelete />', () => {

  const show = true;
  const onCancel = vi.fn();
  const onDelete = vi.fn();

  afterEach(() => {
    cleanup();
  });

  it('is defined', () => {
    expect(ConfirmDelete).not.toBeNull();
  });

  it('renders the modal buttons', async () => {
    render(
      <ConfirmDelete
        show={show}
        onCancel={() => undefined}
        onDelete={() => undefined}
      />
    );

    const cancelButton = screen.getByText('Abbrechen');
    const deleteButton = screen.getByText('Löschen');

    expect(cancelButton).toBeDefined();
    expect(deleteButton).toBeDefined();
  });

  it('handles the cancel button', async () => {
    render(
      <ConfirmDelete
        show={show}
        onCancel={onCancel}
        onDelete={() => undefined}
      />
    );

    const cancelButton = screen.getByText('Abbrechen');

    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('handles the delete button', async () => {
    render(
      <ConfirmDelete
        show={show}
        onCancel={() => undefined}
        onDelete={onDelete}
      />
    );

    const deleteButton = screen.getByText('Löschen');

    fireEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('handles the visibilty of the modal', async () => {
    render(
      <ConfirmDelete
        show={show}
        onCancel={() => undefined}
        onDelete={() => undefined}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Eintrag löschen')).toBeDefined();
    });
  });

});
