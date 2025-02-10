import { FormConfigInternal } from './formConfigInternal';

type OmittedProps = 'access' | 'dataSource' | 'includedProperties' | 'includedPropertiesTable';

/**
 * The public form configuration.
 * This differs from the internal form configuration in that it
 * does not contain sensitive data. This is the type that is being
 * used for sending form configurations to the client.
 */
export type FormConfigPublic = Omit<FormConfigInternal, OmittedProps> & {
  /** Defines if the form is editable by the user. */
  editable: boolean;
  order: FormConfigInternal['dataSource']['order'];
  orderBy: FormConfigInternal['dataSource']['orderBy'];
};
