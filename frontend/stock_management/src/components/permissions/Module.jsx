import React, { useContext, useEffect, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
} from "react-bootstrap";
import DataTable from "react-data-table-component";
import Main from "../layout/Main";
import { Link } from "react-router-dom";
import { TextField, InputAdornment } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../App.css";
import { AuthContext } from "../context/AuthProvider";

export default function Module() {
  const { loginData } = useContext(AuthContext);
  const [showAlert, setShowAlert] = useState(false);
  const [modules, setModules] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filteredModules, setFilteredModules] = useState([]);
  const [newModule, setNewModule] = useState({ name: "", status: "" });
  const [showModal, setShowModal] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);

  const primaryColor = "#5650ce";

  const handleGetData = async () => {
    try {
      const result = await stockManagementApis.getModule();
      setModules(result);
    } catch (error) {
      console.error("Error fetching modules:", error);
      setModules([]);
    }
  };

  useEffect(() => {
    handleGetData();
  }, []);

  const handleModalClose = () => {
    setShowModal(false);
    setNewModule({ name: "", status: "" });
    setIsUpdate(false);
    setSelectedModule(null);
  };

  const handleModalShow = () => {
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewModule({ ...newModule, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const moduleData = {
        ...newModule,
        updated_by: loginData?.id,
        ...(isUpdate ? {} : { created_by: loginData?.id }),
      };
      if (isUpdate) {
        await stockManagementApis.updateModule(
          selectedModule.id,
          moduleData
        );
        toast.success("Module updated successfully!");
      } else {
        const result = await stockManagementApis.addModule(moduleData);
        if (result?.success) {
          toast.success("Module added successfully!");
        }
      }
      handleModalClose();
      handleGetData();
    } catch (error) {
      toast.error(`Error ${isUpdate ? "updating" : "adding"} module!`);
    }
  };

  useEffect(() => {
    const filteredModules = modules.filter(
      (item) =>
        (item.name || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (item.status || "").toLowerCase().includes(filterText.toLowerCase())
    );
    setFilteredModules(filteredModules);
  }, [filterText, modules]);

  const deleteModule = async (id) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this record?"
    );
    if (isConfirmed) {
      try {
        await stockManagementApis.deleteModuleById(id);
        setModules((prevMods) => prevMods.filter((mdl) => mdl.id !== id));
        toast.success("Module deleted successfully");
      } catch (error) {
        console.error("Error deleting module:", error);
        toast.error("Module could not be deleted");
      }
    } else {
      setShowAlert(true);
    }
  };

  const handleUpdateClick = (row) => {
    setSelectedModule(row);
    setNewModule({
      name: row.name,
      status: row.status ? "active" : "inactive",
    });
    setIsUpdate(true);
    handleModalShow();
  };

  const columns = [
    {
      name: "S.No.",
      selector: (row, index) => index + 1,
      sortable: true,
      width: "80px",
    },
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => (row.status === "active" ? "active" : "inactive"),
      sortable: true,
    },
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
            onClick={() => deleteModule(row.id)}
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
        <span className="text-muted">Modules</span>
      </div>

      <Container fluid className="px-3">
        <Card className="border-0 shadow-sm" style={{ borderRadius: "8px" }}>
          {/* Header Section */}
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom flex-wrap gap-3">
            <div>
              <h5 className="mb-0 fw-normal">Module List</h5>
              <small className="text-muted">{filteredModules.length} records</small>
            </div>

            <div className="d-flex align-items-center gap-3 flex-wrap">
              <TextField
                id="search"
                placeholder="Search..."
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
                onClick={handleModalShow}
                style={{ backgroundColor: primaryColor }}
              >
                <i className="fa fa-plus" aria-hidden="true"></i> Add Module
              </Button>
            </div>
          </div>

          {/* Data Table Section */}
          <div className="p-0">
            <DataTable
              columns={columns}
              data={filteredModules}
              pagination
              highlightOnHover
              customStyles={customStyles}
              noDataComponent={<div className="p-4 text-muted">No Records Found</div>}
            />
          </div>
        </Card>

        {/* Add/Edit Modal */}
        <Modal
          show={showModal}
          onHide={handleModalClose}
          size="lg"
          backdrop="static"
        >
          <Form onSubmit={handleSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>
                {isUpdate ? "Update Module" : "Add Module"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Container>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Module Name</Form.Label>
                      <Form.Control
                        name="name"
                        type="text"
                        placeholder="Enter module name"
                        value={newModule.name}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Status</Form.Label>
                      <Form.Select
                        name="status"
                        value={newModule.status}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Container>
            </Modal.Body>
            <Modal.Footer className="bg-light">
              <Button variant="secondary" onClick={handleModalClose}>
                Close
              </Button>
              <Button variant="primary" type="submit" style={{ backgroundColor: primaryColor, border: 'none' }}>
                {isUpdate ? "Update Module" : "Add Module"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

      </Container>
      <ToastContainer />
    </Main>
  );
}