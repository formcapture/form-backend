import path from 'path';

import { Request } from 'express';

import { readdir, readFile } from '../../__mocks__/node:fs/promises';
import { FormConfigRequest } from '../types/formConfigRequest';

import { formConfigLoader } from './formConfigLoader';

jest.mock('node:fs/promises');

describe('formConfigLoader', () => {
  const configLoader = formConfigLoader({ formConfigsDir: 'formConfigs' });
  it('loads the form config from the file system', async () => {
    const req: Request = {
      params: { formId: 'formId' }
    } as unknown as Request;

    readdir.mockResolvedValue(['formId.json']);

    await configLoader(req, {} as any, () => undefined);

    const expectedPath = path.join(process.cwd(), 'formConfigs/formId.json');
    expect(readFile).toHaveBeenCalledWith(expectedPath, { encoding: 'utf-8' });
  });
  it('adds the form config to the request object', async () => {
    const req: Request = {
      params: { formId: 'formId' }
    } as unknown as Request;

    readdir.mockResolvedValue(['formId.json']);
    readFile.mockResolvedValue('{"formId": "formId"}');

    await configLoader(req, {} as any, () => undefined);

    const modifiedRequest = req as FormConfigRequest;
    expect(modifiedRequest.formConfig).toEqual({ formId: 'formId' });
  });
  it('fails if no formId is provided', async () => {
    const req: Request = {
      params: {}
    } as unknown as Request;

    const next = jest.fn();

    await configLoader(req, {} as any, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
  it('fails if the form config is not found', async () => {
    const req: Request = {
      params: { formId: 'formId' }
    } as unknown as Request;

    readdir.mockResolvedValue(['foo.json']);
    const next = jest.fn();

    await configLoader(req, {} as any, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
