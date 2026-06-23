import React, { useEffect, useMemo, useState } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import Main from "../layout/Main";
import {
  Box, Typography, Grid, Paper, TextField, Select, MenuItem,
  FormControl, InputLabel, Checkbox, FormControlLabel, Card,
  CardContent, Button, Chip, Skeleton,
} from "@mui/material";
import { NavLink } from "react-router-dom";

// ─── Design tokens ────────────────────────────────────────────────────────────
const COLORS = {
  purple: "#534AB7",
  purpleLight: "#EEEDFE",
  purpleDark: "#3C3489",
  coral: "#D85A30",
  coralLight: "#FAECE7",
  teal: "#1D9E75",
  tealLight: "#E1F5EE",
  amber: "#BA7517",
  amberLight: "#FAEEDA",
  chart: ["#534AB7", "#1D9E75", "#D85A30", "#BA7517", "#D4537E", "#378ADD"],
};

const cardBase = {
  background: "#fff",
  border: "0.5px solid rgba(0,0,0,0.1)",
  borderRadius: 12,
  overflow: "hidden",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <Card elevation={0} sx={{ ...cardBase, position: "relative" }}>
      <Box sx={{ height: 3, background: accent, width: "100%" }} />
      <CardContent sx={{ p: "14px 16px !important" }}>
        <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 26, fontWeight: 500, color: "#1a1a1a", lineHeight: 1.2 }}>
          {value}
        </Typography>
        {sub && (
          <Typography sx={{ fontSize: 11, color: "#aaa", mt: 0.5 }}>
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function RankedList({ title, items, variant }) {
  const rankBg = variant === "top" ? COLORS.purpleLight : COLORS.coralLight;
  const rankColor = variant === "top" ? COLORS.purpleDark : COLORS.coral;
  return (
    <Paper elevation={0} sx={{ ...cardBase, p: "16px 20px", height: "100%" }}>
      <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1.5 }}>
        {title}
      </Typography>
      <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
        {items.map((p, i) => (
          <Box
            component="li"
            key={p.id}
            sx={{
              display: "flex", alignItems: "center", gap: 1,
              py: "8px",
              borderBottom: i < items.length - 1 ? "0.5px solid rgba(0,0,0,0.07)" : "none",
            }}
          >
            <Box sx={{
              width: 22, height: 22, borderRadius: "50%",
              background: rankBg, color: rankColor,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 500, flexShrink: 0,
            }}>
              {i + 1}
            </Box>
            <Typography sx={{ flex: 1, fontSize: 13, color: "#333" }}>{p.name}</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#555" }}>
              {p.usageCount}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 2, p: "8px 12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <Typography sx={{ fontSize: 12, color: "#888", mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 500, color: COLORS.purple }}>{payload[0].value} uses</Typography>
    </Box>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Box sx={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 2, p: "8px 12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#333" }}>{d.name}</Typography>
      <Typography sx={{ fontSize: 12, color: "#888" }}>₹{Number(d.total_purchase || 0).toLocaleString("en-IN")}</Typography>
      <Typography sx={{ fontSize: 12, color: "#888" }}>{d.total_orders} orders</Typography>
    </Box>
  );
};

function ProductCard({ product }) {
  const stock = (product.total_buy_quantity || 0) - (product.total_issue_quantity || 0);
  const inStock = stock > 0;
  return (
    <Card
      elevation={0}
      sx={{
        ...cardBase,
        transition: "border-color 0.15s",
        "&:hover": { borderColor: COLORS.purple },
        cursor: "pointer",
      }}
    >
      <CardContent sx={{ p: "14px 16px !important" }}>
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a", mb: 0.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {product.name}
        </Typography>
        <Typography sx={{ fontSize: 11, color: "#aaa", mb: 1.25 }}>
          {product.category_name || "Uncategorized"}
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Chip
            label={`${product.usageCount} uses`}
            size="small"
            sx={{
              fontSize: 11, height: 22, fontWeight: 500,
              background: COLORS.purpleLight, color: COLORS.purpleDark,
              borderRadius: "99px",
            }}
          />
          <Typography sx={{ fontSize: 13, fontWeight: 500, color: inStock ? "#1a1a1a" : COLORS.coral }}>
            ₹{(product.latest_price || 0).toFixed(2)}
          </Typography>
        </Box>
        {!inStock && (
          <Typography sx={{ fontSize: 10, color: COLORS.coral, mt: 0.75, fontWeight: 500 }}>
            Out of stock
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("usage_desc");
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await stockManagementApis.getProduct("/products");
        const resVendors = await stockManagementApis.getVendor("/vendors");
        setVendors(resVendors || []);
        setProducts(
          (res || []).map((p) => ({ ...p, usageCount: p.total_issue_quantity || 0 }))
        );
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const totalPurchase = vendors.reduce((sum, v) => sum + parseInt(v.total_purchase || 0), 0);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category_name || "Uncategorized"));
    return ["All", ...Array.from(set)];
  }, [products]);

  const totalProductQuantity = useMemo(
    () => products.reduce((sum, p) => sum + parseFloat(p.total_buy_quantity || 0), 0),
    [products]
  );
  const totalIssueQuantity = useMemo(
    () => products.reduce((sum, p) => sum + parseFloat(p.total_issue || 0), 0),
    [products]
  );
  const activeProducts = useMemo(
    () => products.filter((p) => (p.usageCount || 0) > 0).length,
    [products]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products.filter((p) => {
      if (showOnlyInStock && !(p.total_buy_quantity - p.total_issue_quantity)) return false;
      if (selectedCategory !== "All" && (p.category_name || "Uncategorized") !== selectedCategory) return false;
      if (!q) return true;
      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
    });
    switch (sortBy) {
      case "usage_desc": list.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)); break;
      case "usage_asc": list.sort((a, b) => (a.usageCount || 0) - (b.usageCount || 0)); break;
      case "price_desc": list.sort((a, b) => (b.avg_price || 0) - (a.avg_price || 0)); break;
      case "price_asc": list.sort((a, b) => (a.max_price || 0) - (b.min_price || 0)); break;
      case "name_asc": list.sort((a, b) => (a.name || "").localeCompare(b.name || "")); break;
      default: break;
    }
    return list;
  }, [products, search, selectedCategory, sortBy, showOnlyInStock]);

  const topUsed = useMemo(() => [...filtered].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5), [filtered]);
  const leastUsed = useMemo(() => [...filtered].sort((a, b) => a.usageCount - b.usageCount).slice(0, 5), [filtered]);
  const usageBarData = useMemo(() =>
    [...filtered].sort((a, b) => b.usageCount - a.usageCount).slice(0, 10)
      .map((p) => ({ name: p.name?.length > 12 ? p.name.slice(0, 12) + "…" : p.name, usage: p.usageCount || 0 })),
    [filtered]
  );
  const vendorPieData = selectedVendorId
    ? vendors.filter((v) => v.id === selectedVendorId)
    : vendors.filter((v) => v.total_orders !== 0);

  return (
    <Main>
      <Box sx={{ p: 3, background: "#f6f7fb", minHeight: "100vh" }}>

        {/* ── Header ── */}
        <Box
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          mb={3}
          gap={2}
        >
          <Typography sx={{ fontSize: 20, fontWeight: 500, color: "#1a1a1a" }}>
            Dashboard
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1.25} alignItems="center">
            <TextField
              placeholder="Search products…"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                width: 180,
                "& .MuiOutlinedInput-root": {
                  fontSize: 13, borderRadius: "8px",
                  "& fieldset": { borderColor: "rgba(0,0,0,0.12)", borderWidth: "0.5px" },
                  "&:hover fieldset": { borderColor: COLORS.purple },
                  "&.Mui-focused fieldset": { borderColor: COLORS.purple, borderWidth: "1.5px" },
                },
              }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                displayEmpty
                sx={{
                  fontSize: 13, borderRadius: "8px",
                  "& fieldset": { borderColor: "rgba(0,0,0,0.12)", borderWidth: "0.5px" },
                  "&:hover fieldset": { borderColor: COLORS.purple },
                  "&.Mui-focused fieldset": { borderColor: COLORS.purple },
                }}
              >
                <MenuItem value="usage_desc" sx={{ fontSize: 13 }}>Usage: High → Low</MenuItem>
                <MenuItem value="usage_asc" sx={{ fontSize: 13 }}>Usage: Low → High</MenuItem>
                <MenuItem value="price_desc" sx={{ fontSize: 13 }}>Price: High → Low</MenuItem>
                <MenuItem value="price_asc" sx={{ fontSize: 13 }}>Price: Low → High</MenuItem>
                <MenuItem value="name_asc" sx={{ fontSize: 13 }}>Name: A → Z</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                sx={{
                  fontSize: 13, borderRadius: "8px",
                  "& fieldset": { borderColor: "rgba(0,0,0,0.12)", borderWidth: "0.5px" },
                  "&:hover fieldset": { borderColor: COLORS.purple },
                  "&.Mui-focused fieldset": { borderColor: COLORS.purple },
                }}
              >
                {categories.map((c) => (
                  <MenuItem key={c} value={c} sx={{ fontSize: 13 }}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showOnlyInStock}
                  onChange={(e) => setShowOnlyInStock(e.target.checked)}
                  size="small"
                  sx={{ color: "rgba(0,0,0,0.3)", "&.Mui-checked": { color: COLORS.purple } }}
                />
              }
              label={<Typography sx={{ fontSize: 13, color: "#555" }}>In stock only</Typography>}
              sx={{ ml: 0 }}
            />
          </Box>
        </Box>

        {/* ── Stat cards ── */}
        <Grid container spacing={1.5} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Total product qty"
              value={loading ? "—" : totalProductQuantity.toLocaleString("en-IN")}
              sub="Across all categories"
              accent={COLORS.purple}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Total issue qty"
              value={loading ? "—" : totalIssueQuantity.toLocaleString("en-IN")}
              sub="Items issued to date"
              accent={COLORS.coral}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Active products"
              value={loading ? "—" : activeProducts}
              sub="With stock movement"
              accent={COLORS.teal}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Total purchase"
              value={loading ? "—" : `₹${totalPurchase.toLocaleString("en-IN")}`}
              sub="Across all vendors"
              accent={COLORS.amber}
            />
          </Grid>
        </Grid>

        {/* ── Action buttons ── */}
        <Box display="flex" gap={1.5} mb={3} flexWrap="wrap">
          <NavLink to="/low_stock" style={{ textDecoration: "none" }}>
            <Button
              variant="contained"
              disableElevation
              sx={{
                background: COLORS.purple, borderRadius: "8px", fontSize: 13,
                textTransform: "none", fontWeight: 500, px: 2.5, py: 1,
                "&:hover": { background: COLORS.purpleDark },
              }}
            >
              Low stock report
            </Button>
          </NavLink>
          <NavLink to="/assets_report" style={{ textDecoration: "none" }}>
            <Button
              variant="contained"
              disableElevation
              sx={{
                background: COLORS.coral, borderRadius: "8px", fontSize: 13,
                textTransform: "none", fontWeight: 500, px: 2.5, py: 1,
                "&:hover": { background: "#b34a24" },
              }}
            >
              Get asset report
            </Button>
          </NavLink>
        </Box>

        {/* ── Lists + Bar chart ── */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} md={4}>
            <Box display="flex" flexDirection="column" gap={2} height="100%">
              <RankedList title="Most used products" items={topUsed} variant="top" />
              <RankedList title="Least used products" items={leastUsed} variant="bot" />
            </Box>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ ...cardBase, p: "20px 20px 12px" }}>
              <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", mb: 2 }}>
                Usage by product — top 10
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={usageBarData} barSize={28}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#aaa" }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={55}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#aaa" }}
                      axisLine={false}
                      tickLine={false}
                      width={32}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(83,74,183,0.06)" }} />
                    <Bar dataKey="usage" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* ── Vendor pie chart ── */}
        <Paper elevation={0} sx={{ ...cardBase, p: "20px", mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Top vendors by purchase
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#333" }}>
                Total: ₹{totalPurchase.toLocaleString("en-IN")}
              </Typography>
              {selectedVendorId && (
                <Button
                  size="small"
                  onClick={() => setSelectedVendorId(null)}
                  sx={{
                    fontSize: 12, textTransform: "none", color: COLORS.purple,
                    border: `0.5px solid ${COLORS.purple}`, borderRadius: "6px",
                    py: 0.25, px: 1.25, minWidth: 0,
                  }}
                >
                  Show all
                </Button>
              )}
            </Box>
          </Box>
          {loading ? (
            <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
          ) : (
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={vendorPieData}
                      dataKey="total_purchase"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      onClick={(_, index) => {
                        const vendor = vendorPieData[index];
                        if (vendor) setSelectedVendorId(vendor.id);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {vendorPieData.map((vendor, index) => (
                        <Cell
                          key={vendor.id}
                          fill={COLORS.chart[index % COLORS.chart.length]}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" flexDirection="column" gap={1.25}>
                  {vendorPieData.map((vendor, index) => {
                    const pct = totalPurchase > 0
                      ? ((vendor.total_purchase / totalPurchase) * 100).toFixed(1)
                      : 0;
                    return (
                      <Box
                        key={vendor.id}
                        display="flex"
                        alignItems="center"
                        gap={1.25}
                        sx={{ cursor: "pointer", "&:hover .vname": { color: COLORS.purple } }}
                        onClick={() => setSelectedVendorId(vendor.id)}
                      >
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", background: COLORS.chart[index % COLORS.chart.length], flexShrink: 0 }} />
                        <Typography className="vname" sx={{ flex: 1, fontSize: 13, color: "#333", transition: "color 0.15s" }}>
                          {vendor.name}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "#aaa", mr: 1 }}>
                          {vendor.total_orders} orders
                        </Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#333", minWidth: 36, textAlign: "right" }}>
                          {pct}%
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Grid>
            </Grid>
          )}
        </Paper>

        {/* ── Products grid ── */}
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Typography sx={{ fontSize: 16, fontWeight: 500, color: "#1a1a1a" }}>
              Products
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#aaa" }}>
              {filtered.length} items
            </Typography>
          </Box>
          {loading ? (
            <Grid container spacing={1.5}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                  <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>
          ) : filtered.length === 0 ? (
            <Paper elevation={0} sx={{ ...cardBase, p: 4, textAlign: "center" }}>
              <Typography sx={{ color: "#aaa", fontSize: 14 }}>No products match your filters.</Typography>
            </Paper>
          ) : (
            <Grid container spacing={1.5}>
              {filtered.map((p) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
                  <ProductCard product={p} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {error && (
          <Box mt={2} p={2} sx={{ background: "#fff1f0", border: "0.5px solid #ffa39e", borderRadius: 2 }}>
            <Typography sx={{ color: COLORS.coral, fontSize: 13 }}>Error: {error}</Typography>
          </Box>
        )}
      </Box>
    </Main>
  );
}