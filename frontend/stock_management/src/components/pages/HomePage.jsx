import React, { useEffect, useMemo, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import { BarChart,  Bar, XAxis,  YAxis, Tooltip,  ResponsiveContainer,  PieChart,  Pie, Cell,  Legend, } from "recharts";
import Main from "../layout/Main";
import { Box,  Typography, Grid,   Paper, TextField, Select, MenuItem,  FormControl, InputLabel, Checkbox, FormControlLabel, Card,  CardContent,   Button, } from "@mui/material";
import { NavLink } from "react-router-dom";

export default function HomePage() {

  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("usage_desc");
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("All"); // Month filter
  const [selectedVendorId, setSelectedVendorId] = useState(null); // For vendor filtering

  useEffect(() => {    
    
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await stockManagementApis.getProduct("/products");
        let resVendors = await stockManagementApis.getVendor("/vendors");
        console.log(resVendors);
        
        setVendors(resVendors || []);
        const updatedProducts = (res || []).map((p) => ({
          ...p,
          usageCount: p.total_issue_quantity || 0,
        }));
        setProducts(updatedProducts);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const totalPurchase = vendors.reduce((sum, vendor) => sum + parseInt(vendor.total_purchase), 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AB47BC', '#26C6DA'];

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category_name || "Uncategorized"));
    return ["All", ...Array.from(set)];
  }, [products]);


  const totalProductQuantity = useMemo(
    () => products.reduce((sum, p) => sum + parseFloat(p.total_buy_quantity || 0), 0),
    [products]
  );

  // Total issue quantity
  const totalIssueQuantity = useMemo(
    () => products.reduce((sum, p) => sum + parseFloat(p.total_issue || 0), 0),
    [products]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = products.filter((p) => {
      if (showOnlyInStock && !(p.total_buy_quantity - p.total_issue_quantity)) return false;
      if (selectedCategory !== "All" && (p.category_name || "Uncategorized") !== selectedCategory) return false;
      if (selectedMonth !== "All" && p.last_used_month !== selectedMonth) return false; // Assuming API provides last_used_month
      if (!q) return true;
      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
    });

    switch (sortBy) {
      case "usage_desc":
        list.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        break;
      case "usage_asc":
        list.sort((a, b) => (a.usageCount || 0) - (b.usageCount || 0));
        break;
      case "price_asc":
        list.sort((a, b) => (a.max_price || 0) - (b.min_price || 0));
        break;
      case "price_desc":
        list.sort((a, b) => (b.avg_price || 0) - (a.avg_price || 0));
        break;
      case "name_asc":
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      default:
        break;
    }
    return list;
  }, [products, search, selectedCategory, sortBy, showOnlyInStock, selectedMonth]);

  const topUsed = useMemo(() => {
    return [...filtered].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).slice(0, 5);
  }, [filtered]);

  const leastUsed = useMemo(() => {
    return [...filtered].sort((a, b) => (a.usageCount || 0) - (b.usageCount || 0)).slice(0, 5);
  }, [filtered]);

  const usageBarData = useMemo(() => {
    return [...filtered]
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 10)
      .map((p) => ({ name: p.name, usage: p.usageCount || 0 }));
  }, [filtered]);

  return (
    <Main>
      <Box p={3}>
        
        {/* Header */}
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} justifyContent="space-between" mb={3}>
          <Typography variant="h5" fontWeight={600}>
            Dashboard
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
            <TextField
              label="Search"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FormControl size="small">
              <InputLabel>Sort By</InputLabel>
              <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
                <MenuItem value="usage_desc">Usage: High → Low</MenuItem>
                <MenuItem value="usage_asc">Usage: Low → High</MenuItem>
                <MenuItem value="price_desc">Price: High → Low</MenuItem>
                <MenuItem value="price_asc">Price: Low → High</MenuItem>
                <MenuItem value="name_asc">Name: A → Z</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Category</InputLabel>
              <Select value={selectedCategory} label="Category" onChange={(e) => setSelectedCategory(e.target.value)}>
                {categories.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
        
            <FormControlLabel
              control={<Checkbox checked={showOnlyInStock} onChange={(e) => setShowOnlyInStock(e.target.checked)} />}
              label="In stock only"
            />
          </Box>
        </Box>
        {/* Total Quantity Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ backgroundColor: "#f0f4ff" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600}>
                  Total Product Quantity
                </Typography>
                <Typography variant="h5">{totalProductQuantity}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card sx={{ backgroundColor: "#fff0f0" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600}>
                  Total Issue Quantity
                </Typography>
                <Typography variant="h5">{totalIssueQuantity}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box display="flex" gap={2} mb={3}>
            <NavLink exact to="/low_stock">
                <Button variant="contained"   
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                  Low Stock Report
                </Button>
            </NavLink>
            <NavLink exact to="/assets_report">
                <Button variant="contained"  color="secondary"
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                Get Asset Report
              </Button>
            </NavLink>
        </Box>

        {/* Stats + Charts */}
        <Grid container spacing={3}>
          {/* Most/Least used */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Most Used Products
              </Typography>
              <Box component="ol" sx={{ pl: 2, mt: 1 }}>
                {topUsed.map((p) => (
                  <li key={p.id}>
                    <Box display="flex" justifyContent="space-between">
                      <span>{p.name}</span>
                      <strong>{p.usageCount}</strong>
                    </Box>
                  </li>
                ))}
              </Box>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Least Used Products
              </Typography>
              <Box component="ol" sx={{ pl: 2, mt: 1 }}>
                {leastUsed.map((p) => (
                  <li key={p.id}>
                    <Box display="flex" justifyContent="space-between">
                      <span>{p.name}</span>
                      <strong>{p.usageCount}</strong>
                    </Box>
                  </li>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Usage by Product (Top 10)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={usageBarData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="usage" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>

      
          </Grid>
        </Grid>

        <div className="w-full h-[400px] flex flex-col items-center justify-center bg-white shadow-lg rounded-2xl p-4">
      <h2 className="text-xl font-semibold mb-4">Top Vendors by Purchase Orders</h2>
      <div className="mb-4 text-lg font-semibold">
        Total Purchase: ₹{totalPurchase.toLocaleString()}
        {/* {vendors[0].total_orders} */}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            dataKey="total_purchase"
            isAnimationActive={true}
            data={
              selectedVendorId
                ? vendors.filter(v => v.id === selectedVendorId)
                : vendors.filter(v => v.total_orders !== 0)
            }
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, branch_name, total_orders, total_purchase }) =>
              `${name} (${total_orders})`
            }
            onClick={(_, index) => {
              const data = selectedVendorId
                ? vendors.filter(v => v.id === selectedVendorId)
                : vendors.filter(v => v.total_orders !== 0);
              const vendor = data[index];
              if (vendor) setSelectedVendorId(vendor.id);
            }}
          >
            {(selectedVendorId
              ? vendors.filter(v => v.id === selectedVendorId)
              : vendors.filter(v => v.total_orders !== 0)
            ).map((vendor, index) => (
              <Cell key={vendor.id} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name, props) => {
              if (props.dataKey === "total_purchase") {
                return `₹${value.toLocaleString()}`;
              }
              return value;
            }}
            labelFormatter={(entry) =>
              `${entry.name} (${entry.branch_name}) - Orders: ${entry.total_orders}`
            }
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      {selectedVendorId && (
        <Button
          variant="outlined"
          color="primary"
          onClick={() => setSelectedVendorId(null)}
          style={{ marginTop: 16 }}
        >
          Show All Vendors
        </Button>
      )}
        </div>

        
        {/* Products */}
        <Box mt={4}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Products
          </Typography>
          {loading ? (
            <Paper sx={{ p: 3 }}>Loading...</Paper>
          ) : (
            <Grid container spacing={2}>
              {filtered.map((p) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {p.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {p.category_name}
                      </Typography>
                      <Typography variant="body2">Usage: {p.usageCount}</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ₹{(p.latest_price || 0).toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box> 

        {error && <Typography color="error">Error: {error}</Typography>}
         
      </Box>
    </Main>
  );
}
