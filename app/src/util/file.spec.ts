import { describe, expect, it } from 'vitest';

import { createFileIdentifierFromPath } from './file';

describe('createFileIdentifierFromPath', () => {
  it('removes the last part and array indices of the path', () => {
    expect(createFileIdentifierFromPath('root.file')).toBe('root');
    expect(createFileIdentifierFromPath('form1.files.0.doc')).toBe('form1/files');
  });
});
