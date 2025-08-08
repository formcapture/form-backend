import { TFunction } from 'i18next';
import _isNil from 'lodash/isNil';

export const errorCodeToMessage = (errorCodeObject: any, t: TFunction, formId?: string): string => {
  if (_isNil(errorCodeObject)) {
    return t('ErrorCodes.unknownError');
  }

  const {
    errorCode,
    dbErrorCode
  } = errorCodeObject;

  if (_isNil(errorCode)) {
    return t('ErrorCodes.unknownError');
  }

  if (!_isNil(dbErrorCode)) {
    return t(`ErrorCodes.DATABASE.${dbErrorCode}`) || t('ErrorCodes.unknownDatabaseError');
  }

  const message = t(`ErrorCodes.${errorCode}`);
  if (message.indexOf('{{') !== -1 && message.indexOf('}}') !== -1) {
    return t(`ErrorCodes.${errorCode}`, { formId }); // TODO: make this more generic
  }
  return message;
};

