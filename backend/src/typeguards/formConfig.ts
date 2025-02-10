import { FormConfig } from '../types/formConfig';

export const isFormConfig = (obj: any): obj is FormConfig => {
  if (!obj) {
    return false;
  }
  if (obj.access && obj.views) {
    return true;
  }
  return false;
};
