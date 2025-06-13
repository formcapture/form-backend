import path from 'path';

import { Request } from 'express';

import { FormConfigRequest } from '../types/formConfigRequest';

import { formConfigLoader } from './formConfigLoader';

const readdirMock = jest.fn();
const readFileMock = jest.fn();
jest.mock('node:fs/promises', () => ({
  readdir: () => readdirMock(),
  // eslint-disable-next-line prefer-spread
  readFile: (...args: any[]) => readFileMock.apply(null, args)
}));

describe('formConfigLoader', () => {
  const configLoader = formConfigLoader({ formConfigsDir: 'formConfigs' });
  it('loads the form config from the file system', async () => {
    const req: Request = {
      params: { formId: 'formId' }
    } as unknown as Request;

    readdirMock.mockResolvedValue(['formId.json']);

    await configLoader(req, {} as any, () => undefined);

    const expectedPath = path.join(process.cwd(), 'formConfigs/formId.json');
    expect(readFileMock).toHaveBeenCalledWith(expectedPath, { encoding: 'utf-8' });
  });
  it('adds the form config to the request object', async () => {
    const req: Request = {
      params: { formId: 'formId' }
    } as unknown as Request;

    readdirMock.mockResolvedValue(['formId.json']);
    readFileMock.mockResolvedValue('{"formId": "formId"}');

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

    readdirMock.mockResolvedValue(['foo.json']);
    const next = jest.fn();

    await configLoader(req, {} as any, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
