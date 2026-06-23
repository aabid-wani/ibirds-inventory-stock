import React, { useContext, useEffect, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import {
  Container, Row, Col, Card, Button, Modal, Form
} from "react-bootstrap";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { InputAdornment, TextField } from "@mui/material";
import Main from "../layout/Main";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../context/AuthProvider";

export default function Location() {
  const { loginData } = useContext(AuthContext);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [newLocation, setNewLocation] = useState({ name: "" });

  const primaryColor = "#5650ce";

  const closeModal = () => {
    setShowModal(false);
    setIsUpdate(false);
    setSelectedLoc(null);
    setNewLocation({ name: "" });
  };

  const openModal = () => setShowModal(true);

  const handleInputChange = (e) =>
    setNewLocation({ ...newLocation, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const locationData = {
        ...newLocation,
        updated_by: loginData?.id,
        ...(isUpdate ? {} : { created_by: loginData?.id }),
      };

      if (isUpdate) {
        await stockManagementApis.updateLocation(selectedLoc.id, locationData);
        toast.success("Location updated successfully");
      } else {
        await stockManagementApis.addLocation(locationData);
        toast.success("Location created successfully");
      }
      closeModal();
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Error saving location");
    }
  };

  const handleUpdateClick = (row) => {
    setSelectedLoc(row);
    setNewLocation({ name: row.name });
    setIsUpdate(true);
    openModal();
  };

  const deleteHandle = async (id) => {
    if (!window.confirm("Are you sure you want to delete this location?")) return;
    try {
      await stockManagementApis.deleteLocation(id);
      setLocations((prev) => prev.filter((l) => l.id !== id));
      toast.success("Location deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting location");
    }
  };

  const fetchData = async () => {
    try {
      const result = await stockManagementApis.getLcations();
      setLocations(result);
      setFilteredLocations(result);
    } catch (err) {
      console.error(err);
      setLocations([]);
    }
  };

  useEffect(() => { fetchData(); }, []);
  
  useEffect(() => {
    const data = locations.filter((l) =>
      (l.name || "").toLowerCase().includes(filterText.toLowerCase())
    );
    setFilteredLocations(data);
  }, [filterText, locations]);

  const columns = [
    {
      name: "S.No.",
      selector: (_, index) => index + 1,
      sortable: true,
      width: "80px",
    },
    { name: "Name", selector: (row) => row.name, sortable: true },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            className="btn-sm d-flex align-items-center justify-content-center"
            onClick={() => handleUpdateClick(row)}
            style={{ width: "32px", height: "32px", borderColor: "#a3a6dd", color: primaryColor }}
          >
            <i className="fa-regular fa-edit" aria-hidden="true"></i>
          </Button>
          <Button
            variant="outline-danger"
            className="btn-sm d-flex align-items-center justify-content-center"
            onClick={() => deleteHandle(row.id)}
            style={{ width: "32px", height: "32px", borderColor: "#f5c2c7", color: "#dc3545" }}
          >
            <i className="fa fa-trash" aria-hidden="true"></i>
          </Button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: "120px",
    },
  ];

  const customStyles = {
    table: {
      style: { textAlign: "left" },
    },
    headRow: {
      style: {
        backgroundColor: "#212529",
        color: "#ffffff",
        minHeight: "45px",
        fontWeight: "600",
        fontSize: "14px",
      },
    },
    rows: {
      style: {
        minHeight: "50px",
        fontSize: "14px",
        color: "#495057",
      },
    },
  };

  return (
    <Main>
      <div className="my-3 px-3" style={{ fontSize: "14px" }}>
        <Link to="/Home" className="text-decoration-none" style={{ color: primaryColor }}>Home</Link>
        <span className="text-muted mx-2">/</span>
        <span className="text-muted">Locations</span>
      </div>

      <Container fluid className="px-3">
        <Card className="border-0 shadow-sm" style={{ borderRadius: "8px" }}>
          {/* Header Section */}
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom flex-wrap gap-3">
            <div>
              <h5 className="mb-0 fw-normal">Location List</h5>
              <small className="text-muted">{filteredLocations.length} records</small>
            </div>

            <div className="d-flex align-items-center gap-3 flex-wrap">
              <TextField
                id="search"
                placeholder="Search location..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                size="small"
                sx={{ minWidth: "200px", backgroundColor: "#fcfcfc" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="fa fa-search text-muted"></i>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                className="px-3 border-0 d-flex align-items-center gap-2"
                onClick={openModal}
                style={{ backgroundColor: primaryColor }}
              >
                <i className="fa fa-plus" aria-hidden="true"></i> Add Location
              </Button>
            </div>
          </div>

          {/* Data Table Section */}
          <div className="p-0">
            <DataTable
              columns={columns}
              data={filteredLocations}
              pagination
              highlightOnHover
              customStyles={customStyles}
              noDataComponent={<div className="p-4 text-muted">No Records Found</div>}
            />
          </div>
        </Card>

        {/* Add/Edit Modal */}
        <Modal show={showModal} onHide={closeModal} size="md" backdrop="static">
          <Form onSubmit={handleSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>{isUpdate ? "Update Location" : "Add Location"}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Container>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-2">
                      <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Location Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        placeholder="Enter location name"
                        value={newLocation.name}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Container>
            </Modal.Body>
            <Modal.Footer className="bg-light">
              <Button variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" style={{ backgroundColor: primaryColor, border: 'none' }}>
                {isUpdate ? "Update Location" : "Add Location"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        <ToastContainer />
      </Container>
    </Main>
  );
}