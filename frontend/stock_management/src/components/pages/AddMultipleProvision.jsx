import React, { useEffect, useState, useContext } from "react";
import {
  Paper, Table, TableHead, TableRow, TableCell, TableBody, TextField,
  Select, MenuItem, Button, Typography, Box, IconButton,
  Checkbox, FormControlLabel, CircularProgress
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { API_BASE_URL } from '../CONSTANT/CONSTANT';
import Main from "../layout/Main";
import { AuthContext } from "../context/AuthProvider";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Breadcrumb } from "react-bootstrap";
import { Link } from "react-router-dom";
import moment from "moment";

const AddMultipleProvision = () => {
  const { loginData } = useContext(AuthContext);

  const createNewRow = () => ({
    user_id: loginData?.id || "",
    user_name: loginData?.name || "",
    employee: "",
    branch: "",
    product: "",
    qty: "",
    date: new Date().toISOString().split("T")[0],
    status: "inactive",
    description: "",
  });


  const fetchWithToken = async (url, options = {}) => {
  // console.log("Fetching URL:", url, 'options ' ,options);
  
  const token = sessionStorage.getItem('token');
  // console.log("Using Token:", token);

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
  try {
    // console.log("Headers:", headers, 'options ' ,options);
    const response = await fetch(url, { ...options, headers });
    // let data = await response.json();
    // console.log("Response Data:", data);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    // For DELETE, some APIs may not return JSON
    if (options.method === 'DELETE') {
      try { return await response.json(); } catch { return response.status; }
    }
    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
};

  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [rows, setRows] = useState([createNewRow()]);
  const [loading, setLoading] = useState(true); // for data fetch
  const [submitting, setSubmitting] = useState(false); // for submit loader

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [branchRes, productRes, employeeRes] = await Promise.all([
          fetchWithToken(`${API_BASE_URL}/branch`),
          fetchWithToken(`${API_BASE_URL}/product`),
          fetchWithToken(`${API_BASE_URL}/employee`),
        ]);

        const [branchData, productData, employeeData] = await Promise.all([ branchRes, productRes, employeeRes,]);
        setBranches(branchData);
        
        const availableProducts = productData.filter(p => p.available_quantity > 0);

        setProducts(availableProducts);
        setEmployees(employeeData);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loginData?.id]);

  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;

    if (field === "product") updated[index]["qty"] = "";
    setRows(updated);
  };

  const addRow = () => {
    setRows(prev => [...prev, createNewRow()]);
  };

  const removeRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated.length > 0 ? updated : [createNewRow()]);
  };

  const availableQty = (productId) => {
    const found = products.find(p => p.id === productId);
    return found ? found.available_quantity : 0;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const dataToSend = rows.map(({ user_name, ...rest }) => rest);

    try {
      

      const res = await fetchWithToken(`${API_BASE_URL}/issue/bulk`, {
        method: "POST",
        body: JSON.stringify(dataToSend),
      });

      console.log('res    =====',res);
      

      if (res.success) {
        const issuedMap = {};
        rows.forEach(row => {
          if (!issuedMap[row.product]) issuedMap[row.product] = 0;
          issuedMap[row.product] += Number(row.qty);
        });

        const productUpdates = Object.entries(issuedMap).map(([id, issued_qty]) => ({
          id: id,
          issued_qty,
        }));

        const updateRes = await fetchWithToken(`${API_BASE_URL}/product/update-quantities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productUpdates),
        });

        if (updateRes.success) {
          toast.success("Provisions added and product quantities updated!");
          setRows([createNewRow()]);
        } else {
          toast.error("Failed to update product quantities.");
        }
      } else {
        toast.error("Failed to add provisions.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Error submitting provisions.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Main>
      <div
          className="my-3 mt-4"
          style={{ position: "relative",fontSize: '16px' , left: "15px" }}
        >
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}>Home</Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/issue"}}>Issue</Breadcrumb.Item>
        <Breadcrumb.Item active style={{ fontWeight: "bold" }}>Add Multiple Provision</Breadcrumb.Item>
      </Breadcrumb>
      </div>

      <Paper sx={{ padding: 3, margin: 3 }}>
        <Typography variant="h5" gutterBottom>
          Add Multiple Provisions
        </Typography>

        <Box className="float-end mb-3" display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={addRow} disabled={loading || submitting}>
            + Add Row
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={rows.length === 0 || loading || submitting}
          >
            {submitting ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Submit All"}
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={5}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5", height: "25px" }}>
                <TableCell sx={{backgroundColor: "#343a40!important"}} >User</TableCell>
                <TableCell sx={{backgroundColor: "#343a40!important"}}>Employee</TableCell>
                <TableCell sx={{backgroundColor: "#343a40!important"}}>Branch</TableCell>
                <TableCell sx={{backgroundColor: "#343a40!important"}}>Product</TableCell>
                <TableCell sx={{backgroundColor: "#343a40!important"}}>Quantity</TableCell>
                <TableCell sx={{backgroundColor: "#343a40!important"}}>Date</TableCell>
                <TableCell sx={{backgroundColor: "#343a40!important"}}>Status</TableCell>
                <TableCell sx={{backgroundColor: "#343a40!important"}}>Description</TableCell>
                <TableCell sx={{backgroundColor: "#343a40!important"}}>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{row.user_name}</TableCell>

                  <TableCell>
                    <Select
                      fullWidth
                      value={row.employee}
                      onChange={(e) => handleChange(idx, "employee", e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="" disabled>Select employee</MenuItem>
                      {employees?.map(emp => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>

                  <TableCell>
                    <Select
                      fullWidth
                      value={row.branch}
                      onChange={(e) => handleChange(idx, "branch", e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="" disabled>Select branch</MenuItem>
                      {branches?.map(branch => (
                        <MenuItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>

                  <TableCell>
                    <Select
                      fullWidth
                      value={row.product}
                      onChange={(e) => handleChange(idx, "product", e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="" disabled>Select product</MenuItem>
                      {products?.map(product => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {row.product && (
                      <Typography variant="caption">
                        Available: {availableQty(row.product)}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <TextField
                      type="number"
                      fullWidth
                      value={row.qty}
                      onChange={(e) => handleChange(idx, "qty", e.target.value)}
                      disabled={availableQty(row.product) <= 0}
                      inputProps={{
                        max: availableQty(row.product),
                        min: 1,
                      }}
                    />
                  </TableCell>

                  <TableCell>
                  <TextField
                    type="date"
                    fullWidth
                    value={row.date}
                    onChange={(e) => handleChange(idx, "date", e.target.value)}
                    InputProps={{
                      inputProps: {
                        min: moment().subtract(1, "months").startOf("month").format("YYYY-MM-DD"),
                        max: moment().format("YYYY-MM-DD"),
                      },
                    }}
                  />
                  {/* <Typography variant="caption" color="textSecondary">
                    Must be between{" "}
                    {moment().subtract(1, "months").startOf("month").format("YYYY-MM-DD")} and{" "}
                    {moment().format("YYYY-MM-DD")}
                  </Typography> */}
                </TableCell>


                  <TableCell>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={row.status === "active"}
                          onChange={(e) =>
                            handleChange(idx, "status", e.target.checked ? "active" : "inactive")
                          }
                        />
                      }
                      label={row.status === "active" ? "Active" : "Inactive"}
                    />
                  </TableCell>

                  <TableCell>
                    <TextField
                      fullWidth
                      value={row.description}
                      onChange={(e) => handleChange(idx, "description", e.target.value)}
                      placeholder="Add description"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => removeRow(idx)} disabled={submitting}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
      <ToastContainer position="top-right" />
    </Main>
  );
};

export default AddMultipleProvision;
