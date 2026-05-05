import { Request } from 'express';

export interface FormConfigLoaderRequest extends Request {
  params: Request['params'] & { formId: string };
}
