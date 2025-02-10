export class GenericRequestError extends Error {
  status: number;

  constructor(message: string, status: number = 401) {
    super(message);
    this.name = 'GenericRequestError';
    this.message = message;
    this.status = status;
  }
}
