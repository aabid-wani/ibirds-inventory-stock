import React, { useEffect, useState } from "react";
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
import AddLocationModal from "./AddLocationModal";
import AddAssetTypeModal from "./AddAssetTypeModal";

export default function Assets() {
  /* ──────────────────────────────────────────────────────────
   * constants & lookup data
   * ───────────────────────────────────────────────────────── */
  const ADD_NEW  = "ADD_NEW";
  const ADD_ASSET_TYPE  = "ADD_ASSET_TYPE";

  const [locations, setLocations] = useState([]);
  const [types,     setTypes]     = useState([]);

  /* ──────────────────────────────────────────────────────────
   * table + search + filters
   * ───────────────────────────────────────────────────────── */
  const [assets,         setAssets]         = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [filterText,     setFilterText]     = useState("");
  const [mobilityFilter, setMobilityFilter] = useState("all"); // all | Yes | No

  /* ──────────────────────────────────────────────────────────
   * CRUD modal state
   * ───────────────────────────────────────────────────────── */
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [isUpdate,       setIsUpdate]       = useState(false);
  const [selected,       setSelected]       = useState(null);
  const [form, setForm] = useState({
    location_id:   "", asset_type_id: "",
    brand_name:    "", 
    quantity:      1,  purchase_date: "",
    remarks:      "", unit_cost:0
  });

  /* child “add‑location” modal */
  const [showAddLocModal, setShowAddLocModal] = useState(false);
  const [showAddAssetTypeModal, setShowAddAssetTypeModal] = useState(false);

  const primaryColor = "#5650ce";

  /* ──────────────────────────────────────────────────────────
   * helpers
   * ───────────────────────────────────────────────────────── */
  const openAssetModal  = () => setShowAssetModal(true);
  const closeAssetModal = () => {
    setShowAssetModal(false);
    setIsUpdate(false);
    setSelected(null);
    setForm({
      location_id: "", asset_type_id: "",
      brand_name:  "", 
      quantity:    1,  purchase_date: "",
      remarks:    "", unit_cost:0
    });
  };

  /** handle every change in the asset‑form */
  const handleInput = (e) => {
    const { name, value } = e.target;

    // user chose “Add Location…”
    if (name === "location_id" && value === ADD_NEW) {
      setShowAddLocModal(true);
      return;
    }
    
    // user chose “Add Asset Type...”
    if (name === "asset_type_id" && value === ADD_ASSET_TYPE) {
      setShowAddAssetTypeModal(true);
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /** save asset */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isUpdate) {
        await stockManagementApis.updateAssets(selected.id, form);
        toast.success("Asset updated successfully");
      } else {
        await stockManagementApis.addAssets(form);
        toast.success("Asset created successfully");
      }
      closeAssetModal();
      fetchAssets();
    } catch (err) {
      console.error(err);
      toast.error("Error saving asset");
    }
  };

  const editClick = (row) => {
    setSelected(row);
    setForm({
      location_id:   row.location_id,
      asset_type_id: row.asset_type_id,
      brand_name:    row.brand_name,
      quantity:      row.quantity,
      purchase_date: row.purchase_date,
      remarks:       row.remarks || "",
      unit_cost:     row.unit_cost
    });
    setIsUpdate(true);
    openAssetModal();
  };

  const deleteHandle = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      await stockManagementApis.deleteAssets(id);
      setAssets((prev) => prev.filter((a) => a.id !== id));
      toast.success("Asset deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting asset");
    }
  };

  /* ──────────────────────────────────────────────────────────
   * data‑loading
   * ───────────────────────────────────────────────────────── */
  const fetchAssets = async () => {
    const data = await stockManagementApis.getAssets();
    setAssets(data);
    setFilteredAssets(data);
  };

  const fetchLookups = async () => {
    setLocations(await stockManagementApis.getLcations());   
    setTypes(await stockManagementApis.getAssetTypes());
  };

  useEffect(() => { 
    fetchAssets(); 
    fetchLookups(); 
  }, []);

  /* ──────────────────────────────────────────────────────────
   * search & mobility filter
   * ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const q = filterText.toLowerCase();
    setFilteredAssets(
      assets.filter((a) => {
        const matchText =
          a.brand_name?.toLowerCase().includes(q) ||
          a.asset_type_name?.toLowerCase().includes(q) ||
          a.location_name?.toLowerCase().includes(q);

        const matchMobility =
          mobilityFilter === "all" ||
          (mobilityFilter === "Yes" && a.is_movable) ||
          (mobilityFilter === "No"  && !a.is_movable);

        return matchText && matchMobility;
      })
    );
  }, [filterText, mobilityFilter, assets]);

  /* ──────────────────────────────────────────────────────────
   * after modals save a row
   * ───────────────────────────────────────────────────────── */
  const handleLocationSaved = (newLoc) => {
    fetchLookups();
  };

  const handleAssetTypeSaved = (newAssetType)=>{
    fetchLookups();
  }

  /* ──────────────────────────────────────────────────────────
   * datatable
   * ───────────────────────────────────────────────────────── */
  const cols = [
    { name: "S.No.",    selector: (_, i) => i + 1, width: "80px" },
    { name: "Type",     selector: (r) => r.asset_type_name, sortable: true, width: "140px" },
    { name: "Asset No.",selector: (r) => r.asset_no,       sortable: true, width: "130px" },
    { name: "Brand",    selector: (r) => r.brand_name,     sortable: true },
    { name: "Location", selector: (r) => r.location_name,  sortable: true },
    { name: "Cost",     selector: (r) => r.unit_cost,      sortable:true },
    { name: "Qty",      selector: (r) => r.quantity,       width: "80px" },
    { name: "Remark",   selector: (r) => r.remarks,        sortable:true },
    { 
      name: "Movable",  
      selector: (r) => (r.is_movable ? "Yes" : "No"),
      width: "110px", 
      sortable: true 
    },
    {
      name: "Actions", 
      button: true,
      width: "120px",
      cell: (row) => (
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            className="btn-sm d-flex align-items-center justify-content-center"
            onClick={() => editClick(row)}
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
      )
    }
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

  /* ──────────────────────────────────────────────────────────
   * UI
   * ───────────────────────────────────────────────────────── */
  return (
    <Main>
      <div className="my-3 px-3" style={{ fontSize: "14px" }}>
        <Link to="/Home" className="text-decoration-none" style={{ color: primaryColor }}>Home</Link>
        <span className="text-muted mx-2">/</span>
        <span className="text-muted">Assets</span>
      </div>

      <Container fluid className="px-3">
        <Card className="border-0 shadow-sm" style={{ borderRadius: "8px" }}>
          {/* Header Section */}
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom flex-wrap gap-3">
            <div>
              <h5 className="mb-0 fw-normal">Asset List</h5>
              <small className="text-muted">{filteredAssets.length} records</small>
            </div>

            <div className="d-flex align-items-center gap-3 flex-wrap">
              <Form.Select
                style={{ width: "160px", backgroundColor: "#fcfcfc" }}
                value={mobilityFilter}
                onChange={(e) => setMobilityFilter(e.target.value)}
                size="sm"
              >
                <option value="all">All Assets</option>
                <option value="Yes">Movable</option>
                <option value="No">Not Movable</option>
              </Form.Select>

              <TextField
                id="search"
                placeholder="Search brand, type..."
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
                onClick={openAssetModal}
                style={{ backgroundColor: primaryColor }}
              >
                <i className="fa fa-plus" aria-hidden="true"></i> Add Asset
              </Button>
            </div>
          </div>

          {/* Data Table Section */}
          <div className="p-0">
            <DataTable
              columns={cols}
              data={filteredAssets}
              pagination
              highlightOnHover
              customStyles={customStyles}
              noDataComponent={<div className="p-4 text-muted">No Records Found</div>}
            />
          </div>
        </Card>

        {/* Asset Modal */}
        <Modal
          show={showAssetModal}
          onHide={closeAssetModal}
          size="lg"
          backdrop="static"
        >
          <Form onSubmit={handleSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>
                {isUpdate ? "Update Asset" : "Add Asset"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Container>
                <Row>
                  {/* Location Select */}
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Location</Form.Label>
                      <Form.Select
                        name="location_id"
                        value={form.location_id}
                        onChange={handleInput}
                        required
                      >
                        <option value="">-- choose location --</option>
                        {locations.length ? (
                          locations.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name}
                            </option>
                          ))
                        ) : (
                          <option disabled value="">
                            (no locations available)
                          </option>
                        )}
                        <option value={ADD_NEW}>➕ Add Location…</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {/* Asset Type Select */}
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Asset Type</Form.Label>
                      <Form.Select
                        name="asset_type_id"
                        value={form.asset_type_id}
                        onChange={handleInput}
                        required
                      >
                        <option value="">-- choose type --</option>
                         {types.length ? (
                          types.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))
                        ) : (
                          <option disabled value="">
                            (no types available)
                          </option>
                        )}
                        <option value={ADD_ASSET_TYPE}>➕ Add Asset Type...</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Brand</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter brand name"
                        name="brand_name"
                        value={form.brand_name}
                        onChange={handleInput}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-4">
                      <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Quantity</Form.Label>
                      <Form.Control
                        type="number"
                        name="quantity"
                        value={form.quantity}
                        onChange={handleInput}
                        min={1}
                        required
                      />
                    </Form.Group>
                  </Col>
                 <Col md={3}>
                    <Form.Group className="mb-4">
                      <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Unit Cost</Form.Label>
                      <Form.Control
                        type="number"
                        name="unit_cost"
                        value={form.unit_cost}
                        onChange={handleInput}
                        min={0}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Purchase Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="purchase_date"
                        value={form.purchase_date || ""}
                        onChange={handleInput}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="text-muted" style={{ fontSize: "13px" }}>Remarks</Form.Label>
                      <Form.Control
                        as="textarea"
                        placeholder="Additional remarks..."
                        rows={1}
                        name="remarks"
                        value={form.remarks}
                        onChange={handleInput}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Container>
            </Modal.Body>
            <Modal.Footer className="bg-light">
              <Button variant="secondary" onClick={closeAssetModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" style={{ backgroundColor: primaryColor, border: 'none' }}>
                {isUpdate ? "Update Asset" : "Add Asset"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        <ToastContainer />

        {/* Child Modal for Adding Location */}
        <AddLocationModal
          show={showAddLocModal}
          onHide={() => setShowAddLocModal(false)}
          onSaved={handleLocationSaved}
        />

        {/* Child Modal for Adding Asset Type */}
        <AddAssetTypeModal
          show={showAddAssetTypeModal}
          onHide={() => setShowAddAssetTypeModal(false)}
          onSaved={handleAssetTypeSaved}
        />

      </Container>
    </Main>
  );
}