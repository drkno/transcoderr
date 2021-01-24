import React, { useState, Fragment } from 'react';
import Badge from 'react-bootstrap/Badge';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';
import Type from './Type';

const rowStatusCss = value => {
    switch(value) {
        case 'started': return 'primary';
        case 'successful': return 'success';
        case 'failed': return 'danger';
        default: return 'secondary';
    }
};

const PluginRow = ({ plugin }) => (console.log(plugin), (
    <tr>
        <td><Badge variant={rowStatusCss(plugin.state)}>{plugin.state}</Badge></td>
        <td>{plugin.pluginId}</td>
        <td><Type>{plugin.jobState}</Type></td>
        <td>{plugin.context ? plugin.context : (<i>None</i>)}</td>
    </tr>
));

const PluginModal = ({ plugins }) => {
    const [show, setShow] = useState(false);
  
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    
    return (
        <Fragment>
            <Button size="sm" variant="primary" onClick={handleShow}>
                Plugins
            </Button>

            <Modal show={show} onHide={handleClose} size="lg">
                <Modal.Header size="sm" closeButton>
                    <Modal.Title>Plugins</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Table>
                        <thead>
                            <tr>
                                <th>State</th>
                                <th>Plugin ID</th>
                                <th>Job Type</th>
                                <th>Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(plugins).map(plugin => (<PluginRow key={plugin.id} plugin={plugin} />))}
                        </tbody>
                    </Table>
                </Modal.Body>
            </Modal>
        </Fragment>
    );
};

export default PluginModal;
