import { Request, Response } from 'express';

import { errorMiddleware } from './errorMiddleware';
import { FormRequestError } from './GenericRequestError';

const createResponseMock = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn()
  };
  res.status.mockReturnValue(res);
  return res;
};

describe('errorMiddleware', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('responds with the status and extra of a generic request error', () => {
    const res = createResponseMock();
    const next = jest.fn();
    const err = new FormRequestError('foo', 404, { detailedMessage: 'bar' });

    errorMiddleware(err, {} as Request, res as unknown as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      name: 'FormRequestError',
      statusCode: 404,
      message: 'foo',
      stack: err.stack,
      extra: { detailedMessage: 'bar' }
    }));
    expect(next).toHaveBeenCalled();
  });

  it('falls back to status 500 and empty extra', () => {
    const res = createResponseMock();
    const err = new FormRequestError('foo', 0, undefined as any);

    errorMiddleware(err, {} as Request, res as unknown as Response, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].extra).toEqual({});
  });

  it('responds with 500 and without extra for other errors', () => {
    const res = createResponseMock();
    const err = new Error('foo');
    err.name = '';

    errorMiddleware(err, {} as Request, res as unknown as Response, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body.name).toEqual('InternalServerError');
    expect(body.message).toEqual('foo');
    expect(body).not.toHaveProperty('extra');
  });

  it('hides message and stack in production', () => {
    process.env.NODE_ENV = 'production';
    const res = createResponseMock();

    errorMiddleware(new Error('secret'), {} as Request, res as unknown as Response, jest.fn());

    const body = res.json.mock.calls[0][0];
    expect(body.message).toEqual('Internal Server Error');
    expect(body).not.toHaveProperty('stack');
  });
});
