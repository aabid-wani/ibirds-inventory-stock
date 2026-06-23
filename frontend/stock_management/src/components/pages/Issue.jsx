import React, { useContext, useEffect, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import { Link, NavLink } from "react-router-dom";
import DataTable from "react-data-table-component";
import Main from "../layout/Main";
import { AuthContext } from "../context/AuthProvider";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format, parseISO } from "date-fns";
import moment from "moment";
import "../css/loader.css";

const PURPLE = "#534AB7";
const CORAL = "#D85A30";

const cardBase = {
  background: "#fff",
  border: "0.5px solid rgba(0,0,0,0.09)",
  borderRadius: 12,
  overflow: "hidden",
};

export default function Issue() {
  const [issue, setIssue] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filterMonth, setFilterMonth] = useState(moment().format("YYYY-MM"));
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [validated, setValidated] = useState(false);
  const [availableQty, setAvailableQty] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loader, setLoader] = useState(false);
  const { loginData, permissions } = useContext(AuthContext);

  const [currentIssue, setCurrentIssue] = useState({
    id: "", user_id: loginData.id, product_id: "", branch_id: "",
    status: "", description: "", quantity: "", issue_date: "",
    employee_id: "", updated_by: loginData?.id || null,
  });

  const handleGetData = async () => {
    try {
      const result = await stockManagementApis.getIssue();
      setIssue(result);
      setFilteredCategories(result);
    } catch (error) {
      setIssue([]);
    }
  };

  useEffect(() => { handleGetData(); }, []);

  const formatDate = (d) => { try { return moment(d).format("DD/MM/YYYY"); } catch { return ""; } };

  useEffect(() => {
    const filtered = issue.filter((item) => {
      const search = filterText.toLowerCase();
      const matchesSearch =
        String(item.user_name || "").toLowerCase().includes(search) ||
        String(item.employee_name || "").toLowerCase().includes(search) ||
        String(item.product_name || "").toLowerCase().includes(search) ||
        String(item.quantity || "").toLowerCase().includes(search) ||
        formatDate(item.issue_date).toLowerCase().includes(search) ||
        String(item.status || "").toLowerCase().includes(search);
      const matchesMonth = filterMonth
        ? moment(item.issue_date).format("YYYY-MM") === filterMonth : true;
      return matchesSearch && matchesMonth;
    });
    setFilteredCategories(filtered);
  }, [filterText, filterMonth, issue]);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const [emp, branch, product] = await Promise.all([
          stockManagementApis.getEmployees(),
          stockManagementApis.getBranch(),
          stockManagementApis.getProduct(),
        ]);
        setEmployees(emp); setBranches(branch); setProducts(product);
      } catch (e) { console.error(e); }
    };
    fetchRelated();
  }, []);

  useEffect(() => {
    if (currentIssue.product_id) {
      const p = products.find((p) => p.id === currentIssue.product_id);
      setAvailableQty(p ? p.total_buy_quantity - p.total_issue_quantity : 0);
    } else { setAvailableQty(null); }
  }, [currentIssue.product_id, products]);

  const isValidIssueDate = (date) => {
    const today = moment().endOf("day");
    const start = moment().subtract(1, "months").startOf("month");
    const ok = moment(date).isSameOrBefore(today) && moment(date).isSameOrAfter(start);
    if (!ok) toast.error("Issue date must be between start of last month and today.");
    return ok;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoader(true);
    if (!isValidIssueDate(currentIssue.issue_date)) { setLoader(false); return; }
    const product = products.find((p) => p.id === currentIssue.product_id);
    if (!product) { toast.error("Product not found!"); setLoader(false); return; }
    setIsSubmitting(true);
    try {
      if (currentIssue.id) {
        const prev = issue.find((i) => i.id === currentIssue.id);
        const diff = currentIssue.quantity - prev.quantity;
        if (diff > 0 && product.total_buy_quantity < diff) { toast.error("Insufficient stock!"); setLoader(false); return; }
        await stockManagementApis.updateIssue(currentIssue.id, currentIssue);
        await stockManagementApis.updateProduct(product.id, {
          ...product,
          total_issue_quantity: parseInt(product.total_issue_quantity) + parseInt(diff),
          available_stock: parseInt(product.available_stock) - parseInt(diff),
        });
        toast.success("Provision updated!");
      } else {
        if (product.total_buy_quantity < currentIssue.quantity) { toast.error("Insufficient stock!"); setLoader(false); return; }
        const res = await stockManagementApis.addIssue(currentIssue);
        if (res.success) toast.success("Provision added!");
        await stockManagementApis.updateProductById(product.id, {
          ...product,
          available_stock: parseInt(product.available_stock) - parseInt(currentIssue.quantity),
          total_issue_quantity: parseInt(product.total_issue_quantity) + parseInt(currentIssue.quantity),
        });
      }
      setShowModal(false); handleGetData();
    } catch (err) { toast.error("Error submitting provision."); }
    setLoader(false); setIsSubmitting(false); setValidated(true);
  };

  const handleShowModal = (iss = null) => {
    setValidated(false);
    setCurrentIssue(iss ? {
      id: iss.id, user_id: iss.user_id || loginData.id, product_id: iss.product_id,
      branch_id: iss.branch_id, status: iss.status, description: iss.description,
      quantity: iss.quantity, issue_date: iss.issue_date, employee_id: iss.employee_name,
      created_by: loginData.id, updeted_by: loginData.id,
    } : {
      id: "", user_id: loginData.id, product_id: "", branch_id: "", status: "",
      description: "", quantity: "", issue_date: "", employee_id: "",
      created_by: loginData.id, updeted_by: loginData.id,
    });
    setShowModal(true);
  };

  const deleteHandle = async (issueId) => {
    if (!window.confirm("Delete this provision?")) return;
    try {
      const iss = issue.find((i) => i.id === issueId);
      const product = products.find((p) => p.id === iss?.product_id);
      if (!iss || !product) { toast.error("Record not found."); return; }
      await stockManagementApis.updateProductById(product.id, {
        ...product,
        total_issue_quantity: parseInt(product.total_issue_quantity) - parseInt(iss.quantity),
        available_stock: parseInt(product.available_stock) + parseInt(iss.quantity),
      });
      await stockManagementApis.deleteIssue(issueId);
      toast.success("Provision deleted!");
      handleGetData();
    } catch { toast.error("Failed to delete."); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentIssue((prev) => ({ ...prev, [name]: value }));
  };

  const hasAdd = permissions?.some((r) => r.name === "Admin" || r.name === "Super Admin");
  const hasEdit = permissions?.some((r) => r.name === "Admin" || r.name === "Super Admin" || (r.name !== "Data Entry" && r.edit));
  const hasDelete = permissions?.some((r) => r.name === "Admin" || r.name === "Super Admin" || (r.name !== "Data Entry" && r.del));

  const columns = [
    {
      name: <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>S.No.</span>,
      selector: (_, i) => i + 1, width: "60px",
      cell: (_, i) => <span style={{ fontSize: 13, color: "#888" }}>{i + 1}</span>,
    },
    {
      name: <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>User</span>,
      selector: (r) => r.user_name, sortable: true,
      cell: (r) => (
        <NavLink to={`/issueDetailPage/${r.id}`} style={{ color: PURPLE, textDecoration: "none", fontSize: 13, fontWeight: 500 }}>
          {r.user_name}
        </NavLink>
      ),
    },
    {
      name: <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>Employee</span>,
      selector: (r) => r.employee_name, sortable: true,
      cell: (r) => <span style={{ fontSize: 13 }}>{r.employee_name}</span>,
    },
    {
      name: <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>Product</span>,
      selector: (r) => r.product_name, sortable: true,
      cell: (r) => <span style={{ fontSize: 13 }}>{r.product_name}</span>,
    },
    {
      name: <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>Qty</span>,
      selector: (r) => r.quantity, sortable: true, width: "70px",
      cell: (r) => (
        <span style={{ fontSize: 13, fontWeight: 500, background: "#EEEDFE", color: "#3C3489", padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap" }}>
          {r.quantity}
        </span>
      ),
    },
    {
      name: <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>Issue Date</span>,
      selector: (r) => r.issue_date, sortable: true,
      cell: (r) => <span style={{ fontSize: 13, color: "#555" }}>{format(parseISO(r.issue_date), "dd/MM/yyyy")}</span>,
    },
    {
      name: <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>Actions</span>,
      cell: (r) => (
        <div style={{ display: "flex", gap: 6 }}>
          {hasEdit && (
            <button onClick={() => handleShowModal(r)} style={{
              width: 30, height: 30, border: `0.5px solid ${PURPLE}`, borderRadius: 7,
              background: "transparent", color: PURPLE, cursor: "pointer", fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <i className="fa-regular fa-edit"></i>
            </button>
          )}
          {hasDelete && (
            <button onClick={() => deleteHandle(r.id)} style={{
              width: 30, height: 30, border: `0.5px solid ${CORAL}`, borderRadius: 7,
              background: "transparent", color: CORAL, cursor: "pointer", fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <i className="fa fa-trash"></i>
            </button>
          )}
        </div>
      ),
      ignoreRowClick: true, button: true, width: "100px",
    },
  ];

  const customStyles = {
    headRow: { style: { background: "#1e2128", minHeight: 40, borderRadius: "8px 8px 0 0" } },
    headCells: { style: { background: "#1e2128", color: "#fff", fontSize: 12, fontWeight: 600, paddingLeft: 12 } },
    rows: { style: { minHeight: 44, fontSize: 13, borderBottom: "0.5px solid rgba(0,0,0,0.06)" }, highlightOnHoverStyle: { background: "#f5f4ff", transition: "background 0.15s" } },
    cells: { style: { paddingLeft: 12 } },
    pagination: { style: { fontSize: 13, borderTop: "0.5px solid rgba(0,0,0,0.08)" } },
  };

  const inputStyle = {
    width: "100%", padding: "8px 12px", fontSize: 13,
    border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 8,
    background: "#fafafa", outline: "none", color: "#1a1a1a",
    fontFamily: "system-ui, sans-serif",
  };
  const labelStyle = { fontSize: 12, fontWeight: 500, color: "#555", marginBottom: 4, display: "block" };

  return (
    <>
      <style>{`
        .issue-input:focus { border-color: #534AB7 !important; box-shadow: 0 0 0 2px rgba(83,74,183,0.12); background: #fff !important; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .modal-box { background: #fff; border-radius: 14px; width: 100%; max-width: 680px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.18); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px 14px; border-bottom: 0.5px solid rgba(0,0,0,0.08); }
        .modal-body { padding: 20px 24px; }
        .modal-footer { padding: 14px 24px 18px; border-top: 0.5px solid rgba(0,0,0,0.08); display: flex; justify-content: flex-end; gap: 10px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px; }
        @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
      `}</style>

      {loader && (
        <div className="loading-state"><div className="loading"></div></div>
      )}

      <Main>
        <div style={{ padding: "16px 20px 0" }}>
          {/* Breadcrumb */}
          <nav style={{ fontSize: 13, color: "#aaa", marginBottom: 16 }}>
            <Link to="/Home" style={{ color: PURPLE, textDecoration: "none" }}>Home</Link>
            <span style={{ margin: "0 6px" }}>/</span>
            <span style={{ color: "#333", fontWeight: 500 }}>Provisions</span>
          </nav>

          {/* Page card */}
          <div style={{ ...cardBase, marginBottom: 24 }}>
            {/* Card header */}
            <div style={{ padding: "16px 20px", borderBottom: "0.5px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 500, color: "#1a1a1a", margin: 0 }}>Provision List</p>
                <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>{filteredCategories.length} records</p>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                {/* Search */}
                <div style={{ position: "relative" }}>
                  <i className="fa fa-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#aaa" }}></i>
                  <input
                    className="issue-input"
                    style={{ ...inputStyle, paddingLeft: 30, width: 200 }}
                    placeholder="Search…"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                </div>

                {/* Month filter */}
                <input
                  className="issue-input"
                  type="month"
                  style={{ ...inputStyle, width: 160 }}
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                />

                {hasAdd && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <NavLink to="/addmultiprovision" style={{ textDecoration: "none" }}>
                      <button style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 14px", borderRadius: 8, border: `0.5px solid ${PURPLE}`,
                        background: "transparent", color: PURPLE, fontSize: 13, fontWeight: 500, cursor: "pointer",
                      }}>
                        <i className="fa fa-plus" style={{ fontSize: 11 }}></i> Multi Provision
                      </button>
                    </NavLink>
                    <button
                      onClick={() => handleShowModal()}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 14px", borderRadius: 8, border: "none",
                        background: PURPLE, color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer",
                      }}
                    >
                      <i className="fa fa-plus" style={{ fontSize: 11 }}></i> Add Provision
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div style={{ padding: "0 20px 20px" }}>
              <DataTable
                columns={columns}
                data={filteredCategories}
                pagination
                fixedHeader
                fixedHeaderScrollHeight="420px"
                highlightOnHover
                customStyles={customStyles}
                dense
              />
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <p style={{ fontSize: 16, fontWeight: 500, margin: 0, color: "#1a1a1a" }}>
                    {currentIssue.id ? "Update Provision" : "Add Provision"}
                  </p>
                  <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>Fill in the details below</p>
                </div>
                <button onClick={() => setShowModal(false)} style={{
                  width: 30, height: 30, border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 8,
                  background: "transparent", cursor: "pointer", fontSize: 16, color: "#888",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>✕</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-row">
                    <div>
                      <label style={labelStyle}>User</label>
                      <input className="issue-input" style={{ ...inputStyle, background: "#f5f5f5", color: "#888" }} value={loginData.name} disabled />
                    </div>
                    <div>
                      <label style={labelStyle}>Employee <span style={{ color: CORAL }}>*</span></label>
                      <select className="issue-input" name="employee_id" value={currentIssue.employee_id} onChange={handleInputChange} required style={inputStyle}>
                        <option value="">Select employee</option>
                        {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label style={labelStyle}>Branch <span style={{ color: CORAL }}>*</span></label>
                      <select className="issue-input" name="branch_id" value={currentIssue.branch_id} onChange={handleInputChange} required style={inputStyle}>
                        <option value="">Select branch</option>
                        {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Product <span style={{ color: CORAL }}>*</span></label>
                      <select className="issue-input" name="product_id" value={currentIssue.product_id} onChange={handleInputChange} required style={inputStyle}>
                        <option value="">Select product</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label style={labelStyle}>Quantity <span style={{ color: CORAL }}>*</span></label>
                      <input className="issue-input" type="number" name="quantity" value={currentIssue.quantity}
                        onChange={handleInputChange} min={1} max={availableQty} disabled={availableQty <= 0} required style={inputStyle} />
                      {availableQty !== null && (
                        <span style={{ fontSize: 11, color: availableQty > 0 ? "#1D9E75" : CORAL, marginTop: 3, display: "block" }}>
                          {availableQty > 0 ? `Available: ${availableQty}` : "Out of stock"}
                        </span>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Issue Date <span style={{ color: CORAL }}>*</span></label>
                      <input className="issue-input" type="date" name="issue_date" value={currentIssue.issue_date}
                        onChange={handleInputChange}
                        min={moment().subtract(1, "months").startOf("month").format("YYYY-MM-DD")}
                        max={moment().format("YYYY-MM-DD")}
                        required style={inputStyle}
                      />
                      <span style={{ fontSize: 11, color: "#aaa", marginTop: 3, display: "block" }}>
                        From {moment().subtract(1, "months").startOf("month").format("DD MMM")} to today
                      </span>
                    </div>
                  </div>

                  <div className="form-row">
                    <div>
                      <label style={labelStyle}>Status <span style={{ color: CORAL }}>*</span></label>
                      <select className="issue-input" name="status" value={currentIssue.status} onChange={handleInputChange} required style={inputStyle}>
                        <option value="">Select status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Description</label>
                      <textarea className="issue-input" name="description" value={currentIssue.description}
                        onChange={handleInputChange} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setShowModal(false)} style={{
                    padding: "8px 20px", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.15)",
                    background: "transparent", color: "#555", fontSize: 13, fontWeight: 500, cursor: "pointer",
                  }}>Cancel</button>
                  <button type="submit" disabled={isSubmitting} style={{
                    padding: "8px 24px", borderRadius: 8, border: "none",
                    background: PURPLE, color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer",
                    opacity: isSubmitting ? 0.7 : 1,
                  }}>
                    {isSubmitting ? "Saving…" : currentIssue.id ? "Update" : "Add Provision"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ToastContainer position="top-right" autoClose={3000} />
      </Main>
    </>
  );
}