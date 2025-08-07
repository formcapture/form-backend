export class AuthenticationError extends Error {
  status: number;

  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
    this.status = 401;
  }
}
