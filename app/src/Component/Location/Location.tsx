import { AbstractEditor } from '@json-editor/json-editor/src/editor';

import { RECEIVE_EVENTS, SEND_EVENTS } from '../../constants/events';
import { getItemId } from '../../util/jsonEditor';
import { receiveMessage, sendMessage } from '../../util/postMessage';

import './Location.css';

export class Location extends AbstractEditor {
  /**
   * Constructs the Location editor.
   *
   * @param {object} options - Editor options.
   * @param {object} defaults - Default editor settings.
   * @param {number} currentDepth - Current depth of the editor hierarchy.
   */
  constructor(options: any, defaults: any, depth: number) {
    super(options, defaults);
    this.currentDepth = depth;
    this.internalMap = options?.jsoneditor?.options?.internalMap;
  }

  /**
   * Sets the value of the editor and updates the input field.
   *
   * @param {any} value - Value to set in the editor.
   */
  setValue(value: any): void {
    this.value = value;
    this.input.value = value && typeof value !== 'string' ? JSON.stringify(value) : value || '';
    this.updateGeometryIndicator();
    this.updateZoomToFeatureButton(this.value);
    this.onChange(true);
  }

  /**
   * Builds the editor UI including input field, label, description, and buttons.
   */
  build(): void {
    const {description, readOnly} = this.schema;
    const descriptionText = description || (readOnly ? '' : 'Standort ermitteln und bearbeiten.');

    this.label = this.theme.getFormInputLabel(this.getTitle(), this.isRequired());
    this.description = this.theme.getFormInputDescription(descriptionText);

    this.input = this.theme.getFormInputField('hidden') as HTMLInputElement;
    this.input.readOnly = this.input.disabled = readOnly;

    this.control = this.theme.getFormControl(this.label, this.input, this.description, undefined, this.formname);
    this.container.appendChild(this.control);

    if (!readOnly) {
      this.formButtons = this.createButtons();
      this.container.appendChild(this.formButtons);
    }

    this.geometryIndicator = this.createGeometryIndicator();
    this.control.insertBefore(this.geometryIndicator, this.input);
  }

  /**
   * Creates buttons for locating and modifying location.
   *
   * @returns {HTMLDivElement} A div containing the form buttons.
   */
  createButtons(): HTMLDivElement {
    const createButton = (label: string, iconClass: string, id: string, onClick: () => void): HTMLButtonElement => {
      const button = this.theme.getFormButton(label, document.createElement('i'));
      button.querySelector('i')?.classList.add('bi', iconClass);
      button.id = id;
      button.onclick = onClick;
      return button;
    };

    const startLocate = createButton(
      'Standort bestimmen',
      'bi-circle-fill',
      `start-locate-${this.key}`,
      this.onLocate.bind(this)
    );
    const startModifyLocation = createButton(
      'Standort bearbeiten',
      'bi-pencil',
      `start-modify-location-${this.key}`,
      this.onModifyLocation.bind(this)
    );
    const stopModifyLocation = createButton(
      'Bearbeitung beenden',
      'bi-pencil',
      `stop-modify-location-${this.key}`,
      this.onStopModifyLocation.bind(this)
    );

    stopModifyLocation.style.display = 'none';

    const zoomToFeatureButton = this.createZoomToFeatureButton();
    zoomToFeatureButton.id = `zoom-to-feature-${this.key}`;
    zoomToFeatureButton.style.display = 'none';
    zoomToFeatureButton.onclick = this.onZoomToFeatureClick.bind(this);
    zoomToFeatureButton['data-toggle'] = 'tooltip';
    zoomToFeatureButton.title = 'Auf Geometrie zoomen';

    const formButtons = document.createElement('div');
    formButtons.classList.add('form-buttons');
    // TODO improve styling of buttons
    Object.assign(formButtons.style, {display: 'flex', gap: '8px'});
    formButtons.append(startLocate, startModifyLocation, stopModifyLocation, zoomToFeatureButton);

    return formButtons;
  }

