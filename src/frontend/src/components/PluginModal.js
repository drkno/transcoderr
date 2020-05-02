import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

const PluginModal = ({ plugins }) => {
    const [show, setShow] = useState(false);
  
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
  
    return (
        <>
            <Button disabled size="sm" variant="primary" onClick={handleShow}>
                Plugins
            </Button>

            <Modal show={show} onHide={handleClose}>
                <Modal.Header size="sm" closeButton>
                    <Modal.Title>Plugins</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                Coming soon
                </Modal.Body>
            </Modal>
        </>
    );
};

export default PluginModal;
