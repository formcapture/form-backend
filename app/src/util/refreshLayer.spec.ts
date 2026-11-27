import { afterEach, describe, expect, it, vi } from 'vitest';

import { SEND_EVENTS } from '../constants/events';

import { refreshLayers } from './refreshLayer';

describe('refreshLayers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a refresh message per layer', () => {
    const postMessageSpy = vi.spyOn(window, 'postMessage').mockImplementation(() => undefined);
    refreshLayers(['a', 'b']);
    expect(postMessageSpy).toHaveBeenCalledTimes(2);
    expect(postMessageSpy).toHaveBeenCalledWith({ type: SEND_EVENTS.refreshLayer, payload: 'a' }, window.origin);
    expect(postMessageSpy).toHaveBeenCalledWith({ type: SEND_EVENTS.refreshLayer, payload: 'b' }, window.origin);
  });

  it('sends nothing without layers', () => {
    const postMessageSpy = vi.spyOn(window, 'postMessage').mockImplementation(() => undefined);
    refreshLayers(undefined as unknown as string[]);
    expect(postMessageSpy).not.toHaveBeenCalled();
  });
});