  /**
   * Enables location modification mode, disables locate actions, and registers listeners.
   */
  onModifyLocation(): void {
    this.toggleModifyButtons(true);
    this.setZoomButtonActiveState(true);
    this.input.readOnly = true;
    this.registerListener();
    sendMessage(
      window.parent,
      SEND_EVENTS.startModify,
      {
        itemId: getItemId(this),
        columnId: this.key,
        geom: this.value
      });
  }

  /**
   * Disables location modification mode, re-enables locate actions, and unregisters listeners.
   */
  onStopModifyLocation(): void {
    this.toggleModifyButtons(false);
    this.setZoomButtonActiveState(false);
    this.input.readOnly = false;
    this.unregisterListener();
    sendMessage(
      window.parent,
      SEND_EVENTS.stopModify,
      {
        columnId: this.key,
        itemId: getItemId(this)
      });
  }

  /**
   * Starts the location determination (geolocation) process.
   */
  onLocate(): void {
    this.formButtons?.querySelector(`#start-locate-${this.key}`)?.setAttribute('disabled', 'true');
    this.input.readOnly = true;
    this.registerListener();
    sendMessage(
      window.parent,
      SEND_EVENTS.startLocating,
      {
        columnId: this.key,
        itemId: getItemId(this)
      });
  }

  /**
   * Toggles the visibility and enabled state of the modify and locate buttons.
   *
   * @param {boolean} isModifying - Whether the modify mode is active.
   */
  toggleModifyButtons(isModifying: boolean): void {
    const startModifyLocationButton = this.formButtons?.querySelector(`#start-modify-location-${this.key}`);
    const stopModifyLocationButton = this.formButtons?.querySelector(`#stop-modify-location-${this.key}`);
    const startLocateButton = this.formButtons?.querySelector(`#start-locate-${this.key}`);

    if (startModifyLocationButton && stopModifyLocationButton && startLocateButton) {
      startModifyLocationButton.style.display = isModifying ? 'none' : 'inline';
      stopModifyLocationButton.style.display = isModifying ? 'inline' : 'none';
      startLocateButton.disabled = isModifying;
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

  /**
   * Handles incoming messages and processes location-related events.
   *
   * @param {MessageEvent} evt - The message event received.
   */
  postMessageListener(evt: MessageEvent): void {
    const message = receiveMessage(window.parent, evt);
    const evtType = evt?.data?.type;
    const payload = evt?.data?.payload;
    const columnId = payload?.columnId;

    if (!message || columnId !== this.key) {
      return;
    }

    switch (evtType) {
      case RECEIVE_EVENTS.locatingStopped:
        this.onLocatingStopped();
        break;
      case RECEIVE_EVENTS.locationModifyStopped:
        // case: modifying of location has stopped
        // because another interaction has been started
        this.toggleModifyButtons(false);
        break;
      default:
        break;
    }
  }

  /**
   * Resets the Start Locate Button when location determination is stopped, and unregisters listeners.
   */
  onLocatingStopped(): void {
    this.formButtons?.querySelector(`#start-locate-${this.key}`)?.removeAttribute('disabled');
    this.input.readOnly = false;
    this.unregisterListener();
  }

  /**
   * Registers the postMessageListener to handle incoming window 'message' events.
   */
  registerListener(): void {
    window.addEventListener('message', this.postMessageListener.bind(this));
  }

  /**
   * Unregisters the postMessageListener to stop handling window 'message' events.
   */
  unregisterListener(): void {
    window.removeEventListener('message', this.postMessageListener.bind(this));
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

  createZoomToFeatureButton() {
    const icon = document.createElement('i');
    icon.classList.add('bi', 'bi-search');
    return this.theme.getFormButton('', icon);
  }

  onZoomToFeatureClick() {
    const feature = {
      columnId: this.key,
      itemId: getItemId(this),
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
}

export default Location;
