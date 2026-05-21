import { Modal, Form, Button, Row, Col } from "react-bootstrap";
import { useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";

/**
 * A simple child‑modal that lets the user create a new location.
 * After the row is successfully saved, it calls `onSaved(newRow)`.
 */
export default function AddAssetTypeModal({ show, onHide, onSaved }) {
  const [assetType, setAssetType] = useState({
    name: "", asset_code: "", is_movable: true, description: ""
  });
  const [saving, setSaving]   = useState(false);


  const handleInputChange = ({ target: { name, value, type, checked } }) =>
    setAssetType({ ...assetType, [name]: type === "checkbox" ? checked : value });


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const {data} = await stockManagementApis.addAssetType(assetType);
      onSaved(data);     // bubble row up to parent
      onHide();                 // close
      setAssetType("");              // reset for next time
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
       <Form onSubmit={handleSubmit}>
              <Modal.Header closeButton>
                <Modal.Title>Asset Type</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        name="name"
                        value={assetType.name}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Asset Code</Form.Label>
                      <Form.Control
                        name="asset_code"
                        value={assetType.asset_code}
                        onChange={handleInputChange}
                        maxLength={4}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Movable"
                        name="is_movable"
                        checked={assetType.is_movable}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="description"
                        value={assetType.description}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="primary" type="submit">
                    Asset Type
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>
  );
}
