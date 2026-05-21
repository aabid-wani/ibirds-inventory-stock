
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
import AddLocationModal from "./AddLocationModal";
import AddAssetTypeModal from "./AddAssetTypeModal";

export default function Assets() {
  /* ──────────────────────────────────────────────────────────
   * constants & lookup data
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

    // user chose “Add Location…”
    if (name === "location_id" && value === ADD_NEW) {
      setShowAddLocModal(true);
      return;
    }
    
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
        toast.success("Asset updated");
      } else {
        await stockManagementApis.addAssets(form);
        toast.success("Asset created");
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
      unit_cost:       row.unit_cost
    });
    setIsUpdate(true);
    openAssetModal();
  };

  const deleteHandle = async (id) => {
    if (!window.confirm("Delete this asset?")) return;
    try {
      await stockManagementApis.deleteAssets(id);
      setAssets((prev) => prev.filter((a) => a.id !== id));
      toast.success("Asset deleted");
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

  useEffect(() => { fetchAssets(); fetchLookups(); }, []);

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
   * after AddLocationModal saves a row
   * ───────────────────────────────────────────────────────── */
  const handleLocationSaved = (newLoc) => {
    fetchLookups();
    // setLocations((prev) => [...prev, newLoc]);                 // add to lookup
    // setForm((prev)   => ({ ...prev, location_id: newLoc.id })); // auto‑select
  };

  const handleAssetTypeSaved = (newAssetType)=>{
    fetchLookups();
  }

  /* ──────────────────────────────────────────────────────────
   * datatable
   * ───────────────────────────────────────────────────────── */
  const cols = [
    { name: <b>S.No.</b>,    selector: (_, i) => i + 1, width: "70px" },
    { name: <b>Type</b>,     selector: (r) => r.asset_type_name,sortable: true, width: "140px" },
    { name: <b>Asset No.</b>,selector: (r) => r.asset_no,       sortable: true, width: "130px" },
    { name: <b>Brand</b>,    selector: (r) => r.brand_name,     sortable: true },
    { name: <b>Location</b>, selector: (r) => r.location_name,  sortable: true },
    { name: <b>Cost</b>,     selector: (r) => r.unit_cost,      sortable:true },
    { name: <b>Qty</b>,      selector: (r) => r.quantity,       width: "80px" },
    { name: <b>Remark</b>,   selector: (r) => r.remarks,        sortable:true },
    { name: <b>Movable</b>,  selector: (r) => (r.is_movable ? "Yes" : "No"),
                              width: "110px", sortable: true },
    // { name: <b>Purchased</b>,selector: (r) => r.purchase_date },
    {
      name: <b>Actions</b>, button: true,
      cell: (row) => (
        <>
          <Button className="mx-1 btn-sm border-0" onClick={() => editClick(row)}>
            <i className="fa-regular fa-edit" />
          </Button>
          <Button className="bg-danger btn-sm border-0"
                  onClick={() => deleteHandle(row.id)}>
            <i className="fa fa-trash" />
          </Button>
        </>
      )
    }
  ];

  const customStyles = {
    table:     { style: { textAlign: "left" } },
    headCells: { style:{ 
          background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
          color:" #ecf0f1ff",
      } },
    headRow:   { style: { minHeight: "30px" } },
    rows:      { style: { minHeight: "34px" } }
  };

  /* ──────────────────────────────────────────────────────────
   * UI
   * ───────────────────────────────────────────────────────── */
  return (
    <Main>
      {/* breadcrumb */}
      <div className="my-2" style={{ position: "relative", left: 5 }}>
        <Breadcrumb>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}>
            Home
          </Breadcrumb.Item>
          <Breadcrumb.Item active style={{ fontWeight: "bold" }}>
            Assets
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* table card */}
      <Card style={{ boxShadow: "0 4px 20px rgba(0,0,0,.15)" }}>
        <Container fluid className="p-3">
          <p style={{ fontSize: 16, fontWeight: "bold" }}>Asset List</p>
          <hr />

          {/* mobility filter */}
          <div className="mb-2">
            <Form.Select
              style={{ width: "180px" }}
              value={mobilityFilter}
              onChange={(e) => setMobilityFilter(e.target.value)}
              className="mx-2"
            >
              <option value="all">All Assets</option>
              <option value="Yes">Movable</option>
              <option value="No">Not Movable</option>
            </Form.Select>
          </div>

          <Row>
            <Col>
              <div className="d-flex justify-content-between mb-3 align-items-center">
                <TextField
                  placeholder="Search by brand, type or location"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <i className="fa fa-search" />
                      </InputAdornment>
                    )
                  }}
                />
                <Button className="btn btn-sm" onClick={openAssetModal}>
                  <i className="fa fa-plus" />&nbsp;Add Asset
                </Button>
              </div>
            </Col>
          </Row>

          <DataTable
            columns={cols}
            data={filteredAssets}
            pagination
            highlightOnHover
            striped
            customStyles={customStyles}
          />
        </Container>
      </Card>

      {/* asset modal */}
      <Modal
        show={showAssetModal}
        onHide={closeAssetModal}
        size="lg"
        backdrop="static"
      >
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{isUpdate ? "Update" : "Add"} Asset</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              {/* Location select */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Select
                    name="location_id"
                    value={form.location_id}
                    onChange={handleInput}
                    required
                  >
                    <option value="">-- choose --</option>

                    {locations.length ? (
                      locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))
                    ) : (
                      <option disabled value="">
                        (no locations yet)
                      </option>
                    )}

                    <option value={ADD_NEW}>➕ Location…</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Asset type */}
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Asset Type</Form.Label>
                  <Form.Select
                    name="asset_type_id"
                    value={form.asset_type_id}
                    onChange={handleInput}
                    required
                  >
                    <option value="">-- choose --</option>
                     {types.length ? (
                      types.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))
                    ) : (
                      <option disabled value="">
                        (no locations yet)
                      </option>
                    )}
                    <option value={ADD_ASSET_TYPE}>➕ Asset Type...</option>
                 

                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Brand</Form.Label>
                  <Form.Control
                    name="brand_name"
                    value={form.brand_name}
                    onChange={handleInput}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity</Form.Label>
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
                <Form.Group className="mb-3">
                  <Form.Label>Unit Cost</Form.Label>
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
                <Form.Group className="mb-3">
                  <Form.Label>Purchase Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="purchase_date"
                    value={form.purchase_date || ""}
                    onChange={handleInput}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Remarks</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="remarks"
                    value={form.remarks}
                    onChange={handleInput}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" type="submit">
              {isUpdate ? "Update" : "Add"} Asset
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ToastContainer />

      {/* child modal for adding a location */}
      <AddLocationModal
        show={showAddLocModal}
        onHide={() => setShowAddLocModal(false)}
        onSaved={handleLocationSaved}
      />

      <AddAssetTypeModal
        show={showAddAssetTypeModal}
        onHide={() => setShowAddAssetTypeModal(false)}
        onSaved={handleLocationSaved}
      />

    </Main>
  );
}

