import React, { useEffect, useMemo, useState, useContext } from "react";
import stockManagementApis from "../apis/StockManagementApis";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, AreaChart, Area, CartesianGrid, Legend,
} from "recharts";
import Main from "../layout/Main";
import {
  Box, Typography, Grid, Paper, TextField, Select, MenuItem,
  FormControl, Checkbox, FormControlLabel, Card,
  CardContent, Button, Chip, Skeleton, IconButton, Avatar,
} from "@mui/material";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import OutboxOutlinedIcon from "@mui/icons-material/OutboxOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import TouchAppOutlinedIcon from "@mui/icons-material/TouchAppOutlined";

// ─── Design Tokens ────────────────────────────────────────────────────────────
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
  chart: ["#534AB7", "#1D9E75", "#D85A30", "#BA7517", "#6366F1", "#0284C7", "#EC4899", "#8B5CF6"],
};

const cardBase = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
  transition: "all 0.2s ease-in-out",
};

// ─── Stat Card Component ───────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon: Icon, trend }) {
  return (
    <Card elevation={0} sx={{ 
      ...cardBase, 
      position: "relative",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
        borderColor: accent,
      }
    }}>
      <Box sx={{ height: 4, background: accent, width: "100%" }} />
      <CardContent sx={{ p: "18px 20px !important", display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{
          width: 48,
          height: 48,
          borderRadius: "12px",
          background: `${accent}15`,
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon sx={{ fontSize: 26 }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.5 }}>
            {label}
          </Typography>
          <Box display="flex" alignItems="baseline" gap={1}>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
              {value}
            </Typography>
          </Box>
          {sub && (
            <Typography sx={{ fontSize: 11, color: "#94a3b8", mt: 0.5, fontWeight: 500 }}>
              {sub}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Ranked List Component ─────────────────────────────────────────────────────
function RankedList({ title, items, variant }) {
  const rankBg = variant === "top" ? COLORS.purpleLight : COLORS.coralLight;
  const rankColor = variant === "top" ? COLORS.purpleDark : COLORS.coral;
  return (
    <Paper elevation={0} sx={{ ...cardBase, p: "20px", height: "100%" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {title}
        </Typography>
        <Chip 
          label={variant === "top" ? "Fast Moving" : "Slow Moving"} 
          size="small" 
          sx={{ 
            fontSize: 10.5, 
            fontWeight: 600, 
            background: rankBg, 
            color: rankColor, 
            borderRadius: "6px",
            height: 20
          }} 
        />
      </Box>
      <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
        {items.length === 0 ? (
          <Typography sx={{ fontSize: 12.5, color: "#94a3b8", py: 2, textAlign: "center" }}>No activity recorded</Typography>
        ) : (
          items.map((p, i) => (
            <Box
              component="li"
              key={p.id || i}
              sx={{
                display: "flex", alignItems: "center", gap: 1.5,
                py: "10px",
                borderBottom: i < items.length - 1 ? "1px solid #f1f5f9" : "none",
                transition: "background 0.15s ease",
                "&:hover": { background: "#f8fafc" },
                borderRadius: "6px",
                px: 1
              }}
            >
              <Box sx={{
                width: 24, height: 24, borderRadius: "50%",
                background: rankBg, color: rankColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>
                {i + 1}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.name}
                </Typography>
                <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>
                  {p.category_name || "General"}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: rankColor }}>
                {p.usageCount} <span style={{ fontSize: 11, fontWeight: 400, color: "#94a3b8" }}>units</span>
              </Typography>
            </Box>
          ))
        )}
      </Box>
    </Paper>
  );
}

// ─── Custom Tooltips ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 2, p: "10px 14px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
      <Typography sx={{ fontSize: 12, color: "#94a3b8", mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#a5b4fc" }}>{payload[0].value} units dispatched</Typography>
    </Box>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Box sx={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 2, p: "10px 14px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>{d.name}</Typography>
      <Typography sx={{ fontSize: 12.5, color: "#38bdf8", fontWeight: 600 }}>₹{Number(d.total_purchase || 0).toLocaleString("en-IN")}</Typography>
      <Typography sx={{ fontSize: 11.5, color: "#94a3b8" }}>{d.total_orders} purchase orders</Typography>
    </Box>
  );
};

// ─── Activity & Session Tooltips ─────────────────────────────────────────────
const ActivityTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      background: "#0f172a",
      border: "1px solid #334155",
      borderRadius: "10px",
      p: "12px 14px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
      minWidth: 190
    }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", mb: 1, letterSpacing: "0.04em" }}>
        {label}
      </Typography>
      <Box display="flex" flexDirection="column" gap={0.75}>
        {payload.map((entry, index) => (
          <Box key={`act-${index}`} display="flex" justifyContent="space-between" alignItems="center" gap={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: entry.color, flexShrink: 0 }} />
              <Typography sx={{ fontSize: 12, color: "#cbd5e1" }}>{entry.name}</Typography>
            </Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
              {entry.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const SessionDurationTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload || {};
  return (
    <Box sx={{
      background: "#0f172a",
      border: "1px solid #334155",
      borderRadius: "10px",
      p: "12px 14px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
      minWidth: 190
    }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", mb: 1, letterSpacing: "0.04em" }}>
        {label}
      </Typography>
      <Box display="flex" flexDirection="column" gap={0.75}>
        <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#8B5CF6", flexShrink: 0 }} />
            <Typography sx={{ fontSize: 12, color: "#cbd5e1" }}>Total Duration</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
            {d.total_duration_minutes || 0} mins
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#EC4899", flexShrink: 0 }} />
            <Typography sx={{ fontSize: 12, color: "#cbd5e1" }}>Avg Session</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
            {d.avg_duration_minutes || 0} mins
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#38bdf8", flexShrink: 0 }} />
            <Typography sx={{ fontSize: 12, color: "#cbd5e1" }}>Sessions</Typography>
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
            {d.session_count || 0} logins
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

function formatTimeAgo(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onSelect }) {
  const stock = (parseFloat(product.total_buy_quantity) || 0) - (parseFloat(product.total_issue_quantity) || 0);
  const inStock = stock > 0;
  const isLowStock = inStock && stock <= (product.min_quantity || 5);

  let statusBg = "#dcfce7";
  let statusColor = "#15803d";
  let statusText = `${stock} in stock`;

  if (!inStock) {
    statusBg = "#fee2e2";
    statusColor = "#b91c1c";
    statusText = "Depleted (0)";
  } else if (isLowStock) {
    statusBg = "#fef3c7";
    statusColor = "#b45309";
    statusText = `Low (${stock})`;
  }

  return (
    <Card
      elevation={0}
      onClick={() => onSelect(product.id)}
      sx={{
        ...cardBase,
        cursor: "pointer",
        "&:hover": {
          borderColor: COLORS.purple,
          transform: "translateY(-2px)",
          boxShadow: "0 8px 20px rgba(83, 74, 183, 0.1)",
        },
      }}
    >
      <CardContent sx={{ p: "16px !important" }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} mb={0.75}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
            {product.name}
          </Typography>
          <span style={{
            fontSize: "10.5px",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "6px",
            background: statusBg,
            color: statusColor,
            flexShrink: 0
          }}>
            {statusText}
          </span>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" gap={1} mb={1.5}>
          <Typography sx={{ fontSize: 11.5, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
            {product.category_name || "General Goods"}
          </Typography>
          {product.vendors && product.vendors.length > 0 ? (
            <Box
              component="span"
              title={product.vendors.map((v) => v.name).join(", ")}
              sx={{
                fontSize: 10.5,
                color: "#475569",
                background: "#f1f5f9",
                px: 0.8,
                py: 0.2,
                borderRadius: "5px",
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                maxWidth: "55%",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              <i className="fa-solid fa-store" style={{ fontSize: 9.5, color: COLORS.purple }}></i>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {product.vendors[0].name?.trim()}{product.vendors.length > 1 ? ` +${product.vendors.length - 1}` : ""}
              </span>
            </Box>
          ) : (
            <Typography sx={{ fontSize: 10.5, color: "#94a3b8", fontStyle: "italic", flexShrink: 0 }}>
              No vendor
            </Typography>
          )}
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" pt={1} borderTop="1px solid #f1f5f9">
          <Chip
            label={`${product.usageCount || 0} issues`}
            size="small"
            sx={{
              fontSize: 11, height: 22, fontWeight: 600,
              background: COLORS.purpleLight, color: COLORS.purpleDark,
              borderRadius: "6px",
            }}
          />
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>
            ₹{Number(product.latest_price || product.avg_price || 0).toLocaleString("en-IN")}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Category Styles & User Helpers ──────────────────────────────────────────
const ACTION_CATEGORY_STYLES = {
  purchasing: { bg: "#EEEDFE", color: "#534AB7", border: "#C7C4F7", label: "Purchasing", icon: "fa-cart-shopping" },
  issuing: { bg: "#E1F5EE", color: "#1D9E75", border: "#A7E4D0", label: "Stock Issue", icon: "fa-paper-plane" },
  products: { bg: "#FAEEDA", color: "#BA7517", border: "#F3D59B", label: "Catalog / Stock", icon: "fa-boxes-stacked" },
  auth: { bg: "#E0F2FE", color: "#0284C7", border: "#BAE6FD", label: "Authentication", icon: "fa-user-lock" },
  general: { bg: "#F1F5F9", color: "#475569", border: "#CBD5E1", label: "System", icon: "fa-bolt" },
};

function getUserInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HomePage() {
  const { loginData } = useContext(AuthContext);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("usage_desc");
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(null);

  // ─── Activity & Session Analytics States ───
  const isSuperAdmin = loginData?.role_name === 'Super Admin';
  const [activityDays, setActivityDays] = useState(7);
  const [activityUserId, setActivityUserId] = useState(() => (loginData?.role_name === 'Super Admin' ? "all" : (loginData?.id || "all")));
  const [activityData, setActivityData] = useState({ trend: [], summary: {} });
  const [sessionData, setSessionData] = useState({ trend: [], summary: {} });
  const [timeline, setTimeline] = useState([]);
  const [timelineCategory, setTimelineCategory] = useState("all");
  const [systemUsers, setSystemUsers] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [refreshingActivity, setRefreshingActivity] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin && loginData?.id) {
      setActivityUserId(loginData.id);
    }
  }, [isSuperAdmin, loginData?.id]);

  const fetchActivityAnalytics = async (days = activityDays, userId = activityUserId, category = timelineCategory) => {
    try {
      setActivityLoading(true);
      const effectiveUserId = isSuperAdmin ? userId : (loginData?.id || userId);
      const [actRes, sessRes, timeRes] = await Promise.all([
        stockManagementApis.getActivityAnalytics(days, effectiveUserId),
        stockManagementApis.getSessionAnalytics(days, effectiveUserId),
        stockManagementApis.getActivityTimeline(25, effectiveUserId, category)
      ]);
      if (actRes) setActivityData(actRes);
      if (sessRes) setSessionData(sessRes);
      if (timeRes) setTimeline(timeRes);
    } catch (err) {
      console.warn("Failed loading activity telemetry:", err);
    } finally {
      setActivityLoading(false);
      setRefreshingActivity(false);
    }
  };

  useEffect(() => {
    fetchActivityAnalytics(activityDays, activityUserId, timelineCategory);
  }, [activityDays, activityUserId, timelineCategory, isSuperAdmin, loginData?.id]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    async function loadUsers() {
      try {
        const users = await stockManagementApis.getAllUsers();
        if (Array.isArray(users)) {
          setSystemUsers(users);
        }
      } catch (err) {
        console.warn("Could not load users for activity filter:", err);
      }
    }
    loadUsers();
  }, [isSuperAdmin]);

  const handleManualRefresh = () => {
    setRefreshingActivity(true);
    fetchActivityAnalytics(activityDays, activityUserId, timelineCategory);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [resProducts, resVendors] = await Promise.all([
          stockManagementApis.getProduct("/products"),
          stockManagementApis.getVendor("/vendors"),
        ]);
        setVendors(resVendors || []);
        setProducts(
          (resProducts || []).map((p) => ({ ...p, usageCount: parseFloat(p.total_issue_quantity) || 0 }))
        );
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalPurchase = useMemo(() => {
    return vendors.reduce((sum, v) => sum + parseInt(v.total_purchase || 0, 10), 0);
  }, [vendors]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category_name || "Uncategorized"));
    return ["All", ...Array.from(set)];
  }, [products]);

  const totalProductQuantity = useMemo(
    () => products.reduce((sum, p) => sum + parseFloat(p.total_buy_quantity || 0), 0),
    [products]
  );
  const totalIssueQuantity = useMemo(
    () => products.reduce((sum, p) => sum + parseFloat(p.total_issue_quantity || 0), 0),
    [products]
  );
  const totalStockOnHand = useMemo(
    () => Math.max(0, totalProductQuantity - totalIssueQuantity),
    [totalProductQuantity, totalIssueQuantity]
  );
  const lowStockCount = useMemo(
    () => products.filter((p) => {
      const stock = (parseFloat(p.total_buy_quantity) || 0) - (parseFloat(p.total_issue_quantity) || 0);
      return stock <= (p.min_quantity || 5);
    }).length,
    [products]
  );
  const activeProducts = useMemo(
    () => products.filter((p) => (p.usageCount || 0) > 0).length,
    [products]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products.filter((p) => {
      const stock = (parseFloat(p.total_buy_quantity) || 0) - (parseFloat(p.total_issue_quantity) || 0);
      if (showOnlyInStock && stock <= 0) return false;
      if (selectedCategory !== "All" && (p.category_name || "Uncategorized") !== selectedCategory) return false;
      if (selectedVendorId && selectedVendorId !== "All") {
        const matchesVendor =
          (Array.isArray(p.vendor_ids) && p.vendor_ids.some((vid) => String(vid).toLowerCase() === String(selectedVendorId).toLowerCase())) ||
          (Array.isArray(p.vendors) && p.vendors.some((v) => String(v.id).toLowerCase() === String(selectedVendorId).toLowerCase()));
        if (!matchesVendor) return false;
      }
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
      case "price_desc": list.sort((a, b) => (b.latest_price || 0) - (a.latest_price || 0)); break;
      case "price_asc": list.sort((a, b) => (a.latest_price || 0) - (b.latest_price || 0)); break;
      case "name_asc": list.sort((a, b) => (a.name || "").localeCompare(b.name || "")); break;
      default: break;
    }
    return list;
  }, [products, search, selectedCategory, selectedVendorId, sortBy, showOnlyInStock]);

  const topUsed = useMemo(() => [...products].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5), [products]);
  const leastUsed = useMemo(() => [...products].filter(p => p.usageCount >= 0).sort((a, b) => a.usageCount - b.usageCount).slice(0, 5), [products]);

  const usageBarData = useMemo(() =>
    [...products].sort((a, b) => b.usageCount - a.usageCount).slice(0, 8)
      .map((p) => ({
        name: p.name?.length > 14 ? p.name.slice(0, 14) + "…" : p.name,
        usage: p.usageCount || 0
      })),
    [products]
  );

  const vendorPieData = useMemo(() => {
    return vendors
      .filter((v) => parseInt(v.total_purchase || 0, 10) > 0)
      .slice(0, 6);
  }, [vendors]);

  return (
    <Main>
      <Box sx={{ p: { xs: 2, md: 3.5 }, background: "#f8fafc", minHeight: "100vh" }}>

        {/* ── Top Executive Welcome Banner ── */}
        <Box 
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            mb: 3.5,
            gap: 2,
            background: "#ffffff",
            p: 2.5,
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 1 }}>
              Enterprise Overview
              <span style={{ fontSize: 11, fontWeight: 600, background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 99 }}>
                Live Active
              </span>
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#64748b", mt: 0.25 }}>
              Welcome back, <strong>{loginData?.name || "Operator"}</strong>. Real-time stock valuation and operations metrics.
            </Typography>
          </Box>

          {/* Quick Action Command Launchpad */}
          <Box display="flex" flexWrap="wrap" gap={1.25} alignItems="center">
            <NavLink to="/order" style={{ textDecoration: "none" }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<i className="fa-solid fa-cart-plus" style={{ fontSize: 13 }}></i>}
                sx={{
                  borderColor: "#cbd5e1",
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: 12.5,
                  borderRadius: "9px",
                  textTransform: "none",
                  py: 0.75,
                  px: 1.5,
                  "&:hover": { borderColor: COLORS.purple, color: COLORS.purple, background: "#eeedfe" }
                }}
              >
                + New PO
              </Button>
            </NavLink>

            <NavLink to="/addMultipleProvision" style={{ textDecoration: "none" }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<i className="fa-solid fa-paper-plane" style={{ fontSize: 13 }}></i>}
                sx={{
                  borderColor: "#cbd5e1",
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: 12.5,
                  borderRadius: "9px",
                  textTransform: "none",
                  py: 0.75,
                  px: 1.5,
                  "&:hover": { borderColor: COLORS.coral, color: COLORS.coral, background: "#faece7" }
                }}
              >
                + Issue Stock
              </Button>
            </NavLink>

            <NavLink to="/product" style={{ textDecoration: "none" }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<i className="fa-solid fa-boxes-stacked" style={{ fontSize: 13 }}></i>}
                sx={{
                  background: COLORS.purple,
                  fontWeight: 600,
                  fontSize: 12.5,
                  borderRadius: "9px",
                  textTransform: "none",
                  py: 0.75,
                  px: 1.75,
                  boxShadow: "0 2px 8px rgba(83, 74, 183, 0.25)",
                  "&:hover": { background: COLORS.purpleDark }
                }}
              >
                Stock Management
              </Button>
            </NavLink>
          </Box>
        </Box>

        {/* ── KPI Stat Cards ── */}
        <Grid container spacing={2} mb={3.5}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Stock on Hand"
              value={loading ? "—" : totalStockOnHand.toLocaleString("en-IN")}
              sub={`Total Acquired: ${totalProductQuantity.toLocaleString("en-IN")} units`}
              accent={COLORS.purple}
              icon={Inventory2OutlinedIcon}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Stock Dispatched"
              value={loading ? "—" : totalIssueQuantity.toLocaleString("en-IN")}
              sub="Total provisioned to departments"
              accent={COLORS.coral}
              icon={OutboxOutlinedIcon}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Active Movement SKUs"
              value={loading ? "—" : activeProducts}
              sub={`${lowStockCount} items at or below safety stock`}
              accent={COLORS.teal}
              icon={CheckCircleOutlineIcon}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Procurement Spend"
              value={loading ? "—" : `₹${totalPurchase.toLocaleString("en-IN")}`}
              sub={`Across ${vendors.length} vendor partners`}
              accent={COLORS.amber}
              icon={ShoppingCartOutlinedIcon}
            />
          </Grid>
        </Grid>

        {/* ── User Interaction Tracking & Session Analytics Suite ── */}
        <Paper elevation={0} sx={{ ...cardBase, p: { xs: 2, md: 3 }, mb: 3.5, border: "1px solid #e2e8f0" }}>
          {/* Header & Controls Toolbar */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "center" },
              mb: 2.5,
              gap: 2,
            }}
          >
            <div>
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.25, py: 0.35, borderRadius: 99, background: "#EEEDFE", color: "#534AB7", fontSize: 11, fontWeight: 700, mb: 0.75 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: "50%", background: "#534AB7", boxShadow: "0 0 0 3px rgba(83, 74, 183, 0.25)" }} />
                {isSuperAdmin ? "REAL-TIME ENTERPRISE TELEMETRY" : "MY ACTIVITY TELEMETRY"}
              </Box>
              <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 1 }}>
                {isSuperAdmin ? "User Activity & Login Session Analytics" : "My Actions & Session Tracker"}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: "#64748b", mt: 0.25 }}>
                {isSuperAdmin
                  ? "Continuous audit tracking of operator actions (purchasing, issuing, stock adjustments) and session durations across the organization."
                  : `Real-time tracker of all actions performed by you (${loginData?.name || "Operator"}) and your active session duration.`}
              </Typography>
            </div>

            {/* Filter and Control Toolbar */}
            <Box display="flex" flexWrap="wrap" gap={1.25} alignItems="center">
              {/* User Dropdown Filter: ONLY FOR SUPER ADMIN */}
              {isSuperAdmin ? (
                <FormControl size="small" sx={{ minWidth: 185 }}>
                  <Select
                    value={activityUserId}
                    onChange={(e) => setActivityUserId(e.target.value)}
                    sx={{
                      fontSize: 12.5,
                      borderRadius: "9px",
                      background: "#f8fafc",
                      "& fieldset": { borderColor: "#cbd5e1" },
                      "&:hover fieldset": { borderColor: COLORS.purple },
                      "&.Mui-focused fieldset": { borderColor: COLORS.purple },
                    }}
                  >
                    <MenuItem value="all" sx={{ fontSize: 12.5, fontWeight: 600 }}>All Team Members</MenuItem>
                    {systemUsers.map((u) => (
                      <MenuItem key={u.id} value={u.id} sx={{ fontSize: 12.5 }}>
                        {u.name} {u.role_name ? `(${u.role_name})` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.5,
                    py: 0.6,
                    borderRadius: "9px",
                    bgcolor: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <PersonOutlineOutlinedIcon sx={{ fontSize: 16, color: COLORS.purple }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                    {loginData?.name || "Operator"} ({loginData?.role_name || "User"})
                  </Typography>
                </Box>
              )}

              {/* Timeframe Button Group */}
              <Box display="flex" bgcolor="#f1f5f9" p="3px" borderRadius="9px" gap="2px">
                {[
                  { label: "7 Days", value: 7 },
                  { label: "14 Days", value: 14 },
                  { label: "30 Days", value: 30 },
                  { label: "All Time", value: "all" },
                ].map((tf) => (
                  <Button
                    key={tf.value}
                    size="small"
                    onClick={() => setActivityDays(tf.value)}
                    sx={{
                      fontSize: 11.5,
                      fontWeight: activityDays === tf.value ? 700 : 500,
                      color: activityDays === tf.value ? "#0f172a" : "#64748b",
                      bgcolor: activityDays === tf.value ? "#ffffff" : "transparent",
                      boxShadow: activityDays === tf.value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      borderRadius: "7px",
                      minWidth: 54,
                      py: 0.4,
                      px: 1,
                      textTransform: "none",
                      "&:hover": { bgcolor: activityDays === tf.value ? "#ffffff" : "#e2e8f0" }
                    }}
                  >
                    {tf.label}
                  </Button>
                ))}
              </Box>

              {/* Refresh Button */}
              <IconButton
                size="small"
                onClick={handleManualRefresh}
                sx={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "9px",
                  bgcolor: "#ffffff",
                  p: "7px",
                  color: "#64748b",
                  "&:hover": { borderColor: COLORS.purple, color: COLORS.purple, bgcolor: COLORS.purpleLight }
                }}
                title="Refresh Activity Telemetry"
              >
                <RefreshOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Activity Metric Counter Cards */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ p: 1.75, borderRadius: "10px", bgcolor: "#f0f9ff", border: "1px solid #bae6fd" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#0369a1", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {isSuperAdmin ? "Total User Actions" : "My Total Actions"}
                  </Typography>
                  <TouchAppOutlinedIcon sx={{ fontSize: 17, color: "#0284c7" }} />
                </Box>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#0c4a6e" }}>
                  {activityLoading ? "—" : (activityData.summary?.total_activities || 0).toLocaleString("en-IN")}
                </Typography>
                <Typography sx={{ fontSize: 11, color: "#0284c7", mt: 0.25, fontWeight: 500 }}>
                  {isSuperAdmin
                    ? `Active Users: ${activityData.summary?.active_users || 0}`
                    : `Operator: ${loginData?.name || "Me"}`}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ p: 1.75, borderRadius: "10px", bgcolor: "#eeedfe", border: "1px solid #c7c4f7" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#4338ca", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Purchasing
                  </Typography>
                  <i className="fa-solid fa-cart-shopping" style={{ fontSize: 14, color: "#6366f1" }}></i>
                </Box>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#312e81" }}>
                  {activityLoading ? "—" : (activityData.summary?.total_purchasing || 0).toLocaleString("en-IN")}
                </Typography>
                <Typography sx={{ fontSize: 11, color: "#6366f1", mt: 0.25, fontWeight: 500 }}>
                  PO creation & orders
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ p: 1.75, borderRadius: "10px", bgcolor: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#047857", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Stock Dispatches
                  </Typography>
                  <i className="fa-solid fa-paper-plane" style={{ fontSize: 14, color: "#10b981" }}></i>
                </Box>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#064e3b" }}>
                  {activityLoading ? "—" : (activityData.summary?.total_issuing || 0).toLocaleString("en-IN")}
                </Typography>
                <Typography sx={{ fontSize: 11, color: "#10b981", mt: 0.25, fontWeight: 500 }}>
                  Issued to staff & teams
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Box sx={{ p: 1.75, borderRadius: "10px", bgcolor: "#fffbeb", border: "1px solid #fde68a" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Catalog & Stock Adjusts
                  </Typography>
                  <i className="fa-solid fa-boxes-stacked" style={{ fontSize: 14, color: "#f59e0b" }}></i>
                </Box>
                <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#78350f" }}>
                  {activityLoading ? "—" : (activityData.summary?.total_products || 0).toLocaleString("en-IN")}
                </Typography>
                <Typography sx={{ fontSize: 11, color: "#b45309", mt: 0.25, fontWeight: 500 }}>
                  SKU adds & quick balances
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* ── Visual Graphs: Action Tracker (Line Chart) & Login Session Duration ── */}
          <Grid container spacing={2.5} mb={3}>
            {/* Action Velocity Tracker - Multi-line chart */}
            <Grid item xs={12} lg={7.5}>
              <Box sx={{ p: 2, borderRadius: "12px", border: "1px solid #f1f5f9", bgcolor: "#ffffff" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <div>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>
                      User Action Velocity Tracker (Line Chart)
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: "#64748b" }}>
                      Daily volume of all recorded operator actions across software modules
                    </Typography>
                  </div>
                  <Chip
                    label="Line Format"
                    size="small"
                    sx={{ fontSize: 10.5, fontWeight: 600, bgcolor: "#f1f5f9", color: "#475569", height: 22 }}
                  />
                </Box>

                {activityLoading ? (
                  <Skeleton variant="rectangular" height={300} sx={{ borderRadius: "10px" }} />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={activityData.trend || []} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="date_label"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={{ stroke: "#e2e8f0" }}
                        tickLine={false}
                        minTickGap={20}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<ActivityTooltip />} />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: 12, fontSize: 11.5, fontWeight: 600 }}
                      />
                      <Line
                        type="monotone"
                        name="Total Actions"
                        dataKey="total_actions"
                        stroke="#0284C7"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#0284C7", strokeWidth: 2, stroke: "#ffffff" }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        name="Purchasing"
                        dataKey="purchasing"
                        stroke="#6366F1"
                        strokeWidth={2.2}
                        dot={{ r: 3, fill: "#6366F1", strokeWidth: 2, stroke: "#ffffff" }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        name="Stock Issuing"
                        dataKey="issuing"
                        stroke="#10B981"
                        strokeWidth={2.2}
                        dot={{ r: 3, fill: "#10B981", strokeWidth: 2, stroke: "#ffffff" }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        name="Catalog / Items"
                        dataKey="products"
                        stroke="#F59E0B"
                        strokeWidth={2.2}
                        dot={{ r: 3, fill: "#F59E0B", strokeWidth: 2, stroke: "#ffffff" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Grid>

            {/* Login Session Duration Graph */}
            <Grid item xs={12} lg={4.5}>
              <Box sx={{ p: 2, borderRadius: "12px", border: "1px solid #f1f5f9", bgcolor: "#ffffff", height: "100%", display: "flex", flexDirection: "column" }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                  <div>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>
                      Login Session Duration
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: "#64748b" }}>
                      Active engagement time & average session length
                    </Typography>
                  </div>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.6,
                      px: 1,
                      py: 0.3,
                      borderRadius: 99,
                      bgcolor: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      color: "#047857",
                      fontSize: 10.5,
                      fontWeight: 700,
                    }}
                  >
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#10b981", boxShadow: "0 0 0 2px rgba(16,185,129,0.3)" }} />
                    {sessionData.summary?.active_now || 0} active now
                  </Box>
                </Box>

                {/* Session Duration Summary Strip */}
                <Box display="flex" gap={1.5} mb={1.5} p={1.25} bgcolor="#f8fafc" borderRadius="8px">
                  <Box flex={1}>
                    <Typography sx={{ fontSize: 10.5, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                      Total Duration
                    </Typography>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#6366f1" }}>
                      {sessionData.summary?.total_duration_minutes
                        ? sessionData.summary.total_duration_minutes >= 60
                          ? `${(sessionData.summary.total_duration_minutes / 60).toFixed(1)} hrs`
                          : `${sessionData.summary.total_duration_minutes}m`
                        : "0m"}
                    </Typography>
                  </Box>
                  <Box flex={1} borderLeft="1px solid #e2e8f0" pl={1.5}>
                    <Typography sx={{ fontSize: 10.5, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                      Avg Session
                    </Typography>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#ec4899" }}>
                      {sessionData.summary?.avg_duration_minutes || 0} mins
                    </Typography>
                  </Box>
                  <Box flex={1} borderLeft="1px solid #e2e8f0" pl={1.5}>
                    <Typography sx={{ fontSize: 10.5, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                      Logins
                    </Typography>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                      {sessionData.summary?.total_sessions || 0}
                    </Typography>
                  </Box>
                </Box>

                {activityLoading ? (
                  <Skeleton variant="rectangular" height={205} sx={{ borderRadius: "10px", flex: 1 }} />
                ) : (
                  <ResponsiveContainer width="100%" height={205}>
                    <AreaChart data={sessionData.trend || []} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                      <defs>
                        <linearGradient id="durationAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="date_label"
                        tick={{ fontSize: 10.5, fill: "#64748b" }}
                        axisLine={{ stroke: "#e2e8f0" }}
                        tickLine={false}
                        minTickGap={20}
                      />
                      <YAxis
                        tick={{ fontSize: 10.5, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        unit="m"
                      />
                      <Tooltip content={<SessionDurationTooltip />} />
                      <Area
                        type="monotone"
                        name="Total Mins"
                        dataKey="total_duration_minutes"
                        stroke="#8B5CF6"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#durationAreaGrad)"
                        dot={{ r: 3, fill: "#8B5CF6", strokeWidth: 1.5, stroke: "#ffffff" }}
                      />
                      <Line
                        type="monotone"
                        name="Avg Mins"
                        dataKey="avg_duration_minutes"
                        stroke="#EC4899"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 2.5, fill: "#EC4899", strokeWidth: 1, stroke: "#ffffff" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* ── Live User Interaction Audit Stream Feed ── */}
          <Box sx={{ p: 2, borderRadius: "12px", border: "1px solid #f1f5f9", bgcolor: "#ffffff" }}>
            <Box
              display="flex"
              flexDirection={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              mb={2}
              gap={1.5}
            >
              <div>
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 1 }}>
                  Live User Interaction Audit Stream
                  <Chip
                    label={`${timeline.length} Events`}
                    size="small"
                    sx={{ fontSize: 10.5, fontWeight: 600, bgcolor: COLORS.purpleLight, color: COLORS.purpleDark, height: 20 }}
                  />
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: "#64748b" }}>
                  Detailed chronological audit logs of user interactions and transactions
                </Typography>
              </div>

              {/* Feed Category Filter Chips */}
              <Box display="flex" flexWrap="wrap" gap={0.75}>
                {[
                  { id: "all", label: "All Events" },
                  { id: "purchasing", label: "Purchasing" },
                  { id: "issuing", label: "Stock Issuing" },
                  { id: "products", label: "Catalog / Items" },
                  { id: "auth", label: "Auth / Sessions" },
                ].map((cat) => (
                  <Chip
                    key={cat.id}
                    label={cat.label}
                    size="small"
                    onClick={() => setTimelineCategory(cat.id)}
                    sx={{
                      fontSize: 11,
                      fontWeight: timelineCategory === cat.id ? 700 : 500,
                      bgcolor: timelineCategory === cat.id ? COLORS.purple : "#f8fafc",
                      color: timelineCategory === cat.id ? "#ffffff" : "#475569",
                      border: "1px solid",
                      borderColor: timelineCategory === cat.id ? COLORS.purple : "#e2e8f0",
                      cursor: "pointer",
                      "&:hover": { bgcolor: timelineCategory === cat.id ? COLORS.purpleDark : "#e2e8f0" },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Event List */}
            {activityLoading ? (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={44} sx={{ borderRadius: "8px" }} />
                ))}
              </Box>
            ) : timeline.length === 0 ? (
              <Box py={4} textAlign="center">
                <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: 28, color: "#cbd5e1", marginBottom: 8, display: "block" }}></i>
                <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>No activity logs recorded matching this category filter.</Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 310, overflowY: "auto", pr: 0.5, display: "flex", flexDirection: "column", gap: 1 }}>
                {timeline.map((item) => {
                  const catStyle = ACTION_CATEGORY_STYLES[item.action_category] || ACTION_CATEGORY_STYLES.general;
                  return (
                    <Box
                      key={item.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        p: "10px 14px",
                        borderRadius: "9px",
                        bgcolor: "#f8fafc",
                        border: "1px solid #f1f5f9",
                        transition: "all 0.15s ease",
                        "&:hover": { bgcolor: "#ffffff", borderColor: "#cbd5e1", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" },
                      }}
                    >
                      {/* User Avatar */}
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: 11,
                          fontWeight: 700,
                          bgcolor: catStyle.bg,
                          color: catStyle.color,
                          border: `1px solid ${catStyle.border}`,
                          flexShrink: 0,
                        }}
                      >
                        {getUserInitials(item.user_name)}
                      </Avatar>

                      {/* Main Description & User Details */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>
                            {item.user_name || "Unknown Operator"}
                          </Typography>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              background: "#f1f5f9",
                              color: "#64748b",
                              padding: "1px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {item.role_name || "User"}
                          </span>
                        </Box>
                        <Typography sx={{ fontSize: 12, color: "#334155", mt: 0.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.description}
                        </Typography>
                      </Box>

                      {/* Action Category Badge */}
                      <Box
                        sx={{
                          display: { xs: "none", sm: "inline-flex" },
                          alignItems: "center",
                          gap: 0.5,
                          fontSize: 11,
                          fontWeight: 600,
                          bgcolor: catStyle.bg,
                          color: catStyle.color,
                          border: `1px solid ${catStyle.border}`,
                          borderRadius: "6px",
                          px: 1,
                          py: 0.35,
                          flexShrink: 0,
                        }}
                      >
                        <i className={`fa-solid ${catStyle.icon}`} style={{ fontSize: 10 }}></i>
                        {catStyle.label}
                      </Box>

                      {/* Timestamp */}
                      <Typography sx={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 500, flexShrink: 0, minWidth: 65, textAlign: "right" }}>
                        {formatTimeAgo(item.created_at)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Paper>

        {/* ── Charts & Velocity Grid ── */}
        <Grid container spacing={2.5} mb={3.5}>
          {/* Bar Chart: Dispatched Items */}
          <Grid item xs={12} lg={8}>
            <Paper elevation={0} sx={{ ...cardBase, p: "22px 24px" }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <div>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                    Top Consumption Velocity
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                    Highest dispatched materials across all branches
                  </Typography>
                </div>
                <NavLink to="/issue" style={{ textDecoration: "none", fontSize: 12, fontWeight: 600, color: COLORS.purple }}>
                  View Logs →
                </NavLink>
              </Box>

              {loading ? (
                <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={usageBarData} barSize={32} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickLine={false}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(83,74,183,0.06)" }} />
                    <Bar dataKey="usage" fill={COLORS.purple} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </Grid>

          {/* Ranked Lists */}
          <Grid item xs={12} lg={4}>
            <RankedList title="Fastest Moving SKUs" items={topUsed} variant="top" />
          </Grid>
        </Grid>

        {/* ── Vendor Spend Breakdown ── */}
        <Paper elevation={0} sx={{ ...cardBase, p: "22px 24px", mb: 3.5 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
            <div>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                Supplier Purchase Distribution
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                Procurement capital breakdown by vendor partners
              </Typography>
            </div>
            {selectedVendorId && (
              <Button
                size="small"
                onClick={() => setSelectedVendorId(null)}
                sx={{
                  fontSize: 12, textTransform: "none", color: COLORS.purple,
                  border: `1px solid ${COLORS.purple}`, borderRadius: "6px",
                  py: 0.25, px: 1.5,
                }}
              >
                Reset Filter
              </Button>
            )}
          </Box>

          {loading ? (
            <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
          ) : (
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={5}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={vendorPieData}
                      dataKey="total_purchase"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={3}
                      onClick={(_, index) => {
                        const vendor = vendorPieData[index];
                        if (vendor) {
                          setSelectedVendorId((prev) => (prev === vendor.id ? null : vendor.id));
                        }
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {vendorPieData.map((vendor, index) => {
                        const isSelected = selectedVendorId === vendor.id;
                        const isDimmed = selectedVendorId && !isSelected;
                        return (
                          <Cell
                            key={vendor.id}
                            fill={COLORS.chart[index % COLORS.chart.length]}
                            opacity={isDimmed ? 0.35 : 1}
                            stroke={isSelected ? "#1e293b" : "#ffffff"}
                            strokeWidth={isSelected ? 3 : 2}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>

              <Grid item xs={12} md={7}>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  {vendorPieData.map((vendor, index) => {
                    const spend = parseInt(vendor.total_purchase || 0, 10);
                    const pct = totalPurchase > 0 ? ((spend / totalPurchase) * 100).toFixed(1) : 0;
                    const isSelected = selectedVendorId === vendor.id;
                    return (
                      <Box
                        key={vendor.id}
                        display="flex"
                        alignItems="center"
                        gap={1.5}
                        p={1}
                        sx={{
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          background: isSelected ? "#f5f3ff" : "transparent",
                          border: isSelected ? `1.5px solid ${COLORS.purple}` : "1.5px solid transparent",
                          "&:hover": { background: isSelected ? "#ede9fe" : "#f8fafc" },
                        }}
                        onClick={() => setSelectedVendorId((prev) => (prev === vendor.id ? null : vendor.id))}
                      >
                        <Box sx={{ width: 12, height: 12, borderRadius: "4px", background: COLORS.chart[index % COLORS.chart.length], flexShrink: 0 }} />
                        <Typography sx={{ flex: 1, fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? COLORS.purpleDark : "#1e293b" }}>
                          {vendor.name}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                          {vendor.total_orders || 0} orders
                        </Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0f172a", minWidth: 80, textAlign: "right" }}>
                          ₹{spend.toLocaleString("en-IN")}
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: COLORS.purple, minWidth: 40, textAlign: "right" }}>
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

        {/* ── Live Product Catalog Section ── */}
        <Box>
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            mb={2}
            gap={1.5}
          >
            <div>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                  Active Catalog Items
                </Typography>
                {(selectedVendorId || selectedCategory !== "All" || search || showOnlyInStock) && (
                  <Chip
                    label="Filtered"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: 10.5,
                      fontWeight: 600,
                      background: COLORS.purpleLight,
                      color: COLORS.purpleDark,
                    }}
                  />
                )}
              </Box>
              <Box display="flex" alignItems="center" gap={1} mt={0.25}>
                <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                  Showing {filtered.length} products matching criteria
                </Typography>
                {(selectedVendorId || selectedCategory !== "All" || search || showOnlyInStock) && (
                  <Button
                    size="small"
                    onClick={() => {
                      setSelectedVendorId(null);
                      setSelectedCategory("All");
                      setSearch("");
                      setShowOnlyInStock(false);
                    }}
                    sx={{
                      textTransform: "none",
                      fontSize: 11.5,
                      p: 0,
                      minWidth: "auto",
                      color: COLORS.purple,
                      fontWeight: 600,
                      "&:hover": { background: "transparent", textDecoration: "underline" },
                    }}
                  >
                    Reset all
                  </Button>
                )}
              </Box>
            </div>

            {/* Filter controls */}
            <Box display="flex" flexWrap="wrap" gap={1} alignItems="center">
              <TextField
                placeholder="Search catalog…"
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{
                  width: { xs: "100%", sm: 170 },
                  "& .MuiOutlinedInput-root": {
                    fontSize: 12.5, borderRadius: "9px", background: "#ffffff",
                    "& fieldset": { borderColor: "#cbd5e1" },
                    "&:hover fieldset": { borderColor: COLORS.purple },
                    "&.Mui-focused fieldset": { borderColor: COLORS.purple },
                  },
                }}
              />

              <FormControl size="small" sx={{ minWidth: 145 }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{
                    fontSize: 12.5, borderRadius: "9px", background: "#ffffff",
                    "& fieldset": { borderColor: "#cbd5e1" },
                    "&:hover fieldset": { borderColor: COLORS.purple },
                  }}
                >
                  <MenuItem value="usage_desc" sx={{ fontSize: 12.5 }}>Dispatches: High → Low</MenuItem>
                  <MenuItem value="usage_asc" sx={{ fontSize: 12.5 }}>Dispatches: Low → High</MenuItem>
                  <MenuItem value="price_desc" sx={{ fontSize: 12.5 }}>Price: High → Low</MenuItem>
                  <MenuItem value="price_asc" sx={{ fontSize: 12.5 }}>Price: Low → High</MenuItem>
                  <MenuItem value="name_asc" sx={{ fontSize: 12.5 }}>Name: A → Z</MenuItem>
                </Select>
              </FormControl>

              {/* Category Filter */}
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  sx={{
                    fontSize: 12.5, borderRadius: "9px", background: "#ffffff",
                    "& fieldset": { borderColor: selectedCategory !== "All" ? COLORS.purple : "#cbd5e1" },
                    "&:hover fieldset": { borderColor: COLORS.purple },
                  }}
                >
                  {categories.map((c) => (
                    <MenuItem key={c} value={c} sx={{ fontSize: 12.5 }}>
                      {c === "All" ? "All Categories" : c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Vendor Filter */}
              <FormControl size="small" sx={{ minWidth: 155 }}>
                <Select
                  value={selectedVendorId || "All"}
                  onChange={(e) => setSelectedVendorId(e.target.value === "All" ? null : e.target.value)}
                  sx={{
                    fontSize: 12.5, borderRadius: "9px", background: "#ffffff",
                    "& fieldset": { borderColor: selectedVendorId ? COLORS.purple : "#cbd5e1" },
                    "&:hover fieldset": { borderColor: COLORS.purple },
                  }}
                >
                  <MenuItem value="All" sx={{ fontSize: 12.5 }}>All Vendors</MenuItem>
                  {vendors.map((v) => (
                    <MenuItem key={v.id} value={v.id} sx={{ fontSize: 12.5 }}>
                      {v.name?.trim()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={showOnlyInStock}
                    onChange={(e) => setShowOnlyInStock(e.target.checked)}
                    size="small"
                    sx={{ color: "#94a3b8", "&.Mui-checked": { color: COLORS.purple } }}
                  />
                }
                label={<Typography sx={{ fontSize: 12.5, color: "#475569", fontWeight: 500 }}>In stock only</Typography>}
                sx={{ ml: 0 }}
              />
            </Box>
          </Box>

          {loading ? (
            <Grid container spacing={2}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                  <Skeleton variant="rectangular" height={130} sx={{ borderRadius: "12px" }} />
                </Grid>
              ))}
            </Grid>
          ) : filtered.length === 0 ? (
            <Paper elevation={0} sx={{ ...cardBase, p: 5, textAlign: "center" }}>
              <i className="fa-solid fa-box-open" style={{ fontSize: 36, color: "#cbd5e1", marginBottom: 12, display: "block" }}></i>
              <Typography sx={{ color: "#64748b", fontSize: 14, fontWeight: 500 }}>No products found matching your current filter criteria.</Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {filtered.map((p) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
                  <ProductCard product={p} onSelect={(id) => navigate(`/productDetailPage/${id}`)} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {error && (
          <Box mt={3} p={2} sx={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "10px" }}>
            <Typography sx={{ color: "#991b1b", fontSize: 13, fontWeight: 500 }}>System Error: {error}</Typography>
          </Box>
        )}
      </Box>
    </Main>
  );
}