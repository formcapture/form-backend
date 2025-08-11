import { Request, Response, NextFunction } from 'express';

import { setupLogger } from '../logger';

import { isGenericRequestError } from './GenericRequestError';

const logger = setupLogger({ label: 'errorMiddleware' });

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {

  let statusCode = 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message;

  if (process.env.NODE_ENV !== 'production') {
    logger.error(err);
  }

  if (isGenericRequestError(err)) {
    logger.debug(`Generic request error: ${err.message}`);
    statusCode = err.status || statusCode;
  } else {
    logger.error(`Cannot create formItem: ${err.message}`);
  }

  const responseObject: any = {
    success: false,
    name: err.name || 'InternalServerError',
    statusCode,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  };

  if (isGenericRequestError(err)) {
    responseObject.extra = err.extra || {};
  }

  res.status(statusCode).json(responseObject);

  next();
}
