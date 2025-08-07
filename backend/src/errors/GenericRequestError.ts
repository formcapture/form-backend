interface ErrorInfo {
  code?: string;
  detailedMessage?: string;
}

export class GenericRequestError extends Error {
  status: number;
  extra?: ErrorInfo;

  constructor(message: string, status: number, extra: any) {
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
  constructor(message: string, extra: any) {
    super(message, 500, extra);
    this.name = 'DatabaseError';
  }
}
