/* eslint-disable camelcase */
export const DE = {
  /**
   * When a property is not set
   */
  error_notset: 'Attribut muss gesetzt sein',
  /**
   * When a string must not be empty
   */
  error_notempty: 'Wert verfplichtend',
  /**
   * When a value is not one of the enumerated values
   */
  error_enum: 'Wert muss einem der aufgelisteten Werte entsprechen',
  /**
   * When a value is not equal to the constant
   */
  error_const: 'Wert muss der Konstanten entsprechen',
  /**
   * When a value doesn't validate any schema of a 'anyOf' combination
   */
  error_anyOf: 'Wert muss mindestens einem der bereitgestellten Schemata entsprechen',
  /**
   * When a value doesn't validate
   * @variables This key takes one variable: The number of schemas the value does not validate
   */
  error_oneOf: 'Wert muss genau einem der bereitgestellten Schemata entsprechen. Er entspricht aktuell {{0}} Schemata.',
  /**
   * When a value does not validate a 'not' schema
   */
  error_not: 'Wert darf nicht einem der bereitgestellten Schemata entsprechen',
  /**
   * When a value does not match any of the provided types
   */
  error_type_union: 'Wert muss einem der bereitgestellten Typen entsprechen',
  /**
   * When a value does not match the given type
   * @variables This key takes one variable: The type the value should be of
   */
  error_type: 'Wert muss Typ {{0}} entsprechen',
  /**
   *  When the value validates one of the disallowed types
   */
  error_disallow_union: 'Wert darf nicht einem der nicht erlaubten Werte entsprechen',
  /**
   *  When the value validates a disallowed type
   * @variables This key takes one variable: The type the value should not be of
   */
  error_disallow: 'Wert darf nicht dem Typ {{0}} entsprechen',
  /**
   * When a value is not a multiple of or divisible by a given number
   * @variables This key takes one variable: The number mentioned above
   */
  error_multipleOf: 'Wert muss ein Vielfaches von {{0}} sein',
  /**
   * When a value is greater than it's supposed to be (exclusive)
   * @variables This key takes one variable: The maximum
   */
  error_maximum_excl: 'Wert muss kleiner als {{0}} sein',
  /**
   * When a value is greater than it's supposed to be (inclusive
   * @variables This key takes one variable: The maximum
   */
  error_maximum_incl: 'Wert darf höchstens {{0}} sein',
  /**
   * When a value is lesser than it's supposed to be (exclusive)
   * @variables This key takes one variable: The minimum
   */
  error_minimum_excl: 'Wert muss größer {{0}} sein',
  /**
   * When a value is lesser than it's supposed to be (inclusive)
   * @variables This key takes one variable: The minimum
   */
  error_minimum_incl: 'Wert muss mindestens {{0}} sein',
  /**
   * When a value have too many characters
   * @variables This key takes one variable: The maximum character count
   */
  error_maxLength: 'Wert darf höchstens {{0}} Zeichen lang sein',
  /**
   * When no array items validates the contains schema
   */
  error_contains: 'Kein Eintrag entspricht vorgegebenem Schema',
  /**
   * When an array have too few items that validate agaist contains schema
   * @variables This key takes two variable: The valid items count and the minContains value
   */
  error_minContains: '{{0}} Einträge die vorgegebenem Schema entsprechen sind weniger als die Mindestanzahl von {{1}}',
  /**
   * When an array have too many items that validate agaist contains schema
   * @variables This key takes two variable: The valid items count and the maxContains value
   */
  error_maxContains: '{{0}} Einträge die vorgegebenem Schema entsprechen überschreiten die Höchstanzahl von {{1}}',
  /**
   * When a value does not have enough characters
   * @variables This key takes one variable: The minimum character count
   */
  error_minLength: 'Wert muss mindestens {{0}} Zeichen lang sein',
  /**
   * When a value does not match a given pattern
   */
  error_pattern: 'Wert muss dem Muster {{0}} entsprechen',
  /**
   * When an array has additional items whereas it is not supposed to
   */
  error_additionalItems: 'Keine weiteren Einträge in Liste erlaubt',
  /**
   * When there are to many items in an array
   * @variables This key takes one variable: The maximum item count
   */
  error_maxItems: 'Wert darf höchstens {{0}} Einträge enthalten',
  /**
   * When there are not enough items in an array
   * @variables This key takes one variable: The minimum item count
   */
  error_minItems: 'Wert muss mindestens {{0}} Einträge enthalten',
  /**
   * When an array is supposed to have unique items but has duplicates
   */
  error_uniqueItems: 'Liste muss einzigartige Einträge enthalten',
  /**
   * When there are too many properties in an object
   * @variables This key takes one variable: The maximum property count
   */
  error_maxProperties: 'Objekt darf höchstens {{0}} Attribute haben',
  /**
   * When there are not enough properties in an object
   * @variables This key takes one variable: The minimum property count
   */
  error_minProperties: 'Objekt muss mindestens {{0}} Attribute haben',
  /**
   * When a required property is not defined
   * @variables This key takes one variable: The name of the missing property
   */
  error_required: 'Objekt fehlt verpflichtendes Attribut \'{{0}}\'',
  /**
   * When there is an additional property is set whereas there should be none
   * @variables This key takes one variable: The name of the additional property
   */
  error_additional_properties: 'Keine weiteren Attribute erlaubt. Attribut {{0}} wurde gesetzt',
  /**
   * When there is a propertyName that sets a max length and a property name exceeds the max length
   * @variables This key takes one variable: The name of the invalid property
   */
  error_property_names_exceeds_maxlength: 'Attributname {{0}} überschreitet maximale Länge',
  /**
   * When there is a propertyName that sets an enum and a property name matches none of the possible enum
   * @variables This key takes one variable: The name of the invalid property
   */
  error_property_names_enum_mismatch: 'Attributname {{0}} entspricht keinem aufgelisteten Wert',
  /**
   * When there is a propertyName that sets a const and a property does not match the const value
   * @variables This key takes one variable: The name of the invalid property
   */
  error_property_names_const_mismatch: 'Attributname {{0}} entspricht nicht der Konstanten',
  /**
   * When there is a propertyName that sets a pattern and a property name does not match the pattern
   * @variables This key takes one variable: The name of the invalid property
   */
  error_property_names_pattern_mismatch: 'Attributname {{0}} entspricht nicht dem Muster',
  /**
   * When the propertyName is set to false and there is at least one property
   * @variables This key takes one variable: The name of the invalid property
   */
  error_property_names_false: 'Attributname {{0}} schlägt fehl, falls propertyName false ist',
  /**
   * When the propertyName specifies a maxLength that is not a number
   * @variables This key takes one variable: The name of the current property
   */
  error_property_names_maxlength: 'Attributname {{0}} darf nicht invalider maximaler Länger entsprechen',
  /**
   * When the propertyName specifies an enum that is not an array
   * @variables This key takes one variable: The name of the current property
   */
  error_property_names_enum: 'Attributname {{0}} darf nicht invalider Auswahlliste entsprechen',
  /**
   * When the propertyName specifies a pattern that is not a string
   * @variables This key takes one variable: The name of the current property
   */
  error_property_names_pattern: 'Attributname {{0}} darf nicht invalidem Muster entsprechen',
  /**
   * When the propertyName is unsupported
   * @variables This key takes one variable: The name of the invalid propertyName
   */
  error_property_names_unsupported: 'Nicht-unterstützter Attributname {{0}}',
  /**
   * When a dependency is not resolved
   * @variables This key takes one variable: The name of the missing property for the dependency
   */
  error_dependency: 'Muss Attribut {{0}} haben',
  /**
   * When a date is in incorrect format
   * @variables This key takes one variable: The valid format
   */
  error_date: 'Datum muss im Format {{0}} sein',
  /**
   * When a time is in incorrect format
   * @variables This key takes one variable: The valid format
   */
  error_time: 'Zeit muss im Format {{0}} sein',
  /**
   * When a datetime-local is in incorrect format
   * @variables This key takes one variable: The valid format
   */
  error_datetime_local: 'Datum und Zeit muss im Format {{0}} sein',
  /**
   * When a integer date is less than 1 January 1970
   */
  error_invalid_epoch: 'Datum muss größer als der 1. January 1970 sein',
  /**
   * When an IPv4 is in incorrect format
   */
  // eslint-disable-next-line max-len
  error_ipv4: 'Wert muss eine valide IPv4 Adresse in der Form von 4 Nummern zwischen 0 und 255, separiert von Punkten sein.',
  /**
   * When an IPv6 is in incorrect format
   */
  error_ipv6: 'Wert muss eine valide IPv4 Adresse sein',
  /**
   * When a hostname is in incorrect format
   */
  error_hostname: 'Der Hostname hat das falsche Format',
  /**
   * When uploads max size limit is exceeded
   */
  upload_max_size: 'Datei zu groß. Maximale Größe ist ',
  /**
   * Info about the max file size
   */
  upload_max_size_info: 'Maximale Größe: ',
  /**
   * When the mime type does not match the type of the file
   */
  upload_wrong_file_format: 'Falsches Dateiformat. Erlaubte(s) Format(e): ',
  /**
   * Text/Title on Save button
   */
  button_save: 'Speichern',
  /**
   * Text/Title on Copy button
   */
  button_copy: 'Kopieren',
  /**
   * Text/Title on Cancel button
   */
  button_cancel: 'Abbrechen',
  /**
   * Text/Title on Add button
   */
  button_add: 'Hinzufügen',
  /**
   * Text on Delete All buttons
   */
  button_delete_all: 'Alle',
  /**
   * Title on Delete All buttons
   */
  button_delete_all_title: 'Alle Löschen',
  /**
   * Text on Delete Last buttons
   * @variable This key takes one variable: The title of object to delete
   */
  button_delete_last: 'Letzte(n) {{0}}',
  /**
   * Title on Delete Last buttons
   * @variable This key takes one variable: The title of object to delete
   */
  button_delete_last_title: 'Letzte(n) {{0}} Löschen',
  /**
   * Title on Add Row buttons
   * @variable This key takes one variable: The title of object to add
   */
  button_add_row_title: '{{0}} Hinzufügen',
  /**
   * Title on Move Down buttons
   */
  button_move_down_title: 'Nach unten',
  /**
   * Title on Move Up buttons
   */
  button_move_up_title: 'Nach oben',
  /**
   * Text on Object Properties buttons
   */
  button_properties: 'Eigenschaften',
  /**
   * Title on Object Properties buttons
   */
  button_object_properties: 'Objekteigenschaften',
  /**
   * Title on Copy Row button
   * @variable This key takes one variable: The title of object to delete
   */
  button_copy_row_title: '{{0}} Kopieren',
  /**
   * Title on Delete Row buttons
   * @variable This key takes one variable: The title of object to delete
   */
  button_delete_row_title: '{{0}} Löschen',
  /**
   * Title on Delete Row buttons, short version (no parameter with the object title)
   */
  button_delete_row_title_short: 'Löschen',
  /**
   * Title on Copy Row buttons, short version (no parameter with the object title)
   */
  button_copy_row_title_short: 'Kopieren',
  /**
   * Title on Collapse buttons
   */
  button_collapse: 'Einklappen',
  /**
   * Title on Expand buttons
   */
  button_expand: 'Ausklappen',
  /**
   * Title on Edit JSON buttons
   */
  button_edit_json: 'JSON Bearbeiten',
  /**
   * Text/Title on Upload buttons
   */
  button_upload: 'Hochladen',
  /**
   * Text/Title on Remove buttons
   */
  button_remove: 'Entfernen',
  /**
   * Title on Flatpickr toggle buttons
   */
  flatpickr_toggle_button: 'Umschalten',
  /**
   * Title on Flatpickr clear buttons
   */
  flatpickr_clear_button: 'Entfernen',
  /**
   * Choices input field placeholder text
   */
  choices_placeholder_text: 'Tippen um Wert hinzuzufügen',
  /**
   * Default title for array items
   */
  default_array_item_title: 'Eintrag',
  /**
   * Warning when deleting a node
   */
  button_delete_node_warning: 'Sind Sie sicher, dass Sie den Eintrag löschen wollen?',
  /**
   * Warning when deleting a node
   */
  table_controls: 'Bedienelemente',
  /**
   * Warning when paste and  length exceeded maxLength
   */
  paste_max_length_reached: 'Eingefügter Text überschreitet die maximale Länge von {{0}} und wird gekürzt.'
};

export const isGeometryType = (type: string) => {
  if (!type) {
    return false;
  }
  return isPoint(type) || isLineString(type) || isPolygon(type);
};

export const isPoint = (type: string) => {
  return /^(\w+\.)?geometry($|\((POINT|Point)(, ?\d+)?\)$)/.test(type);
};

export const isLineString = (type: string) => {
  return /^(\w+\.)?geometry($|\((LINESTRING|LineString)(, ?\d+)?\)$)/.test(type);
};

export const isPolygon = (type: string) => {
  return /^(\w+\.)?geometry($|\((POLYGON|Polygon)(, ?\d+)?\)$)/.test(type);
};

export const getItemId = (editor: any): any => {
  if (!editor.parent) {
    const idColumn = editor.original_schema.idColumn;
    return editor.value[idColumn];
  }
  return getItemId(editor.parent);
};
