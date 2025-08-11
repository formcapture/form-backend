export default {
  de: {
    translation: {
      ErrorPage: {
        checkUrlMsg: 'Bitte überprüfen Sie, ob Sie die richtige Adresse eingegeben haben oder versuchen Sie es ' +
          'später erneut.',
        checkParametersMsg: 'Bitte geben Sie die `formId` und `view` Parameter in der URL an.',
        checkViewParameterMsg: 'Bitte überprüfen Sie den `view` Parameter in der URL.',
        headingText: 'Hoppla, da ist etwas schiefgelaufen!',
        viewNotSupportedMsg: 'Die angeforderte Ansicht "{{view}}" ist nicht verfügbar. Bitte verwenden Sie ' +
          'entweder "item" oder "table" als View.'
      },
      ErrorCodes: {
        unknownError: 'Unbekannter Fehler',
        unknownDatabaseError: 'Unbekannter Fehler bei der Datenbankabfrage',
        CONFIG_KEY_IS_EMPTY: 'Konfigurationsschlüssel ist leer',
        DB_JOIN_ITEMS_NOT_FOUND_FOR_CONFIG_KEYS: 'Keine Join-Items für Konfigurationsschlüssel gefunden',
        FORM_CONFIG_NOT_FOUND: 'Das angeforderte Formular mit der ID {{formId}} wurde nicht gefunden',
        FORM_ID_MISSING: 'Bitte prüfen Sie den `formId` Parameter in der URL.',
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
      },
      ItemView: {
        deleteEntryMsg: 'Eintrag löschen',
        saveTxt: 'Speichern',
        backTxt: 'Zurück'
      },
      TableView: {
        viewTooltip: 'Anzeigen',
        zoomToGeometryTooltip: 'Auf Geometrie zoomen',
        editTooltip: 'Bearbeiten',
        deleteTooltip: 'Eintrag löschen',
        seeItemViewText: 'Siehe Detailansicht',
        createEntryText: 'Eintrag erstellen',
      }
    }
  },
  en: {
    translation: {
      ErrorPage: {
        checkUrlMsg: 'Please check if you entered the correct address or try again later.',
        checkParametersMsg: 'Please provide the `formId` and `view` parameters in the URL.',
        checkViewParameterMsg: 'Please check the `view` parameter in the URL.',
        headingText: 'Oops, something went wrong!',
        viewNotSupportedMsg: 'The requested view "{{view}}" is not available.' +
          'Please use either "item" or "table" as the view.'
      },
      ErrorCodes: {
        unknownError: 'Unknown error',
        unknownDatabaseError: 'Unknown error during database query',
        CONFIG_KEY_IS_EMPTY: 'Configuration key is empty',
        DB_JOIN_ITEMS_NOT_FOUND_FOR_CONFIG_KEYS: 'No join items found for configuration keys',
        FORM_CONFIG_NOT_FOUND: 'The requested form with ID {{formId}} was not found',
        FORM_ID_MISSING: 'Form ID parameter is missing',
        INTERNAL_SERVER_ERROR: 'Internal server error',
        INVALID_FILE: 'Invalid or missing file',
        INVALID_FILTER: 'Invalid filter. Please check the filter criteria.',
        INVALID_ORDER: 'Invalid sort order. Please use "asc" or "desc".',
        INVALID_ORDER_BY: 'Invalid sort criteria. Please use valid column names.',
        INVALID_PAGE: 'Invalid page. Please provide a valid page number.',
        ITEM_CREATION_FAILED: 'Failed to create item',
        ITEM_ID_MISSING: 'Item ID parameter is missing',
        JOIN_TABLE_DATA_CREATION_FAILED: 'Failed to create join table data',
        JOIN_TABLE_DATA_DELETION_FAILED: 'Failed to delete join table data',
        JOIN_TABLE_NOT_FOUND: 'Join table not found',
        JOIN_TABLE_PROP_NOT_FOUND: 'Join table property not found',
        JOIN_TABLE_RELATIONSHIP_NOT_SUPPORTED: 'Join table relationship not supported',
        LOOKUP_TABLE_PROPERTY_NOT_FOUND: 'Lookup table property not found',
        MISSING_LOOKUP_COLUMNS: 'Missing lookup columns',
        MISSING_LOOKUP_TABLES: 'Missing lookup tables',
        DATABASE: {
          XX000: 'Geometry error: Invalid/empty geometry cannot be saved.'
        }
      },
      ItemView: {
        deleteEntryMsg: 'Delete entry',
        saveTxt: 'Save',
        backTxt: 'Back'
      },
      TableView: {
        viewTooltip: 'View',
        zoomToGeometryTooltip: 'Zoom to geometry',
        editTooltip: 'Edit',
        deleteTooltip: 'Delete entry',
        seeItemViewText: 'See detail view',
        createEntryText: 'Create entry'
      }
    }
  }
};
