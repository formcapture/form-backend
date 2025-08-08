import { FormBackendErrorCode } from './FormBackendErrorCode';

interface ErrorInfo {
  errorCode?: FormBackendErrorCode;
  detailedMessage?: string;
}
interface DatabaseErrorInfo extends ErrorInfo {
  tableName?: string;
  dbErrorCode?: string;
}

export class GenericRequestError extends Error {
  status: number;
  extra?: ErrorInfo;

  constructor(message: string, status: number, extra: ErrorInfo) {
    super(message);
    this.name = 'GenericRequestError';
    this.message = message;
    this.status = status;
    this.extra = extra;
  }
}

export class InternalServerError extends GenericRequestError {
  constructor(message?: string) {
    super(message ?? 'Internal Server Error', 500, { errorCode: 'INTERNAL_SERVER_ERROR' });
    this.name = 'InternalServerError';
  }
}

export class DatabaseError extends GenericRequestError {
  constructor(message: string, extra: DatabaseErrorInfo) {
    super(message, 500, extra);
    this.name = 'DatabaseError';
  }
}

export class FormRequestError extends GenericRequestError {
  constructor(message: string, status: number, extra: ErrorInfo) {
    super(message, status, extra);
    this.name = 'FormRequestError';
  }
}

export function isGenericRequestError(err: any): err is GenericRequestError {
  return err instanceof GenericRequestError ||
    (err && err.name === 'GenericRequestError') ||
    (err && err.name === 'FormRequestError') ||
    (err && err.name === 'DatabaseError') ||
    (err && err.name === 'AuthenticationError') ||
    (err && err.name === 'InternalServerError');
}
