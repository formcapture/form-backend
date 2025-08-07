import { AbstractEditor } from '@json-editor/json-editor/src/editor';
import { Feature } from 'geojson';

import { RECEIVE_EVENTS, SEND_EVENTS } from '../../constants/events';
import { getItemId, isLineString, isPoint, isPolygon } from '../../util/jsonEditor';
import { receiveMessage, sendMessage } from '../../util/postMessage';

import './GeometryEditor.css';

export class GeometryEditor extends AbstractEditor {
  constructor(options: any, defaults: any, depth: any) {
    super(options, defaults);

    this.currentDepth = depth;

    this.internalMap = this.options.jsoneditor?.options?.internalMap;

    this.listenerRegistered = false;
  }

  postMessageListener(evt: MessageEvent) {
    const message = receiveMessage(window.parent, evt);
    if (!message) {
      return;
    }

    const evtType = evt?.data?.type;
    const evtPayload = evt?.data?.payload;

    switch (evtType) {
      // embedit/endDrawing will be handled by ItemView
      case RECEIVE_EVENTS.drawingStarted:
        this.onDrawStart(evtPayload.columnId);
        break;
      case RECEIVE_EVENTS.drawingStopped:
        this.onDrawStop(evtPayload.columnId);
        break;
      default:
        break;
    }
  }

  registerListener() {
    if (!this.listenerRegistered) {
      window.addEventListener('message', this.postMessageListener.bind(this));
      this.listenerRegistered = true;
    }
  }

  unregisterListener() {
    window.removeEventListener('message', this.postMessageListener.bind(this));
    this.listenerRegistered = false;
  }

  onDrawStart(columnId: string) {
    if (columnId !== this.key) {
      // Use case: A new drawing interactions has started for another input field (id).
      // This instance ends the drawing mode for itself.
      this.endDrawing();
    }
  }

  onDrawStop(columnId: string) {
    if (columnId === this.key) {
      this.endDrawing();
    }
  }

  onDrawEnd(feature: Feature) {
    if (feature) {
      this.setValue(feature.geometry);
    }
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

  getGeometryType(format: any): string {
    if (isPoint(format)) {
      return 'Point';
    }
    if (isLineString(format)) {
      return 'LineString';
    }
    if (isPolygon(format)) {
      return 'Polygon';
    }
    return 'Point';
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

    this.geometryType = this.getGeometryType(this.schema.format);

    if (!this.schema.readOnly) {
      this.formButtons = this.createButtons();
    }

    this.control = this.theme.getFormControl(this.label, this.input, this.description, undefined, this.formname);

    this.geometryIndicator = this.createGeometryIndicator();
    this.control.insertBefore(this.geometryIndicator, this.input);

    this.container.appendChild(this.control);
    if (this.formButtons) {
      this.container.appendChild(this.formButtons);
    }
  }

  /**
   * Creates and returns a div element containing "Start Drawing" and "Stop Drawing" buttons.
   * The buttons trigger drawing actions and are styled for proper positioning.
   *
   * @returns A div containing the start and end draw buttons.
   */
  createButtons() {
    // Create start and end draw buttons
    const [startDrawButton, endDrawButton] = ['Zeichnen starten', 'Zeichnen beenden']
      .map(label => {
        const icon = document.createElement('i');
        icon.classList.add('bi', 'bi-pencil');
        return this.theme.getFormButton(label, icon);
      });

    startDrawButton.id = `start-draw-${this.key}`;
    endDrawButton.id = `end-draw-${this.key}`;
    endDrawButton.style.display = 'none';
    startDrawButton.style.display = 'inline';

    const zoomToFeatureButton = this.createZoomToFeatureButton();
    zoomToFeatureButton.id = `zoom-to-feature-${this.key}`;
    zoomToFeatureButton.style.display = 'none';
    zoomToFeatureButton['data-toggle'] = 'tooltip';
    zoomToFeatureButton.title = 'Auf Geometrie zoomen';

    // Apply button actions
    startDrawButton.onclick = this.onStartDrawClick.bind(this);
    endDrawButton.onclick = this.onEndDrawClick.bind(this);
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
    formButtons.append(startDrawButton, endDrawButton, zoomToFeatureButton);

    return formButtons;
  }

  createZoomToFeatureButton() {
    const icon = document.createElement('i');
    icon.classList.add('bi', 'bi-search');
    return this.theme.getFormButton('', icon);
  }

  onStartDrawClick() {
    const endDrawButton = this.formButtons.querySelector(`#end-draw-${this.key}`);
    const startDrawButton = this.formButtons.querySelector(`#start-draw-${this.key}`);

    if (endDrawButton) {
      endDrawButton.style.display = 'inline';
    }
    if (startDrawButton) {
      startDrawButton.style.display = 'none';
    }
    this.input.readOnly = true;
    this.setZoomButtonActiveState(true);
    this.registerListener();
    sendMessage(
      window.parent,
      SEND_EVENTS.startDrawing,
      {
        columnId: this.key,
        itemId: getItemId(this),
        geom: this.value,
        geomType: this.geometryType
      }
    );
  }

  onEndDrawClick() {
    this.endDrawing();
    sendMessage(window.parent, SEND_EVENTS.stopDrawing);
  }

  endDrawing() {
    const endDrawButton = this.formButtons.querySelector(`#end-draw-${this.key}`);
    const startDrawButton = this.formButtons.querySelector(`#start-draw-${this.key}`);

    if (endDrawButton) {
      endDrawButton.style.display = 'none';
    }
    if (startDrawButton) {
      startDrawButton.style.display = 'inline';
    }

    this.input.readOnly = false;
    this.setZoomButtonActiveState(false);
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

export default GeometryEditor;
