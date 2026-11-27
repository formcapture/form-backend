import { JSONEditor } from '@json-editor/json-editor';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RECEIVE_EVENTS, SEND_EVENTS } from '../../constants/events';
import { registerCustomEditors } from '../../util/registerEditors';

registerCustomEditors();

const point = { type: 'Point', coordinates: [1, 2] };

const createEditor = async (geomSchema: object = {}, editable = true, geom: any = null) => {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const editor = new JSONEditor(el, {
    theme: 'bootstrap5',
    schema: {
      type: 'object',
      editable,
      idColumn: 'id',
      properties: {
        id: { type: 'integer' },
        geom: { type: 'string', format: 'geometrySelection', options: { layerId: 'layer1' }, ...geomSchema }
      }
    },
    startval: { id: 7, geom }
  });
  await new Promise(resolve => editor.on('ready', resolve));
  return editor.getEditor('root.geom');
};

const dispatch = (type: string, columnId: string, origin = window.origin) => {
  window.dispatchEvent(new MessageEvent('message', { data: { type, payload: { columnId } }, origin }));
};

const button = (geom: any, id: string): HTMLButtonElement => geom.formButtons.querySelector(`#${id}-geom`);

describe('<GeometrySelection />', () => {
  let postMessageSpy: any;

  beforeEach(() => {
    postMessageSpy = vi.spyOn(window, 'postMessage').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('is resolved for the geometrySelection format', async () => {
    const geom = await createEditor();
    expect(geom.constructor.name).toBe('GeometrySelection');
  });

  it('renders the select buttons if the parent is editable', async () => {
    const geom = await createEditor();
    expect(button(geom, 'start-select').style.display).toBe('inline');
    expect(button(geom, 'end-select').style.display).toBe('none');
  });

  it('renders no buttons if readOnly or the parent is not editable', async () => {
    expect((await createEditor({}, false)).formButtons).toBeUndefined();
    const readOnly = await createEditor({ readOnly: true });
    expect(readOnly.formButtons).toBeUndefined();
    expect(readOnly.input.disabled).toBe(true);
  });

  it('shows the default or a configured description', async () => {
    expect((await createEditor()).description.textContent).toBe('Bitte geben Sie eine GeoJSON Geometrie ein.');
    expect((await createEditor({ description: 'Auswahl' })).description.textContent).toBe('Auswahl');
  });

  it('sets object, string and empty values', async () => {
    const geom = await createEditor();
    const indicator = geom.geometryIndicator.querySelector('i');

    geom.setValue(point);
    expect(geom.input.value).toBe(JSON.stringify(point));
    expect(indicator.classList.contains('fb-geom-indicator-valid')).toBe(true);
    expect(button(geom, 'zoom-to-feature').style.display).toBe('inline');

    geom.setValue('abc');
    expect(geom.input.value).toBe('abc');

    geom.setValue(undefined);
    expect(geom.input.value).toBe('');
    expect(indicator.classList.contains('fb-geom-indicator-valid')).toBe(false);
  });

  it('starts selecting with the configured layer', async () => {
    const geom = await createEditor();
    button(geom, 'start-select').click();

    expect(button(geom, 'start-select').style.display).toBe('none');
    expect(button(geom, 'end-select').style.display).toBe('inline');
    expect(button(geom, 'zoom-to-feature').disabled).toBe(true);
    expect(geom.input.readOnly).toBe(true);
    expect(postMessageSpy).toHaveBeenCalledWith({
      type: SEND_EVENTS.startSelecting,
      payload: { columnId: 'geom', itemId: 7, layerId: 'layer1' }
    }, window.origin);
  });

  it('stops selecting on click and removes its message listener', async () => {
    const geom = await createEditor();
    button(geom, 'start-select').click();
    button(geom, 'end-select').click();

    expect(button(geom, 'start-select').style.display).toBe('inline');
    expect(geom.input.readOnly).toBe(false);
    expect(postMessageSpy).toHaveBeenLastCalledWith({ type: SEND_EVENTS.stopSelecting }, window.origin);

    const endSelectingSpy = vi.spyOn(geom, 'endSelecting');
    dispatch(RECEIVE_EVENTS.selectingStopped, 'geom');
    expect(endSelectingSpy).not.toHaveBeenCalled();
  });

  it('stops selecting when selecting was stopped for its own column only', async () => {
    const geom = await createEditor();
    button(geom, 'start-select').click();
    const endSelectingSpy = vi.spyOn(geom, 'endSelecting');

    dispatch(RECEIVE_EVENTS.selectingStopped, 'other');
    dispatch('unknown', 'geom');
    dispatch(RECEIVE_EVENTS.selectingStopped, 'geom', 'https://evil.example');
    expect(endSelectingSpy).not.toHaveBeenCalled();

    dispatch(RECEIVE_EVENTS.selectingStopped, 'geom');
    expect(endSelectingSpy).toHaveBeenCalledTimes(1);
  });

  it('sends zoomToFeature on zoom click', async () => {
    const geom = await createEditor({}, true, point);
    button(geom, 'zoom-to-feature').click();
    expect(postMessageSpy).toHaveBeenCalledWith({
      type: SEND_EVENTS.zoomToFeature,
      payload: [{ itemId: 7, columnId: 'geom', geom: point }]
    }, window.origin);
  });
});
