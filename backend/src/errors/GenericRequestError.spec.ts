import { FormBackendErrorCode } from './FormBackendErrorCode';
import {
  AuthenticationError,
  DatabaseError,
  FormRequestError,
  GenericRequestError,
  InternalServerError,
  isGenericRequestError
} from './GenericRequestError';

describe('GenericRequestError', () => {
  it('sets message, status and extra', () => {
    const err = new GenericRequestError('foo', 418, { detailedMessage: 'bar' });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toEqual('GenericRequestError');
    expect(err.message).toEqual('foo');
    expect(err.status).toEqual(418);
    expect(err.extra).toEqual({ detailedMessage: 'bar' });
  });

  it('InternalServerError uses defaults', () => {
    const err = new InternalServerError();
    expect(err.name).toEqual('InternalServerError');
    expect(err.message).toEqual('Internal Server Error');
    expect(err.status).toEqual(500);
    expect(err.extra).toEqual({ errorCode: FormBackendErrorCode.INTERNAL_SERVER_ERROR });
    expect(new InternalServerError('foo').message).toEqual('foo');
  });

  it('DatabaseError has status 500 and database info', () => {
    const extra = { tableName: 'foo', dbErrorCode: '23505' };
    const err = new DatabaseError('foo', extra);
    expect(err.name).toEqual('DatabaseError');
    expect(err.status).toEqual(500);
    expect(err.extra).toEqual(extra);
  });

  it('FormRequestError keeps the given status', () => {
    const err = new FormRequestError('foo', 400, {});
    expect(err.name).toEqual('FormRequestError');
    expect(err.status).toEqual(400);
  });

  it('AuthenticationError has status 401', () => {
    const err = new AuthenticationError('foo');
    expect(err.name).toEqual('AuthenticationError');
    expect(err.status).toEqual(401);
  });
});

describe('isGenericRequestError', () => {
  it.each([
    new GenericRequestError('foo', 400, {}),
    new InternalServerError(),
    new DatabaseError('foo', {}),
    new FormRequestError('foo', 400, {}),
    new AuthenticationError('foo')
  ])('returns true for %p', (err) => {
    expect(isGenericRequestError(err)).toBe(true);
  });

  it.each([
    'GenericRequestError',
    'FormRequestError',
    'DatabaseError',
    'AuthenticationError',
    'InternalServerError'
  ])('returns true for plain objects named %s', (name) => {
    expect(isGenericRequestError({ name })).toBe(true);
  });

  it.each([
    new Error('foo'),
    { name: 'TypeError' },
    null,
    undefined
  ])('returns a falsy value for %p', (err) => {
    expect(isGenericRequestError(err)).toBeFalsy();
  });
});
