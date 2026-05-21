import { Modal, Form, Button } from "react-bootstrap";
import { useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";

/**
 * A simple child‑modal that lets the user create a new location.
 * After the row is successfully saved, it calls `onSaved(newRow)`.
 */
export default function AddLocationModal({ show, onHide, onSaved }) {
  const [name, setName]       = useState("");
  const [saving, setSaving]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: newLocation } = await stockManagementApis.addLocation({ name });

      onSaved(newLocation);     // bubble row up to parent
      onHide();                 // close
      setName("");              // reset for next time
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add Location</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Name</Form.Label>
            <Form.Control
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Warehouse‑B"
              required
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
