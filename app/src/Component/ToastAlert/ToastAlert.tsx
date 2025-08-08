import React from 'react';

import Button from 'react-bootstrap/Button';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

import { TOAST_MESSAGE } from '../../constants/toastMessage';

import './ToastAlert.css';

export interface ToastAlertProps {
  additionalMessage?: string;
  messageType?: TOAST_MESSAGE;
  onClose: () => void;
  show: boolean;
}

const ToastAlert: React.FC<ToastAlertProps> = ({
  additionalMessage,
  messageType,
  show,
  onClose
}) => {

  const splitMsg = messageType?.split('-');
  const action = splitMsg?.[0];
  const successMsg = splitMsg?.[1];
  const success = successMsg === 'success';

  let actionText;

  if (action === 'create') {
    actionText = 'erstellt';
  } else if (action === 'delete') {
    actionText = 'gelöscht';
  } else {
    actionText = 'geändert';
  }

  let confirmationMessage = `Eintrag konnte nicht ${actionText} werden`;
  if (additionalMessage && additionalMessage.length > 0) {
    confirmationMessage = `${confirmationMessage}: ${additionalMessage}`;
  }
  if (success) {
    confirmationMessage = `Eintrag erfolgreich ${actionText}`;
  }

  const autohideDelay = 3000;
  const variant = success ? 'success' : 'danger';

  return (
    <ToastContainer className="p-3 toast-alert" position='top-end'>
      <Toast
        bg={variant}
        show={show}
        autohide
        delay={autohideDelay}
        onClose={onClose}
      >
        <div className="d-flex justify-content-between">
          <Toast.Body className="text-white">
            {confirmationMessage}
          </Toast.Body>
          <Button
            variant={variant}
            onClick={onClose}
          >
            <i className="bi bi-x"></i>
          </Button>
        </div>
      </Toast>
    </ToastContainer>
  );
};

export default ToastAlert;
