import { SEND_EVENTS } from '../constants/events';

import { sendMessage } from './postMessage';

export const refreshLayers = (layerIds: string[]) => {
  if (layerIds) {
    layerIds.forEach(layerId => {
      sendMessage(window.parent, SEND_EVENTS.refreshLayer, layerId);
    });
  }
};
