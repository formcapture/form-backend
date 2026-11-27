import { JSONEditor } from '@json-editor/json-editor';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RECEIVE_EVENTS, SEND_EVENTS } from '../../constants/events';
import { registerCustomEditors } from '../../util/registerEditors';

registerCustomEditors();

const point = { type: 'Point', coordinates: [1, 2] };

const createEditor = async (locSchema: object = {}, loc: any = null) => {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const editor = new JSONEditor(el, {
    theme: 'bootstrap5',
    schema: {
      type: 'object',
      editable: true,
      idColumn: 'id',
      properties: {
        id: { type: 'integer' },
        loc: { type: 'string', format: 'location', ...locSchema }
      }
    },
    startval: { id: 3, loc }
  });
  await new Promise(resolve => editor.on('ready', resolve));
  return editor.getEditor('root.loc');
};

const dispatch = (type: string, columnId: string, origin = window.origin) => {
  window.dispatchEvent(new MessageEvent('message', { data: { type, payload: { columnId } }, origin }));
};

const button = (loc: any, id: string): HTMLButtonElement => loc.formButtons.querySelector(`#${id}-loc`);

describe('<Location />', () => {
  let postMessageSpy: any;

  beforeEach(() => {
    postMessageSpy = vi.spyOn(window, 'postMessage').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('renders the location buttons', async () => {
    const loc = await createEditor();
    expect(loc.constructor.name).toBe('Location');
    expect(button(loc, 'start-locate')).not.toBeNull();
    expect(button(loc, 'start-modify-location')).not.toBeNull();
    expect(button(loc, 'stop-modify-location').style.display).toBe('none');
    expect(loc.description.textContent).toBe('Standort ermitteln und bearbeiten.');
  });

  it('renders no buttons if readOnly and can still set a value', async () => {
    const loc = await createEditor({ readOnly: true, description: 'Nur lesen' });
    expect(loc.formButtons).toBeUndefined();
    expect(loc.input.disabled).toBe(true);
    expect(loc.description.textContent).toBe('Nur lesen');

    loc.setValue(point);
    expect(loc.input.value).toBe(JSON.stringify(point));
  });

  it('sets object, string and empty values', async () => {
    const loc = await createEditor();
    const indicator = loc.geometryIndicator.querySelector('i');

    loc.setValue(point);
    expect(loc.input.value).toBe(JSON.stringify(point));
    expect(indicator.classList.contains('fb-geom-indicator-valid')).toBe(true);
    expect(button(loc, 'zoom-to-feature').style.display).toBe('inline');

    loc.setValue('abc');
    expect(loc.input.value).toBe('abc');

    loc.setValue(null);
    expect(loc.input.value).toBe('');
    expect(indicator.classList.contains('fb-geom-indicator-valid')).toBe(false);
    expect(button(loc, 'zoom-to-feature').style.display).toBe('none');
  });

  it('starts locating and resets after locating stopped', async () => {
    const loc = await createEditor();
    button(loc, 'start-locate').click();

    expect(button(loc, 'start-locate').hasAttribute('disabled')).toBe(true);
    expect(loc.input.readOnly).toBe(true);
    expect(postMessageSpy).toHaveBeenCalledWith({
      type: SEND_EVENTS.startLocating,
      payload: { columnId: 'loc', itemId: 3 }
    }, window.origin);

    dispatch(RECEIVE_EVENTS.locatingStopped, 'other');
    dispatch(RECEIVE_EVENTS.locatingStopped, 'loc', 'https://evil.example');
    expect(button(loc, 'start-locate').hasAttribute('disabled')).toBe(true);

    dispatch(RECEIVE_EVENTS.locatingStopped, 'loc');
    expect(button(loc, 'start-locate').hasAttribute('disabled')).toBe(false);
    expect(loc.input.readOnly).toBe(false);

    // listener is removed after locating stopped
    const onLocatingStoppedSpy = vi.spyOn(loc, 'onLocatingStopped');
    dispatch(RECEIVE_EVENTS.locatingStopped, 'loc');
    expect(onLocatingStoppedSpy).not.toHaveBeenCalled();
  });

  it('starts and stops modifying', async () => {
    const loc = await createEditor({}, point);
    button(loc, 'start-modify-location').click();

    expect(button(loc, 'start-modify-location').style.display).toBe('none');
    expect(button(loc, 'stop-modify-location').style.display).toBe('inline');
    expect(button(loc, 'start-locate').disabled).toBe(true);
    expect(button(loc, 'zoom-to-feature').disabled).toBe(true);
    expect(postMessageSpy).toHaveBeenCalledWith({
      type: SEND_EVENTS.startModify,
      payload: { itemId: 3, columnId: 'loc', geom: point }
    }, window.origin);

    button(loc, 'stop-modify-location').click();
    expect(button(loc, 'start-modify-location').style.display).toBe('inline');
    expect(button(loc, 'stop-modify-location').style.display).toBe('none');
    expect(button(loc, 'start-locate').disabled).toBe(false);
    expect(loc.input.readOnly).toBe(false);
    expect(postMessageSpy).toHaveBeenLastCalledWith({
      type: SEND_EVENTS.stopModify,
      payload: { columnId: 'loc', itemId: 3 }
    }, window.origin);
  });

  it('resets the modify buttons when modifying was stopped externally', async () => {
    const loc = await createEditor();
    button(loc, 'start-modify-location').click();

    dispatch('unknown', 'loc');
    expect(button(loc, 'stop-modify-location').style.display).toBe('inline');

    dispatch(RECEIVE_EVENTS.locationModifyStopped, 'loc');
    expect(button(loc, 'start-modify-location').style.display).toBe('inline');
    expect(button(loc, 'stop-modify-location').style.display).toBe('none');
  });

  it('sends zoomToFeature on zoom click', async () => {
    const loc = await createEditor({}, point);
    button(loc, 'zoom-to-feature').click();
    expect(postMessageSpy).toHaveBeenCalledWith({
      type: SEND_EVENTS.zoomToFeature,
      payload: [{ columnId: 'loc', itemId: 3, geom: point }]
    }, window.origin);
  });
});
