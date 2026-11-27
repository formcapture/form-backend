import { describe, expect, it } from 'vitest';

import i18n from '../../i18n/i18nTest';

import { errorCodeToMessage } from './errors';

describe('errorCodeToMessage', () => {
  const t = i18n.t.bind(i18n);

  it('returns the unknown error for missing error codes', () => {
    expect(errorCodeToMessage(undefined, t)).toBe('Unbekannter Fehler.');
    expect(errorCodeToMessage({}, t)).toBe('Unbekannter Fehler.');
  });

  it('returns the message for a database error code', () => {
    expect(errorCodeToMessage({ errorCode: 'X', dbErrorCode: 'XX000' }, t))
      .toBe('Geometrie-Fehler: Invalide / Leere Geometrie kann nicht gespeichert werden.');
  });

  it('returns the unknown database error for an unknown database error code', () => {
    expect(errorCodeToMessage({ errorCode: 'X', dbErrorCode: 'NOPE1' }, t))
      .toBe('Unbekannter Fehler bei der Datenbankabfrage.');
  });

  it('returns the unknown error for an unknown error code', () => {
    expect(errorCodeToMessage({ errorCode: 'NOT_A_CODE' }, t)).toBe('Unbekannter Fehler.');
  });

  it('returns the message for an error code', () => {
    expect(errorCodeToMessage({ errorCode: 'CONFIG_KEY_IS_EMPTY' }, t)).toBe('Konfigurationsschlüssel ist leer.');
  });

  it('interpolates the formId', () => {
    expect(errorCodeToMessage({ errorCode: 'FORM_CONFIG_NOT_FOUND' }, t, 'abc'))
      .toBe('Das angeforderte Formular mit der ID abc wurde nicht gefunden.');
  });
});
