import React, { useEffect, useState } from "react";
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

export default function AssetType() {

  const [types,           setTypes]           = useState([]);
  const [filteredTypes,   setFilteredTypes]   = useState([]);
  const [filterText,      setFilterText]      = useState("");
  const [showModal,       setShowModal]       = useState(false);
  const [isUpdate,        setIsUpdate]        = useState(false);
  const [selectedType,    setSelectedType]    = useState(null);
  const [newType,         setNewType]         = useState({
    name: "", asset_code: "", is_movable: true, description: "",asset_no:""
  });

  const closeModal = () => {
    setShowModal(false);
    setIsUpdate(false);
    setSelectedType(null);
    setNewType({ name: "", asset_code: "", is_movable: true, description: "" ,asset_no :""});
  };
  const openModal = () => setShowModal(true);

  const handleInputChange = ({ target: { name, value, type, checked } }) =>
    setNewType({ ...newType, [name]: type === "checkbox" ? checked : value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isUpdate) {
        await stockManagementApis.updateAssetType(selectedType.id, newType);
        toast.success("Asset Type updated successfully");
      } else {
        await stockManagementApis.addAssetType(newType);
        toast.success("Asset Type created successfully");
      }
      closeModal();
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Error saving asset type");
    }
  };

  const handleEditClick = (row) => {
    setSelectedType(row);
    setNewType({
      name:        row.name,
      asset_code:  row.asset_code,
      is_movable:  row.is_movable,
      asset_no:    row.asset_no,
      description: row.description || ""
    });
    setIsUpdate(true);
    openModal();
  };

  const deleteHandle = async (id) => {
    if (!window.confirm("Delete this asset type?")) return;
    try {
      await stockManagementApis.deleteAssetType(id);
      setTypes((prev) => prev.filter((t) => t.id !== id));
      toast.success("Asset Type deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting asset type");
    }
  };

  const fetchData = async () => {
    try {
      const data = await stockManagementApis.getAssetTypes();
      console.log(data);
      setTypes(data);
      setFilteredTypes(data);
    } catch (err) {
      console.error(err);
      setTypes([]);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const text = filterText.toLowerCase();
    setFilteredTypes(
      types.filter(
        (t) =>
          t.name.toLowerCase().includes(text) ||
          t.asset_code.toLowerCase().includes(text)
      )
    );
  }, [filterText, types]);

  const columns = [
    { name: <b>S.No.</b>, selector: (_, i) => i + 1, width: "70px" },
    { name: <b>Name</b>, selector: (row) => row.name, sortable: true },
    { name: <b>Code</b>, selector: (row) => row.asset_code, sortable: true },
    { name: <b>Asset No</b>, selector: (row) => row.asset_no, sortable: true },
    { name: <b>Description</b>, selector: (row) => row.description, sortable: true },
    {
      name: <b>Movable?</b>,
      selector: (row) => (row.is_movable ? "Yes" : "No"),
      sortable: true,
      width: "100px"
    },
    {
      name: <b>Actions</b>,
      cell: (row) => (
        <>
          <Button className="mx-2 btn-sm border-0" onClick={() => handleEditClick(row)}>
            <i className="fa-regular fa-edit" />
          </Button>
          <Button className="bg-danger btn-sm border-0" onClick={() => deleteHandle(row.id)}>
            <i className="fa fa-trash" />
          </Button>
        </>
      ),
      ignoreRowClick: true,
      button: true
    }
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
      <div className="my-2" style={{ position: "relative", left: "5px" }}>
        <Breadcrumb>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}>Home</Breadcrumb.Item>
          <Breadcrumb.Item active style={{ fontWeight: "bold" }}>Asset Types List</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Card style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
        <Container fluid className="p-3">
          <p style={{ fontSize: 16, fontWeight: "bold" }}>Asset Type List</p>
          <hr />
          <Row>
            <Col>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <TextField
                  placeholder="Search by name or code"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <i className="fa fa-search " />
                      </InputAdornment>
                    )
                  }}
                />
                <Button className="btn-sm" onClick={openModal}>
                  <i className="fa fa-plus" />&nbsp;Add Asset_Type
                </Button>
              </div>
            </Col>
          </Row>
          <Row>
            <Col>
              <DataTable
                columns={columns}
                data={filteredTypes}
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
            <Modal.Title>{isUpdate ? "Update" : "Add"} Asset Type</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    name="name"
                    value={newType.name}
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
                    value={newType.asset_code}
                    onChange={handleInputChange}
                    maxLength={4}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Movable"
                    name="is_movable"
                    checked={newType.is_movable}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Asset No</Form.Label>
                  <Form.Control
                    name="asset_no"
                    value={newType.asset_no}
                    onChange={handleInputChange}
                    required
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
                    value={newType.description}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" type="submit">
              {isUpdate ? "Update" : "Add"} Asset Type
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ToastContainer />
    </Main>
  );
}
