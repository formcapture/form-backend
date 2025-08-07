import { Request, Response, NextFunction } from 'express';

import _set from 'lodash/set';

import { setupLogger } from '../logger';


import { GenericRequestError } from './GenericRequestError';

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

  if (err instanceof GenericRequestError) {
    logger.debug(`Generic request error: ${err.message}`);
    statusCode = err.status || statusCode;
  } else {
    logger.error(`Cannot create formItem: ${err.message}`);
  }

  const responseObject = {
    success: false,
    message,
    ...(process.env.NODE_ENV && process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  };

  if (err instanceof GenericRequestError) {
    _set(responseObject, 'extra', err.extra || {});
  }

  res.status(statusCode).json(responseObject);
}
