import React from 'react';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

import { ItemId } from '../../App';

interface ConfirmDeleteProps {
  show: boolean;
  itemId?: ItemId;
  onCancel: () => void;
  onDelete: () => void;
}

const ConfirmDelete: React.FC<ConfirmDeleteProps> = ({
  show,
  itemId,
  onCancel,
  onDelete
}) => {

  return (
    <Modal
      show={show}
    >
      <Modal.Header>
        <Modal.Title>Eintrag löschen</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>
          Sind Sie sicher, dass Sie den Eintrag <strong>{itemId}</strong> löschen möchten?
          Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => onCancel()}
        >
          Abbrechen
        </Button>
        <Button
          variant="primary"
          onClick={() => onDelete()}
        >
          Löschen
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmDelete;
