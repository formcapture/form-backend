import { AbstractEditor } from '@json-editor/json-editor/src/editor';

import { RECEIVE_EVENTS, SEND_EVENTS } from '../../constants/events';
import { getItemId } from '../../util/jsonEditor';
import { receiveMessage, sendMessage } from '../../util/postMessage';

import './GeometrySelection.css';

export class GeometrySelection extends AbstractEditor {
  constructor(options: any, defaults: any, depth: any) {
    super(options, defaults);

    this.currentDepth = depth;

    this.internalMap = this.options.jsoneditor?.options?.internalMap;
  }

  postMessageListener(evt: MessageEvent) {
    const message = receiveMessage(window.parent, evt);
    const evtType = evt?.data?.type;
    const payload = evt?.data?.payload;
    const columnId = payload?.columnId;

    if (!message || columnId !== this.key) {
      return;
    }

    switch (evtType) {
      case RECEIVE_EVENTS.selectingStopped:
        this.endSelecting();
        break;
      default:
        break;
    }
  }

  registerListener() {
    window.addEventListener('message', this.postMessageListener.bind(this));
  }

  unregisterListener() {
    window.removeEventListener('message', this.postMessageListener.bind(this));
  }

  setValue(value: any) {
    this.value = value;
    if (value && typeof value !== 'string') {
      this.input.value = JSON.stringify(value);
    } else if (value) {
      this.input.value = value;
    } else {
      this.input.value = '';
    }
    this.updateGeometryIndicator();
    this.updateZoomToFeatureButton(this.value);
    this.onChange(true);
  }

  build() {
    this.label = this.theme.getFormInputLabel(this.getTitle(), this.isRequired());

    const descriptionText = this.schema.description ??
    this.schema.readOnly ? '' : 'Bitte geben Sie eine GeoJSON Geometrie ein.';
    this.description = this.theme.getFormInputDescription(descriptionText);

    // eslint-disable-next-line camelcase
    this.input_type = 'hidden';

    this.input = this.theme.getFormInputField(this.input_type);
    this.input.readOnly = this.schema.readOnly;
    this.input.disabled = this.schema.readOnly;

    if (!this.schema.readOnly) {
      this.formButtons = this.createButtons();
    }

    this.control = this.theme.getFormControl(this.label, this.input, this.description, undefined, this.formname);

    this.container.appendChild(this.control);
    if (this.formButtons) {
      this.container.appendChild(this.formButtons);
    }

    this.geometryIndicator = this.createGeometryIndicator();
    this.control.insertBefore(this.geometryIndicator, this.input);
  }

  /**
   * Creates and returns a div element containing "Start Selecting" and "Stop Selecting" buttons.
   * The buttons trigger selecting actions and are styled for proper positioning.
   *
   * @returns A div containing the start and end selecting buttons.
   */
  createButtons() {
    // Create start and end select buttons
    const [startSelectButton, endSelectButton] = ['Selektion starten', 'Selektion beenden']
      .map(label => {
        const icon = document.createElement('i');
        icon.classList.add('bi', 'bi-cursor');
        return this.theme.getFormButton(label, icon);
      });

    startSelectButton.id = `start-select-${this.key}`;
    endSelectButton.id = `end-select-${this.key}`;
    endSelectButton.style.display = 'none';
    startSelectButton.style.display = 'inline';

    const zoomToFeatureButton = this.createZoomToFeatureButton();
    zoomToFeatureButton.id = `zoom-to-feature-${this.key}`;
    zoomToFeatureButton.style.display = 'none';
    zoomToFeatureButton['data-toggle'] = 'tooltip';
    zoomToFeatureButton.title = 'Auf Geometrie zoomen';

    // Apply button actions
    startSelectButton.onclick = this.onStartSelectClick.bind(this);
    endSelectButton.onclick = this.onEndSelectClick.bind(this);
    zoomToFeatureButton.onclick = this.onZoomToFeatureClick.bind(this);

    // Create a div to wrap buttons and apply styling
    const formButtons = document.createElement('div');
    formButtons.classList.add('form-buttons');
    // TODO improve style for buttons
    Object.assign(formButtons.style, {
      display: 'flex',
      justifyContent: 'flex-start',
      gap: '8px'
    });

    // Append buttons to the wrapper
    formButtons.append(startSelectButton, endSelectButton, zoomToFeatureButton);

    return formButtons;
  }

  createZoomToFeatureButton() {
    const icon = document.createElement('i');
    icon.classList.add('bi', 'bi-search');
    return this.theme.getFormButton('', icon);
  }

  onStartSelectClick() {
    const endSelectButton = this.formButtons.querySelector(`#end-select-${this.key}`);
    const startSelectButton = this.formButtons.querySelector(`#start-select-${this.key}`);

    if (endSelectButton) {
      endSelectButton.style.display = 'inline';
    }
    if (startSelectButton) {
      startSelectButton.style.display = 'none';
    }
    this.input.readOnly = true;
    this.setZoomButtonActiveState(true);
    this.registerListener();
    sendMessage(
      window.parent,
      SEND_EVENTS.startSelecting,
      {
        columnId: this.key,
        itemId: getItemId(this),
        layerId: this.schema.options.layerId
      });
  }

  onEndSelectClick() {
    this.endSelecting();
    sendMessage(window.parent, SEND_EVENTS.stopSelecting);
  }

  endSelecting() {
    const endSelectButton = this.formButtons.querySelector(`#end-select-${this.key}`);
    const startSelectButton = this.formButtons.querySelector(`#start-select-${this.key}`);

    if (endSelectButton) {
      endSelectButton.style.display = 'none';
    }
    if (startSelectButton) {
      startSelectButton.style.display = 'inline';
    }
    this.setZoomButtonActiveState(false);
    this.input.readOnly = false;
    this.unregisterListener();
  }

  createGeometryIndicator() {
    const geometryIndicator = document.createElement('div');
    const indicatorIcon = document.createElement('i');
    indicatorIcon.classList.add('fb-geom-indicator', 'bi', 'bi-bounding-box-circles');
    geometryIndicator.append(indicatorIcon);
    return geometryIndicator;
  }

  updateGeometryIndicator() {
    const geom = this.value;
    const iconEl = this.geometryIndicator.querySelector('i');
    if (geom) {
      iconEl.classList.add('fb-geom-indicator-valid');
    } else {
      iconEl.classList.remove('fb-geom-indicator-valid');
    }
  }

  onZoomToFeatureClick() {
    const feature = {
      itemId: getItemId(this),
      columnId: this.key,
      geom: this.value
    };
    sendMessage(window.parent, SEND_EVENTS.zoomToFeature, [feature]);
  }

  updateZoomToFeatureButton(show: boolean) {
    const zoomToFeatureButton = this.formButtons.querySelector(`#zoom-to-feature-${this.key}`);
    if (zoomToFeatureButton) {
      zoomToFeatureButton.style.display = show ? 'inline' : 'none';
    }
  }

  /**
   * Sets the active state of the zoom-to-feature button.
   *
   * @param {boolean} disabled - Whether the button shall be disabled.
   */
  setZoomButtonActiveState(disabled: boolean): void {
    const zoomToFeatureButton = this.formButtons?.querySelector(`#zoom-to-feature-${this.key}`);

    if (zoomToFeatureButton) {
      zoomToFeatureButton.disabled = disabled;
    }
  }
};

export default GeometrySelection;
