import { FormConfiguration, FormProperty } from '../App';

import { isGeometryType } from './jsonEditor';

export const isFilterableProp = (properties: FormProperty) => {
  const {
    format,
    type,
    media,
    enumSource
  } = properties;

  const validFilterTypes: FormProperty['type'][] = ['integer', 'string', 'number'];
  const isFilterableType = validFilterTypes.includes(type);
  const isFileUpload = media?.binaryEncoding === 'base64';
  const isGeometry = format ? isGeometryType(format) : false;
  const isEnum = !!enumSource;

  return isFilterableType && !isFileUpload && !isGeometry && !isEnum;
};

export const isSortableProp = (properties: FormProperty) => {
  const {
    format,
    type,
    media
  } = properties;

  const validSortTypes: FormProperty['type'][] = ['integer', 'string', 'number', 'boolean'];
  const isSortableType = validSortTypes.includes(type);
  const isFileUpload = media?.binaryEncoding === 'base64';
  const isGeometry = format ? isGeometryType(format) : false;

  return isSortableType && !isFileUpload && !isGeometry;
};

export const getGeometryColumns = (config: FormConfiguration['config']): string[] | undefined => {
  if (!config) {
    return;
  }
  const geometryKeys = Object.keys(config.properties).filter(key => {
    const { type, format } = config.properties[key];
    return (
      type === 'string' &&
      format &&
      (isGeometryType(format) || ['location', 'geometrySelection'].includes(format))
    );
  });
  return geometryKeys;
};

export const getFeaturesFromTableData = (
  data: FormConfiguration['data']['data'],
  config: FormConfiguration['config'],
  geometryKeys: string[]
) => {
  return data.flatMap(record =>
    geometryKeys.flatMap((key) => {
      // Check if the geometry value is defined
      if (record && record[key]) {
        return {
          ...record,
          columnId: key,
          itemId: record[config.idColumn],
          geom: record[key],
        };
      }
      // Return an empty array if the geometry value is undefined
      return [];
    })
  );
};
