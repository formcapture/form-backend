import { Base64Editor } from '@json-editor/json-editor/src/editors/base64';
import mimeTypes from 'mime';

import { getKeycloakInst } from '../../singletons/keycloak';
import api from '../../util/api';
import { createFileIdentifierFromPath } from '../../util/file';

export class FileEditor extends Base64Editor {
  build () {
    if (!this.options.compact) {
      this.title = this.header = this.label = this.theme.getFormInputLabel(this.getTitle(), this.isRequired());
    }
    if (this.options.infoText) {
      this.infoButton = this.theme.getInfoButton(this.translateProperty(this.options.infoText));
    }

    /* Input that holds the base64 string */
    this.input = this.theme.getFormInputField('hidden');
    this.container.appendChild(this.input);

    /* Don't show uploader if this is readonly */
    if (!this.schema.readOnly && !this.schema.readonly) {
      if (!window.FileReader) {
        throw new Error('FileReader required for file editor');
      }

      /* File uploader */
      this.uploader = this.theme.getFormInputField('file');
      this.uploader.style.display = 'none';
      if (this.options.mime_type) {
        let optionsMimeTypes = this.options.mime_type;
        if (Array.isArray(this.options.mime_type)) {
          optionsMimeTypes = this.options.mime_type.join(',');
        }
        this.uploader.setAttribute('accept', optionsMimeTypes);
      }

      this.uploader.addEventListener('change', (e: Event) => {
        e.preventDefault();
        e.stopPropagation();

        const target = e.currentTarget as HTMLInputElement;

        if (target.files && target.files.length) {
          let fr: FileReader | null = new FileReader();
          fr.onload = (evt) => {
            this.value = evt.target?.result;
            this.refreshPreview();
            this.onChange(true);
            fr = null;
          };
          const file = target.files[0];
          if (!this.isValidMimeType(file.type)) {
            this.theme.addInputError(
              this.uploader,
              `${this.translate('upload_wrong_file_format')} ${this.options.mime_type}`
            );
            return;
          }
          if (this.options.max_upload_size && file.size > this.options.max_upload_size) {
            this.theme.addInputError(
              this.uploader,
              `${this.translate('upload_max_size')} ${this.formatBytes(this.options.max_upload_size)}`
            );
            return;
          }
          this.theme.removeInputError(this.uploader);
          fr.readAsDataURL(file);
        }
      });
    }

    const description = this.getDescription();
    this.preview = this.theme.getFormInputDescription(description);
    this.container.appendChild(this.preview);

    this.control = this.theme.getFormControl(this.label, this.uploader || this.input, this.preview, this.infoButton);
    this.container.appendChild(this.control);

    const uploadButton = this.getButton('button_upload', 'upload', 'button_upload');

    uploadButton.addEventListener('click', () => {
      this.uploader.click();
    });

    this.control.appendChild(uploadButton);

    window.requestAnimationFrame(() => {
      this.theme.afterInputReady(this.uploader);
    });
  }

  async refreshPreview() {
    if (this.last_preview === this.value) {
      return;
    }
    // eslint-disable-next-line camelcase
    this.last_preview = this.value;

    const mainContainer = document.createElement('div');
    const fileNameContainer = document.createElement('div');
    fileNameContainer.classList.add('formbackend-file-name-container');
    mainContainer.appendChild(fileNameContainer);
    const descriptionContainer = document.createElement('div');
    const description = this.getDescription();
    descriptionContainer.innerHTML = this.translateProperty(description);
    mainContainer.appendChild(descriptionContainer);
    const metadataContainer = document.createElement('div');
    mainContainer.appendChild(metadataContainer);
    const previewContainer = document.createElement('div');
    mainContainer.appendChild(previewContainer);

    const fileNameEl = document.createElement('span');
    fileNameEl.classList.add('formbackend-file-name');
    fileNameContainer.appendChild(fileNameEl);

    this.preview.innerHTML = '';
    this.preview.appendChild(mainContainer);

    if (!this.value) {
      return;
    }

    const removeButton = document.createElement('button');
    removeButton.classList.add('btn', 'btn-secondary', 'btn-sm');
    removeButton.style.marginLeft = '5px';
    removeButton.innerHTML = '<i class="bi bi-trash3"></i> Entfernen';
    removeButton.addEventListener('click', (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      this.theme.removeInputError(this.uploader);
      this.resetInput();
    });

    if (this.schema.readOnly || this.schema.readonly) {
      removeButton.style.display = 'none';
    }
    fileNameContainer.appendChild(removeButton);

    if (this.isFileIdentifier()) {
      await this.previewUploadedFile(fileNameEl, previewContainer);
    } else {
      this.previewSelectedFile(fileNameEl, metadataContainer, previewContainer);
    }
  }

  formatBytes(bytes: number) {
    // taken from upload editor
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const unit = units[i];
    const formattedSize = `${parseFloat((bytes / (1024 ** i)).toFixed(1))} ${unit}`;
    return formattedSize;
  }

  isValidMimeType(mimeType: string) {
    if (!this.options.mime_type) {
      return true;
    }
    if (Array.isArray(this.options.mime_type)) {
      return this.options.mime_type.includes(mimeType);
    }
    return this.options.mime_type === mimeType;
  }

  resetInput() {
    this.setValue('');
    this.onChange(true);
  }

  getDescription() {
    let description = this.translateProperty(this.schema.description);
    if (this.options.max_upload_size) {
      description = `${description ?? ''} ${this.translate('upload_max_size_info')} \
      ${this.formatBytes(this.options.max_upload_size)}`;
    }
    return description ?? '';
  }

  isFileIdentifier() {
    const fileIdentifierTest = createFileIdentifierFromPath(this.path);
    const regexp = new RegExp(`^${fileIdentifierTest}/${this.key}_.+\\..+`);
    return regexp.test(this.value);
  }

  async previewUploadedFile(fileNameEl: HTMLElement, previewContainer: HTMLElement) {
    fileNameEl.innerHTML = this.value;
    const mime = mimeTypes.getType(this.value);
    if (!mime || !mime.startsWith('image/')) {
      return;
    }
    const preview = await this.createImagePreview();
    previewContainer.appendChild(preview);
  }

  async createImagePreview() {
    const img = document.createElement('img');
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100px';
    try {
      const keycloak = getKeycloakInst();
      const response = await api.fetchFile(this.value, keycloak);
      if (!response.ok) {
        return img;
      }
      const blob = await response.blob();
      img.src = URL.createObjectURL(blob);
    } catch (err) {
      console.error(err);
    }
    return img;
  }

  previewSelectedFile(fileNameEl: HTMLElement, metadataContainer: HTMLElement, previewContainer: HTMLElement) {
    let mime = this.value.match(/^data:([^;,]+)[;,]/);
    if (mime) {
      mime = mime[1];
    }
    const fullFileName = this.uploader?.value;
    const fileName = fullFileName ? fullFileName.split('\\').pop() : undefined;
    const bytes = Math.floor((this.value.length - this.value.split(',')[0].length - 1) / 1.33333);
    const formattedSize = this.formatBytes(bytes);
    if (fileName) {
      fileNameEl.innerHTML = fileName;
    }
    metadataContainer.innerHTML = `<strong>Typ:</strong> ${mime} <strong>Größe:</strong> ~${formattedSize}`;
    if (mime.substr(0, 5) === 'image') {
      const img = document.createElement('img');
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100px';
      img.src = this.value;
      previewContainer.appendChild(img);
    }
  }
}

export default FileEditor;
