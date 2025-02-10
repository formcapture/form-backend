import { FormConfig } from './formConfig';

/**
 * Helper type to make single properties of a type required
 */
type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
  [Property in Key]-?: Type[Property];
};

/**
 * The internal form configuration.
 * This configuration differs from `FormConfig` in that
 * it has all properties resolved and thus has
 * no optional properties.
 */
export type FormConfigInternal = Omit<Required<FormConfig>, 'format'> & {
  format?: string;
  // TODO check which properties have to be resolved further (e.g. because some nested properties are still optional)
  dataSource: WithRequiredProperty<FormConfig['dataSource'], 'order' | 'orderBy'>;
  views: WithRequiredProperty<FormConfig['views'], 'item' | 'table' | 'pageSize'>;
  includedProperties: string[];
  includedPropertiesTable: string[];
};
