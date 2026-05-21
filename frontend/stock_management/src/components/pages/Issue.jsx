import React, { useContext, useEffect, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import {
  Container,
  Row,
  Col,
  Card,
  Breadcrumb,
  Button,
  Modal,
  Form,
} from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";
import DataTable from "react-data-table-component";
import { TextField, InputAdornment } from "@mui/material";
import Main from "../layout/Main";
import { AuthContext, } from "../context/AuthProvider";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format, parseISO } from 'date-fns';
import moment from "moment";
import "../css/loader.css";

export default function Issue() {
  const [issue, setIssue] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filterMonth, setFilterMonth] = useState(moment().format("YYYY-MM")); 
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [validated, setValidated] = useState(false);
  const [availableQty, setAvailableQty] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loader, setLoader] = useState(false);
  const { loginData } = useContext(AuthContext);

  const [currentIssue, setCurrentIssue] = useState({
    id: "",
    user_id: loginData.id,
    product_id: "",
    branch_id: "",
    status: "",
    description: "",
    quantity: "",
    issue_date: "",
    employee_id: "",
    updated_by: loginData?.id || null,
  });

  let { permissions } = useContext(AuthContext);

  const handleGetData = async () => {
    try {
      const result = await stockManagementApis.getIssue();
      console.log("issued get data: ", result);
      setIssue(result);
      setFilteredCategories(result);
    } catch (error) {
      console.error("Error fetching Issue: ", error);
      setIssue([]);
    }
  };

  useEffect(() => {
    handleGetData();
  }, []);

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "";
      return moment(dateString).format("DD/MM/YYYY");
    } catch {
      return "";
    }
  };
  // Updated filter with month

  useEffect(() => {
    const filtered = issue.filter((item) => {

      const search = filterText.toLowerCase();
      const issueDate = formatDate(item.issue_date || '');
      const matchesSearch =
        String(item.user_name || "").toLowerCase().includes(search) ||
        String(item.employee_name || "").toLowerCase().includes(search) ||
        String(item.product_name || "").toLowerCase().includes(search) ||
        String(item.quantity || "").toString().toLowerCase().includes(search)||
        issueDate.toLowerCase().includes(search) ||
        String(item.status || "").toLowerCase().includes(search);
      const matchesMonth = filterMonth
        ? moment(item.issue_date).format("YYYY-MM") === filterMonth
        : true;
      return matchesSearch && matchesMonth;
    });
    setFilteredCategories(filtered);
  }, [filterText, filterMonth, issue]);



 
  useEffect(() => {
    const fetchProductsRelated = async () => {
      try {
        const empResult = await stockManagementApis.getEmployees();
        const branchResult = await stockManagementApis.getBranch();
        const productResult = await stockManagementApis.getProduct();
        const userResult = await stockManagementApis.getAllUsers();
        setBranches(branchResult);
        setProducts(productResult);
        setEmployees(empResult);
        setUsers(userResult);
      } catch (error) {
        console.error("Error fetching options data:", error);
      }
    };
    fetchProductsRelated();
  }, []);

  const isValidIssueDate = (date) => {
    const today = moment().endOf("day");
    const inputDate = moment(date);
    const startOfLastMonth = moment().subtract(1, "months").startOf("month");
    const isValid =
      inputDate.isSameOrBefore(today) &&
      inputDate.isSameOrAfter(startOfLastMonth);
    if (!isValid) {
      toast.error(
        "Issue date must be between the start of last month and today."
      );
    }
    return isValid;
  };

  useEffect(() => {
    if (currentIssue.product_id) {
      const selectedProduct = products.find(
        (product) => product.id === currentIssue.product_id
      );
      if (selectedProduct) {
        let availableStock =
          selectedProduct.total_buy_quantity -
          selectedProduct.total_issue_quantity;
        setAvailableQty(availableStock || 0);
      }
    } else {
      setAvailableQty(null);
    }
  }, [currentIssue.product_id, products]);

  const handleSubmit = async (event) => {
    const form = event.currentTarget;
    event.preventDefault();
    setLoader(true);

    if (!isValidIssueDate(currentIssue.issue_date)) {
      toast.error(
        "Issue date must be between the start of last month and today."
      );
      setLoader(false);
      return;
    }

    const product = products.find(
      (prod) => prod.id === currentIssue.product_id
    );

    // console.log(product);
    if (!product) {
      toast.error("Product not found!");
      setAvailableQty(product.total_buy_quantity);
      setLoader(false);
      return;
    }
    setIsSubmitting(true);

    if (form.checkValidity() === false) {
      event.stopPropagation();
    } else {
      try {
        let updatedProduct;
        const product = products.find(
          (prod) => prod.id === currentIssue.product_id
        );

        if (!product) {
          toast.error("Product not found!");
          setLoader(false);
          return;
        }

        if (currentIssue.id) {
          // --- UPDATE CASE ---
          const previousIssue = issue.find((iss) => iss.id === currentIssue.id);
          const quantityDifference =
            currentIssue.quantity - previousIssue.quantity;
          // Check stock availability
          if (
            parseInt(quantityDifference) > 0 &&
            parseInt(product.total_buy_quantity) < parseInt(quantityDifference)
          ) {
            toast.error("Insufficient stock available!");
            setLoader(false);
            return;
          }
          // Update issue
          // console.log('currentIssue.Id',currentIssue.id, 'data',currentIssue);
          await stockManagementApis.updateIssue(currentIssue.id, currentIssue);
          updatedProduct = {
            ...product,
            total_issue_quantity:
              parseInt(product.total_issue_quantity) +
              parseInt(quantityDifference),
            available_stock:
              parseInt(product.available_stock) - parseInt(quantityDifference),
          };
          // console.log('updatedProduct',updatedProduct);
          await stockManagementApis.updateProduct(product.id, updatedProduct);
          toast.success("Issue updated successfully!");
          setLoader(false);
        } else {
          if (
            parseInt(product.total_buy_quantity) <
            parseInt(currentIssue.quantity)
          ) {
            toast.error("Insufficient stock available!");
            setLoader(false);
            return;
          }

          // console.log('currentIssue',currentIssue);

          let response = await stockManagementApis.addIssue(currentIssue);
          if (response.success) {
            toast.success("Issue added successfully!");
            setLoader(false);
          }

          updatedProduct = {
            ...product,
            available_stock:
              parseInt(product.available_stock) -
              parseInt(currentIssue.quantity),
            total_issue_quantity:
              parseInt(product.total_issue_quantity) +
              parseInt(currentIssue.quantity),
          };

          // console.log("updatedProduct ", updatedProduct);
          // console.log("product Id ", product.id);

          await stockManagementApis.updateProductById(
            product.id,
            updatedProduct
          );
          toast.success("Product stock updated!");
        }

        setShowModal(false);
        handleGetData();
      } catch (error) {
        console.error("Error submitting issue:", error);
        toast.error("Error submitting issue.");
        setLoader(false);
      }
    }
    setIsSubmitting(false);
    setValidated(true);
  };

  const handleShowModal = (issue = null) => {
    setValidated(false);
    if (issue) {
      setCurrentIssue({
        id: issue.id,
        user_id: issue.user_id || loginData.id,
        product_id: issue.product_id,
        branch_id: issue.branch_id,
        status: issue.status,
        description: issue.description,
        quantity: issue.quantity,
        issue_date: issue.issue_date,
        employee_id: issue.employee_name,
        created_by: loginData.id,
        updeted_by: loginData.id,
      });
    } else {
      // Reset to default values for adding new issue
      setCurrentIssue({
        id: "",
        user_id: loginData.id,
        product_id: "",
        branch_id: "",
        status: "",
        description: "",
        quantity: "",
        issue_date: "",
        employee_id: "",
        created_by: loginData.id,
        updeted_by: loginData.id,
      });
    }
    setShowModal(true);
  };

  const deleteHandle = async (issueId) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this record?"
    );
    if (!isConfirmed) return;

    try {
      // 1. Get issue details by ID
      const issueToDelete = issue.find((item) => item.id === issueId);
      if (!issueToDelete) {
        toast.error("Issue not found.");
        return;
      }

      // 2. Get associated product
      const product = products.find((p) => p.id === issueToDelete.product_id);
      if (!product) {
        toast.error("Associated product not found.");
        return;
      }

      // 3. Update product stock values
      const updatedProduct = {
        ...product,
        total_issue_quantity:
          parseInt(product.total_issue_quantity) -
          parseInt(issueToDelete.quantity),
        available_stock:
          parseInt(product.available_stock) + parseInt(issueToDelete.quantity),
      };

      // 4. Update product in DB
      await stockManagementApis.updateProductById(product.id, updatedProduct);

      // 5. Delete issue
      await stockManagementApis.deleteIssue(issueId);

      // 6. Update UI
      toast.success("Issue deleted and stock updated!");
      setIssue((prev) => prev.filter((item) => item.id !== issueId));
      handleGetData();
    } catch (error) {
      console.error("Error during deletion:", error);
      toast.error("Failed to delete issue or update stock.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentIssue((prevIssue) => ({
      ...prevIssue,
      [name]: value,
    }));
  };

  const columns = [
    {
      name: <b>S.No.</b>,
      selector: (row, index) => index + 1,
      sortable: true,
      width: "70px",
      style: {
        borderRight: "2px solid #dee2e6",
        fontWeight: "bold",
      },
    },
    {
      name: <b>User</b>,
      selector: (row) => row.user_name,
      sortable: true,
      cell: (row) => (
        <NavLink
          style={{ textDecoration: "none", color: "#007bff" }}
          to={`/issueDetailPage/${row.id}`}
        >
          {row.user_name}
        </NavLink>
      ),
    },
    {
      name: <b>Employee</b>,
      selector: (row) => row.employee_name,
      sortable: true,
    },
    {
      name: <b>Product</b>,
      selector: (row) => row.product_name,
      sortable: true,
    },

    { name: <b>Quantity</b>, selector: (row) => row.quantity, sortable: true },
    // { name: <b>Issue Date</b>, selector: (row) => row.issue_date, sortable: true },
    {
      name: <b>Issue Date</b>,
      selector: (row) => format(parseISO(row.issue_date), 'dd/MM/yyyy'), 
      sortable: true
    },
    
   // { name: <b>Branch</b>, selector: (row) => row.branch_name, sortable: true },
    // {
    //   name: <b>Status</b>,
    //   selector: (row) => (row.status === "active" ? "active" : "inactive"),
    //   sortable: true,
    // },
    {
      name: <b>Actions</b>,
      cell: (row) => {
        const hasEditPermission = permissions?.some(
          (role) =>
            role.name === "Admin" ||
            role.name === "Super Admin" ||
            (role.name !== "Data Entry" && role.edit)
        );
        const hasDeletePermission = permissions?.some(
          (role) =>
            role.name === "Admin" ||
            role.name === "Super Admin" ||
            (role.name !== "Data Entry" && role.del)
        );

        return (
          <>
            {hasEditPermission && (
              <Button
                className="mx-2 btn-sm border-0"
                onClick={() => handleShowModal(row)}
              >
                <i className="fa-regular fa-edit" aria-hidden="true"></i>
              </Button>
            )}
            {hasDeletePermission && (
              <Button
                className="bg-danger btn-sm border-0"
                onClick={() => deleteHandle(row.id)}
              >
                <i className="fa fa-trash" aria-hidden="true"></i>
              </Button>
            )}
          </>
        );
      },
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  const customStyles = {
    table: {
      style: {
        textAlign: "left",
      },
    },
    headCells: {
      style:{ 
          background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
          color:" #ecf0f1ff",
      }
    },
    headRow: {
      style: {
        minHeight: "30px",
      },
    },
    rows: {
      style: {
        minHeight: "34px",
      },
    },
  };

  const hasAddPermission = permissions?.some(
    (role) => role.name === "Admin" || role.name === "Super Admin"
  );

  return (
    <>
      {loader && (
        <div class="loading-state">
          <div class="loading"></div>
        </div>
      )}
      <Main>
        <div
          className="my-2 mt-4"
          style={{ position: "relative", left: "5px" }}
        >
          <Breadcrumb>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}>
              Home
            </Breadcrumb.Item>

            <Breadcrumb.Item active style={{ fontWeight: "bold" }}>
              {"Provisions List"}
            </Breadcrumb.Item>
          </Breadcrumb>
        </div>
        <Card
          style={{
            boxShadow:
              "0 4px 20px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Container fluid className="p-3">
            <p style={{ fontSize: "16px", fontWeight: "bold" }}>
              Provision List
            </p>

            <hr />
            <Row>
              <Col>
                <div className="d-flex justify-content-between">
                  <TextField
                    id="search"
                    label="Search"
                    variant="outlined"
                    type="text"
                    size="small"
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

                  <Form.Control
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    style={{ maxWidth: "200px", marginLeft: "10px" }}
                  />
                  
                  {hasAddPermission && (
                    <div>
                      <NavLink
                        to="/addmultiprovision"
                        style={{ textDecoration: "none" }}
                      >
                        <Button
                          className="btn-sm me-2"
                          style={{ height: "25px" }}
                        >
                          <i className="fa fa-plus" aria-hidden="true"></i>
                          &nbsp;Add Multi Provision
                        </Button>
                      </NavLink>

                      <Button
                        className="btn-sm"
                        style={{ height: "25px", marginTop: "" }}
                        onClick={() => handleShowModal()}
                      >
                        <i className="fa fa-plus" aria-hidden="true"></i>
                        &nbsp;Add Provision
                      </Button>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
            <br />
            <Row>
              <Col>
                <div className="table-responsive">
                  <DataTable
                    columns={columns}
                    data={filteredCategories}
                    pagination
                    fixedHeader
                    fixedHeaderScrollHeight="400px"
                    highlightOnHover
                    customStyles={customStyles}
                    dense
                  />
                </div>
              </Col>
            </Row>
          </Container>
        </Card>

        <Container>
          <Modal
            show={showModal}
            onHide={() => setShowModal(false)}
            centered
            backdrop="static"
            size="lg"
          >
            <Modal.Header closeButton>
              <Modal.Title>
                {currentIssue.id ? "Update Provision" : "Add Provision"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form noValidate validated={validated}>
                <Row>
                  <Col lg={6}>
                    <Form.Group controlId="user_id" className="mb-3">
                      <Form.Label>User</Form.Label>
                      <Form.Select
                        name="user_id"
                        value={currentIssue.user_id || loginData.id}
                        onChange={handleInputChange}
                        required
                        disabled
                      >
                        <option value={loginData.id}>{loginData.name}</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col lg={6}>
                    <Form.Group controlId="employee_id" className="mb-3">
                      <Form.Label>Employee</Form.Label>
                      <Form.Select
                        name="employee_id"
                        value={currentIssue.employee_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Employee</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col lg={6}>
                    <Form.Group controlId="branch_id" className="mb-3">
                      <Form.Label>Branch</Form.Label>
                      <Form.Select
                        name="branch_id"
                        value={currentIssue.branch_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Branch</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col lg={6}>
                    <Form.Group controlId="product_id" className="mb-3">
                      <Form.Label>Product</Form.Label>
                      <Form.Select
                        name="product_id"
                        value={currentIssue.product_id}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </Form.Select>
                      {/* {availableQty !== null && (
                        <small className="text-muted">Available Quantity: {availableQty}</small>
                      )} */}
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col lg={6}>
                    <Form.Group controlId="quantity" className="mb-3">
                      <Form.Label>Quantity</Form.Label>
                      <Form.Control
                        type="number"
                        name="quantity"
                        value={currentIssue.quantity}
                        onChange={handleInputChange}
                        min={availableQty > 0}
                        max={availableQty}
                        disabled={availableQty <= 0}
                        required
                      />
                      {availableQty !== null && (
                        <small className="text-muted">
                          Available Quantity: {availableQty}
                        </small>
                      )}
                    </Form.Group>
                  </Col>

                  <Col lg={6}>
                    <Form.Group controlId="issue_date" className="mb-3">
                      <Form.Label>Issue Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="issue_date"
                        value={currentIssue.issue_date}
                        onChange={handleInputChange}
                        min={moment()
                          .subtract(1, "months")
                          .startOf("month")
                          .format("YYYY-MM-DD")}
                        max={moment().format("YYYY-MM-DD")}
                        required
                      />
                      <Form.Text className="text-muted">
                        Must be between{" "}
                        {moment()
                          .subtract(1, "months")
                          .startOf("month")
                          .format("YYYY-MM-DD")}{" "}
                        and {moment().format("YYYY-MM-DD")}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col lg={6}>
                    <Form.Group controlId="status" className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        name="status"
                        value={currentIssue.status}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col lg={6}>
                    <Form.Group controlId="description" className="mb-3">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        name="description"
                        value={currentIssue.description}
                        onChange={handleInputChange}
                        rows={3}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="text-end">
                  <Button
                    variant="secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </Button>{" "}
                  <Button
                    type="submit"
                    variant="primary"
                    onClick={handleSubmit}
                  >
                    {currentIssue.id ? "Update" : "Add"}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
        </Container>
        <ToastContainer position="top-right" autoClose={3000} />
      </Main>
    </>
  );
}
