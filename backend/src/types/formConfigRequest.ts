import { Request } from 'express';

import { FormConfig } from './formConfig';

export interface FormConfigRequest extends Request {
  formConfig: FormConfig;
  params: Request['params'] & { formId: string };
  userRoles: string[];
}
