import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TOAST_MESSAGE } from '../../constants/toastMessage';

import ToastAlert from './ToastAlert';

describe('<ToastAlert />', () => {
  afterEach(() => {
    cleanup();
  });

  it.each([
    [TOAST_MESSAGE.createSuccess, 'Eintrag erfolgreich erstellt'],
    [TOAST_MESSAGE.deleteSuccess, 'Eintrag erfolgreich gelöscht'],
    [TOAST_MESSAGE.updateSuccess, 'Eintrag erfolgreich geändert'],
    [TOAST_MESSAGE.createError, 'Eintrag konnte nicht erstellt werden'],
    [TOAST_MESSAGE.deleteError, 'Eintrag konnte nicht gelöscht werden'],
    [TOAST_MESSAGE.updateError, 'Eintrag konnte nicht geändert werden']
  ])('renders the message for %s', (messageType, text) => {
    render(<ToastAlert show messageType={messageType} onClose={() => undefined} />);
    expect(screen.getByText(text)).toBeDefined();
  });

  it('appends the additional message to errors', () => {
    render(
      <ToastAlert show messageType={TOAST_MESSAGE.updateError} additionalMessage="kaputt" onClose={() => undefined} />
    );
    expect(screen.getByText('Eintrag konnte nicht geändert werden: kaputt')).toBeDefined();
  });

  it('calls onClose on button click', () => {
    const onClose = vi.fn();
    render(<ToastAlert show messageType={TOAST_MESSAGE.createSuccess} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalled();
  });
});
