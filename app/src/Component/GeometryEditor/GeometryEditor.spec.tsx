import { JSONEditor } from '@json-editor/json-editor';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RECEIVE_EVENTS, SEND_EVENTS } from '../../constants/events';
import { registerCustomEditors } from '../../util/registerEditors';

registerCustomEditors();

const polygon = { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] };

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
        geom: { type: 'string', format: 'geometry(Polygon)', ...geomSchema }
      }
    },
    startval: { id: 5, geom }
  });
  await new Promise(resolve => editor.on('ready', resolve));
  return editor.getEditor('root.geom');
};

const dispatch = (type: string, columnId: string, origin = window.origin) => {
  window.dispatchEvent(new MessageEvent('message', { data: { type, payload: { columnId } }, origin }));
};

const button = (geom: any, id: string): HTMLButtonElement => geom.formButtons.querySelector(`#${id}-geom`);

describe('<GeometryEditor />', () => {
  let postMessageSpy: any;

  beforeEach(() => {
    postMessageSpy = vi.spyOn(window, 'postMessage').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('renders the draw buttons if the parent is editable', async () => {
    const geom = await createEditor();
    expect(button(geom, 'start-draw').style.display).toBe('inline');
    expect(button(geom, 'end-draw').style.display).toBe('none');
    expect(button(geom, 'zoom-to-feature').style.display).toBe('none');
  });

  it('renders no buttons if the parent is not editable', async () => {
    const geom = await createEditor({}, false);
    expect(geom.formButtons).toBeUndefined();
  });

  it('renders no buttons and disables the input if readOnly', async () => {
    const geom = await createEditor({ readOnly: true });
    expect(geom.formButtons).toBeUndefined();
    expect(geom.input.disabled).toBe(true);
    expect(geom.description.textContent).toBe('');
  });

  it('shows the default description', async () => {
    const geom = await createEditor();
    expect(geom.description.textContent).toBe('Bitte geben Sie eine GeoJSON Geometrie ein.');
  });

  it('shows a configured description', async () => {
    const geom = await createEditor({ description: 'Meine Beschreibung' });
    expect(geom.description.textContent).toBe('Meine Beschreibung');
  });

  it('sets object, string and empty values', async () => {
    const geom = await createEditor();
    const indicator = geom.geometryIndicator.querySelector('i');

    geom.setValue(polygon);
    expect(geom.input.value).toBe(JSON.stringify(polygon));
    expect(indicator.classList.contains('fb-geom-indicator-valid')).toBe(true);
    expect(button(geom, 'zoom-to-feature').style.display).toBe('inline');

    geom.setValue('{"type":"Point"}');
    expect(geom.input.value).toBe('{"type":"Point"}');

    geom.setValue(null);
    expect(geom.input.value).toBe('');
    expect(indicator.classList.contains('fb-geom-indicator-valid')).toBe(false);
    expect(button(geom, 'zoom-to-feature').style.display).toBe('none');
  });

  it('starts drawing', async () => {
    const geom = await createEditor({}, true, polygon);
    button(geom, 'start-draw').click();

    expect(button(geom, 'start-draw').style.display).toBe('none');
    expect(button(geom, 'end-draw').style.display).toBe('inline');
    expect(button(geom, 'zoom-to-feature').disabled).toBe(true);
    expect(geom.input.readOnly).toBe(true);
    expect(postMessageSpy).toHaveBeenCalledWith({
      type: SEND_EVENTS.startDrawing,
      payload: { columnId: 'geom', itemId: 5, geom: polygon, geomType: 'Polygon' }
    }, window.origin);
  });

  it('stops drawing on click and removes its message listener', async () => {
    const geom = await createEditor();
    button(geom, 'start-draw').click();
    button(geom, 'end-draw').click();

    expect(button(geom, 'start-draw').style.display).toBe('inline');
    expect(button(geom, 'end-draw').style.display).toBe('none');
    expect(geom.input.readOnly).toBe(false);
    expect(postMessageSpy).toHaveBeenLastCalledWith({ type: SEND_EVENTS.stopDrawing }, window.origin);

    const endDrawingSpy = vi.spyOn(geom, 'endDrawing');
    dispatch(RECEIVE_EVENTS.drawingStopped, 'geom');
    expect(endDrawingSpy).not.toHaveBeenCalled();
  });

  it('stops drawing when drawing starts for another column', async () => {
    const geom = await createEditor();
    button(geom, 'start-draw').click();
    const endDrawingSpy = vi.spyOn(geom, 'endDrawing');

    dispatch(RECEIVE_EVENTS.drawingStarted, 'geom');
    expect(endDrawingSpy).not.toHaveBeenCalled();

    dispatch(RECEIVE_EVENTS.drawingStarted, 'other');
    expect(endDrawingSpy).toHaveBeenCalledTimes(1);
  });

  it('stops drawing when drawing was stopped for its own column', async () => {
    const geom = await createEditor();
    button(geom, 'start-draw').click();
    const endDrawingSpy = vi.spyOn(geom, 'endDrawing');

    dispatch(RECEIVE_EVENTS.drawingStopped, 'other');
    dispatch('unknown', 'geom');
    dispatch(RECEIVE_EVENTS.drawingStopped, 'geom', 'https://evil.example');
    expect(endDrawingSpy).not.toHaveBeenCalled();

    dispatch(RECEIVE_EVENTS.drawingStopped, 'geom');
    expect(endDrawingSpy).toHaveBeenCalledTimes(1);
  });

  it('sends zoomToFeature on zoom click', async () => {
    const geom = await createEditor({}, true, polygon);
    button(geom, 'zoom-to-feature').click();
    expect(postMessageSpy).toHaveBeenCalledWith({
      type: SEND_EVENTS.zoomToFeature,
      payload: [{ itemId: 5, columnId: 'geom', geom: polygon }]
    }, window.origin);
  });

  it('sets the value of a drawn feature', async () => {
    const geom = await createEditor();
    geom.onDrawEnd(undefined);
    expect(geom.value).toBeFalsy();
    geom.onDrawEnd({ type: 'Feature', geometry: polygon, properties: {} });
    expect(geom.value).toEqual(polygon);
  });

  it.each([
    ['geometry(Point)', 'Point'],
    ['geometry(LineString)', 'LineString'],
    ['geometry(Polygon)', 'Polygon'],
    ['geometry', 'Point'],
    ['foo', 'Point']
  ])('maps format %s to geometry type %s', async (format, expected) => {
    const geom = await createEditor();
    expect(geom.getGeometryType(format)).toBe(expected);
  });
});
