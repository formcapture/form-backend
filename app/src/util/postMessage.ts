export const sendMessage = (targetWindow: Window, type: string, data?: any) => {
  const message: { type: string; payload?: any } = {
    type,
  };
  if (data !== undefined && data !== null) {
    message.payload = data;
  }
  targetWindow.postMessage(message, targetWindow.origin);
};

export const receiveMessage = (originWindow: Window, message: MessageEvent) => {
  if (message.origin !== originWindow.origin) {
    return;
  }
  return message;
};
