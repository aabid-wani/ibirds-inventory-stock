import React, { useContext, useEffect, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import {
  Container, Row, Col, Card, Breadcrumb,
  Button, Modal, Form
} from "react-bootstrap";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import { InputAdornment, TextField } from "@mui/material";
import Main from "../layout/Main";
import { toast, ToastContainer } from "react-toastify";
import { AuthContext } from "../context/AuthProvider";
export default function Location() {
  const {loginData} = useContext(AuthContext);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [newLocation, setNewLocation] = useState({ name: "" });

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
    if (!window.confirm("Delete this location?")) return;
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
      l.name.toLowerCase().includes(filterText.toLowerCase())
    );
    setFilteredLocations(data);
  }, [filterText, locations]);

 
  const columns = [
    {
      name: <b>S.No.</b>,
      selector: (_, index) => index + 1,
      sortable: true,
      width: "70px",
      style: { borderRight: "2px solid #dee2e6", fontWeight: "bold" },
    },
    { name: <b>Name</b>, selector: (row) => row.name, sortable: true },
    {
      name: <b>Actions</b>,
      cell: (row) => (
        <>
          <Button className="mx-2 btn-sm border-0" onClick={() => handleUpdateClick(row)}>
            <i className="fa-regular fa-edit" />
          </Button>
          <Button className="bg-danger btn-sm border-0" onClick={() => deleteHandle(row.id)}>
            <i className="fa fa-trash" />
          </Button>
        </>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  const customStyles = {
    table: {  style: { textAlign: "left", },},
    headCells: { style:{ 
          background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
          color:" #ecf0f1ff",
      } },
    headRow: {style: { minHeight: "30px",},},
    rows: {style: {minHeight: "34px",}, },
  };
  return (
    <Main>
      {/* breadcrumb */}
      <div className="my-2" style={{ position: "relative", left: "5px" }}>
        <Breadcrumb>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}>
            Home
          </Breadcrumb.Item>
          <Breadcrumb.Item active style={{ fontWeight: "bold" }}>
            Locations List
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* table card */}
      <Card style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
        <Container fluid className="p-3">
          <p style={{ fontSize: "16px", fontWeight: "bold" }}>Location List</p>
          <hr />
          <Row>
            <Col>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <TextField
                  id="search"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <i className="fa fa-search" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button className="btn-sm" onClick={openModal}>
                  <i className="fa fa-plus" />&nbsp;Add Location
                </Button>
              </div>
            </Col>
          </Row>
          <Row>
            <Col>
              <DataTable
                columns={columns}
                data={filteredLocations}
                pagination
                highlightOnHover
                striped
                customStyles={customStyles}
              />
            </Col>
          </Row>
        </Container>
      </Card>

      {/* modal */}
      <Modal show={showModal} onHide={closeModal} size="lg" backdrop="static">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{isUpdate ? "Update Location" : "Add Location"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Location Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newLocation.name}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" type="submit">
              {isUpdate ? "Update Location" : "Add Location"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      <ToastContainer />
    </Main>
  );
}
