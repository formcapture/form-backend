import _isNil from 'lodash/isNil';

export const errorCodeMap: Record<string, any> = {
  CONFIG_KEY_IS_EMPTY: 'Konfigurationsschlüssel ist leer',
  DB_JOIN_ITEMS_NOT_FOUND_FOR_CONFIG_KEYS: 'Keine Join-Items für Konfigurationsschlüssel gefunden',
  FORM_CONFIG_NOT_FOUND: (formId: string) =>
    <span>Das angeforderte Formular mit der ID <strong>{formId}</strong> wurde nicht gefunden.</span>,
  FORM_ID_MISSING: 'Formular-ID Parameter fehlt',
  INTERNAL_SERVER_ERROR: 'Interner Server Fehler',
  INVALID_FILE: 'Ungültige oder fehlende Datei',
  INVALID_FILTER: 'Ungültiger Filter. Bitte überprüfen Sie die Filterkriterien.',
  INVALID_ORDER: 'Ungültige Sortierung. Bitte verwenden Sie "asc" oder "desc".',
  INVALID_ORDER_BY: 'Ungültige Sortierkriterien. Bitte verwenden Sie gültige Spaltennamen.',
  INVALID_PAGE: 'Ungültige Seite. Bitte geben Sie eine gültige Seitenzahl an.',
  ITEM_CREATION_FAILED: 'Fehler beim Erstellen des Objekts',
  ITEM_ID_MISSING: 'Item-ID Parameter fehlt',
  JOIN_TABLE_DATA_CREATION_FAILED: 'Fehler beim Erstellen von Join-Tabellendaten',
  JOIN_TABLE_DATA_DELETION_FAILED: 'Fehler beim Löschen von Join-Tabellendaten',
  JOIN_TABLE_NOT_FOUND: 'Join-Tabelle nicht gefunden',
  JOIN_TABLE_PROP_NOT_FOUND: 'Join-Tabellen-Eigenschaft nicht gefunden',
  JOIN_TABLE_RELATIONSHIP_NOT_SUPPORTED: 'Join-Tabellen-Beziehung nicht unterstützt',
  LOOKUP_TABLE_PROPERTY_NOT_FOUND: 'Lookup-Tabellen-Eigenschaft nicht gefunden',
  MISSING_LOOKUP_COLUMNS: 'Fehlende Lookup-Spalten',
  MISSING_LOOKUP_TABLES: 'Fehlende Lookup-Tabellen',
  DATABASE: {
    XX000: 'Geometrie-Fehler: Invalide / Leere Geometrie kann nicht gespeichert werden.'
  }
};

export const errorCodeToMessage = (errorCodeObject: any, formId: string): string => {
  if (_isNil(errorCodeObject)) {
    return 'Unbekannter Fehler';
  }

  const {
    errorCode,
    dbErrorCode
  } = errorCodeObject;

  if (_isNil(errorCode)) {
    return 'Unbekannter Fehler';
  }

  if (dbErrorCode && dbErrorCode in errorCodeMap.DATABASE) {
    return errorCodeMap.DATABASE[dbErrorCode];
  }

  if (errorCode in errorCodeMap) {
    const message = errorCodeMap[errorCode];
    if (typeof message === 'function') {
      return message(formId);
    }
    return message;
  }
  return 'Unbekannter Fehler';
};

