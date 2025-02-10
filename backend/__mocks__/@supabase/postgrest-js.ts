export class PostgrestFilterBuilder {
  eq() {
    return this;
  }
}

export class PostgrestQueryBuilder {
  select = jest.fn();
  update = jest.fn(() => new PostgrestFilterBuilder());
}

export class PostgrestClient {

  // Add needed postgrestClient mocks
  // and other functions here.

  select = jest.fn();

  from = jest.fn();

  schema() {
    return this;
  }
}
