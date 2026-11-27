import { describe, expect, it } from 'vitest';

import { receiveMessage } from './postMessage';

describe('receiveMessage', () => {
  it('returns messages from the same origin only', () => {
    const own = new MessageEvent('message', { data: 'a', origin: window.origin });
    const foreign = new MessageEvent('message', { data: 'a', origin: 'https://evil.example' });
    expect(receiveMessage(window, own)).toBe(own);
    expect(receiveMessage(window, foreign)).toBeUndefined();
  });
});
