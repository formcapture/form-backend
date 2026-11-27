/* eslint-disable camelcase */ // json-editor option names
import { JSONEditor } from '@json-editor/json-editor';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Logger from '@terrestris/base-util/dist/Logger';

import api from '../../util/api';
import { registerCustomEditors } from '../../util/registerEditors';

vi.mock('../../util/api', () => ({
  default: {
    fetchFile: vi.fn()
  }
}));

registerCustomEditors();

const pngDataUrl = 'data:image/png;base64,iVBORw0KGgo=';

const createEditor = async (fileSchema: object = {}, file: any = null) => {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const editor = new JSONEditor(el, {
    theme: 'bootstrap5',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', media: { binaryEncoding: 'base64' }, ...fileSchema }
      }
    },
    startval: { file }
  });
  await new Promise(resolve => editor.on('ready', resolve));
  return editor.getEditor('root.file');
};

const upload = (fileEditor: any, file: File) => {
  Object.defineProperty(fileEditor.uploader, 'files', { value: [file], configurable: true });
  fileEditor.uploader.dispatchEvent(new Event('change'));
};

describe('<FileEditor />', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('is resolved for base64 strings and renders a hidden uploader', async () => {
    const fileEditor = await createEditor({ options: { mime_type: ['image/png', 'image/jpeg'] } });
    expect(fileEditor.constructor.name).toBe('FileEditor');
    expect(fileEditor.uploader.style.display).toBe('none');
    expect(fileEditor.uploader.getAttribute('accept')).toBe('image/png,image/jpeg');
  });

  it('renders no uploader, no upload button and hides the remove button if readOnly', async () => {
    const afterInputReadySpy = vi.spyOn(JSONEditor.defaults.themes.bootstrap5.prototype, 'afterInputReady');
    const fileEditor = await createEditor({ readOnly: true }, pngDataUrl);
    await new Promise(resolve => window.requestAnimationFrame(resolve));

    expect(fileEditor.uploader).toBeUndefined();
    expect(fileEditor.control.querySelector('.json-editor-btn-upload')).toBeNull();
    expect(afterInputReadySpy).not.toHaveBeenCalledWith(undefined);
    const removeButton = fileEditor.preview.querySelector('button');
    expect(removeButton.style.display).toBe('none');
  });

  it('formats bytes', async () => {
    const fileEditor = await createEditor();
    expect(fileEditor.formatBytes(0)).toBe('0 Bytes');
    expect(fileEditor.formatBytes(500)).toBe('500 Bytes');
    expect(fileEditor.formatBytes(1536)).toBe('1.5 KB');
    expect(fileEditor.formatBytes(5 * 1024 ** 2)).toBe('5 MB');
  });

  it('validates mime types', async () => {
    expect((await createEditor()).isValidMimeType('text/plain')).toBe(true);
    const single = await createEditor({ options: { mime_type: 'image/png' } });
    expect(single.isValidMimeType('image/png')).toBe(true);
    expect(single.isValidMimeType('text/plain')).toBe(false);
    const list = await createEditor({ options: { mime_type: ['image/png', 'image/jpeg'] } });
    expect(list.isValidMimeType('image/jpeg')).toBe(true);
    expect(list.isValidMimeType('text/plain')).toBe(false);
  });

  it('adds the max upload size to the description', async () => {
    const fileEditor = await createEditor({ description: 'Ein Bild', options: { max_upload_size: 2048 } });
    expect(fileEditor.getDescription()).toMatch(/^Ein Bild Maximale Größe: .*2 KB$/s);
    expect((await createEditor()).getDescription()).toBe('');
  });

  it('rejects files with a wrong mime type', async () => {
    const fileEditor = await createEditor({ options: { mime_type: 'image/png' } });
    upload(fileEditor, new File(['abc'], 'a.txt', { type: 'text/plain' }));
    expect(fileEditor.container.textContent).toContain('Falsches Dateiformat');
    expect(fileEditor.getValue()).toBeFalsy();
  });

  it('rejects files that are too large', async () => {
    const fileEditor = await createEditor({ options: { max_upload_size: 2 } });
    upload(fileEditor, new File(['abc'], 'a.txt', { type: 'text/plain' }));
    expect(fileEditor.container.textContent).toContain('Datei zu groß');
    expect(fileEditor.getValue()).toBeFalsy();
  });

  it('reads a valid file and previews it', async () => {
    const fileEditor = await createEditor({ options: { mime_type: 'image/png' } });
    upload(fileEditor, new File(['abc'], 'a.png', { type: 'image/png' }));

    await vi.waitFor(() => expect(fileEditor.getValue()).toMatch(/^data:image\/png;base64,/));
    await vi.waitFor(() => expect(fileEditor.preview.querySelector('img')).not.toBeNull());
    expect(fileEditor.preview.textContent).toContain('image/png');
  });

  it('removes the file on remove click', async () => {
    const fileEditor = await createEditor({}, pngDataUrl);
    const removeButton = fileEditor.preview.querySelector('button');
    removeButton.click();
    expect(fileEditor.getValue()).toBe('');
  });

  it('does not render an image preview for values that are no data urls', async () => {
    const fileEditor = await createEditor({}, 'just-text');
    expect(fileEditor.preview.querySelector('img')).toBeNull();
  });

  it('does not render HTML from the mime type of a data url', async () => {
    const fileEditor = await createEditor({}, 'data:<img src=x onerror=alert(1)>;base64,AAAA');
    expect(fileEditor.preview.querySelector('img[onerror]')).toBeNull();
    expect(fileEditor.preview.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('does not render HTML from the name of an uploaded file', async () => {
    vi.mocked(api.fetchFile).mockResolvedValue(new Response(null, { status: 404 }));
    const fileEditor = await createEditor({}, 'root/file_<img src=x onerror=alert(1)>.png');
    await vi.waitFor(() => expect(fileEditor.preview.textContent).toContain('<img src=x onerror=alert(1)>'));
    expect(fileEditor.preview.querySelector('img[onerror]')).toBeNull();
  });

  it('recognizes file identifiers', async () => {
    const fileEditor = await createEditor();
    fileEditor.value = 'root/file_abc.png';
    expect(fileEditor.isFileIdentifier()).toBe(true);
    fileEditor.value = pngDataUrl;
    expect(fileEditor.isFileIdentifier()).toBe(false);
  });

  it('fetches and previews an uploaded image', async () => {
    vi.mocked(api.fetchFile).mockResolvedValue(new Response(new Blob(['x']), { status: 200 }));
    const fileEditor = await createEditor({}, 'root/file_abc.png');

    await vi.waitFor(() => expect(fileEditor.preview.querySelector('img')?.src).toBe('blob:preview'));
    expect(api.fetchFile).toHaveBeenCalledWith('root/file_abc.png', undefined);
    expect(fileEditor.preview.textContent).toContain('root/file_abc.png');
  });

  it('renders an empty image if fetching the uploaded file fails', async () => {
    vi.mocked(api.fetchFile).mockResolvedValue(new Response(null, { status: 404 }));
    const fileEditor = await createEditor({}, 'root/file_abc.png');

    await vi.waitFor(() => expect(fileEditor.preview.querySelector('img')).not.toBeNull());
    expect(fileEditor.preview.querySelector('img').getAttribute('src')).toBeNull();
  });

  it('logs an error if the image preview cannot be created', async () => {
    const loggerSpy = vi.spyOn(Logger, 'error').mockImplementation(() => undefined);
    vi.mocked(api.fetchFile).mockRejectedValue(new Error('network'));
    await createEditor({}, 'root/file_abc.png');

    await vi.waitFor(() => expect(loggerSpy).toHaveBeenCalled());
  });

  it('does not fetch uploaded files that are no images', async () => {
    const fileEditor = await createEditor({}, 'root/file_abc.pdf');
    expect(api.fetchFile).not.toHaveBeenCalled();
    expect(fileEditor.preview.textContent).toContain('root/file_abc.pdf');
  });
});
