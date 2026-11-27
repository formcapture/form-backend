import { JSONEditor } from '@json-editor/json-editor';

import FileEditor from '../Component/FileEditor/FileEditor';
import GeometryEditor from '../Component/GeometryEditor/GeometryEditor';
import GeometrySelection from '../Component/GeometrySelection/GeometrySelection';
import Location from '../Component/Location/Location';

import { DE, isGeometryType } from './jsonEditor';

/**
 * Registers the custom editors, their resolvers and the german translations at the JSONEditor defaults.
 */
export const registerCustomEditors = () => {
  // TODO improve this. Cf. App.spec.tsx
  if (JSONEditor && JSONEditor.defaults && JSONEditor.defaults.editors && JSONEditor.defaults.resolvers) {
    JSONEditor.defaults.languages.de = DE;
    JSONEditor.defaults.language = 'de';
    JSONEditor.defaults.editors.geometry = GeometryEditor;
    JSONEditor.defaults.editors.geometrySelection = GeometrySelection;
    JSONEditor.defaults.editors.location = Location;
    JSONEditor.defaults.editors.file = FileEditor;

    JSONEditor.defaults.resolvers.unshift((schema: any) => {
      const isGeometry = isGeometryType(schema.format);
      if (schema.type === 'string' && schema.format === 'geometrySelection') {
        return 'geometrySelection';
      }
      if (schema.type === 'string' && schema.format === 'location') {
        return 'location';
      }
      if (schema.type === 'string' && isGeometry) {
        return 'geometry';
      }
    });
    JSONEditor.defaults.resolvers.unshift((schema: any) => {
      return schema.type === 'string' && schema.media && schema.media.binaryEncoding === 'base64' && 'file';
    });
  }
};
