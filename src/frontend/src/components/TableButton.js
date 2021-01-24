import React from 'react';
import Button from 'react-bootstrap/Button';

const TableButton = ({ children, onClick, variant = 'primary' }) => (
    <Button onClick={onClick} size="sm" variant={variant}>{children}</Button>
);

export default TableButton;
