# 📐 StrataMetriq Architecture & Security Report

**Target Directory:** `D:\stock-management-ibirds`  
**Scan Duration:** `758ms`  

| Metric | Count |
|---|---|
| **Total Files Scanned** | 87 |
| **External Dependencies** | 83 |
| **Circular Loops** | 1 |
| **Duplicate Code Pairs** | 5 |
| **HIGH Severity Risks** | 🔴 63 |
| **MEDIUM Severity Risks** | 🟡 40 |
| **LOW Severity Risks** | 🔵 1 |

### 🚨 High Severity Risks

- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\config\db.connect.js:11`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\middleware\fetchapi.js:13`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\models\assets.model.js:58`: Found active debug statement (console, debugger, alert)
- **[SQL / NoSQL Injection]** in `D:\stock-management-ibirds\backend\stock_management\app\models\assets.model.js:117`: Raw string concatenation detected in database query (SQL injection risk)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\models\issue.model.js:103`: Found active debug statement (console, debugger, alert)
- **[SQL / NoSQL Injection]** in `D:\stock-management-ibirds\backend\stock_management\app\models\issue.model.js:73`: Raw string concatenation detected in database query (SQL injection risk)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\models\order.model.js:53`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\models\order_line_item.model.js:117`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\models\permission.model.js:53`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\models\product.model.js:222`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\models\reports.model.js:85`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\models\role.model.js:24`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\routes\assets.router.js:12`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\routes\assets_type.router.js:18`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\routes\auth.routes.js:30`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\routes\branch.routes.js:30`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\routes\employee.router.js:40`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\routes\issue.routes.js:16`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\routes\location.router.js:15`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\routes\module.routes.js:17`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\routes\order.routes.js:17`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\routes\order_line_item.routes.js:35`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\routes\permission.routes.js:20`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\routes\prd_category.routes.js:16`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\routes\product.routes.js:17`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\routes\reports.router.js:40`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\routes\role.routes.js:34`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\routes\vendor.routes.js:16`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\app\utils\stockAlert.js:109`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\backend\stock_management\server.js:61`: Found active debug statement (console, debugger, alert)
- **[Test data]** in `D:\stock-management-ibirds\frontend\stock_management\package.json:13`: Test suite, mock data, or test fixture detected
- **[Test data]** in `D:\stock-management-ibirds\frontend\stock_management\src\App.test.jsx:4`: Test suite, mock data, or test fixture detected
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\apis\StockManagementApis.jsx:5`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\assets\Assets.jsx:103`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\assets\AssetType.jsx:100`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\assets\Location.jsx:57`: Found active debug statement (console, debugger, alert)
- **[Hardcoded credentials]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\context\AuthProvider.jsx:76`: Hardcoded value found: secret, key, URL, IP address, or port
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\detailsPages\IssuedDetailPage.jsx:52`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\detailsPages\OrderDetailPage.jsx:83`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\detailsPages\ProductDetailPage.jsx:53`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\detailsPages\UserDetailPage.jsx:48`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\detailsPages\VendorDetailPage.jsx:32`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\layout\Header.jsx:398`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\login\Login.jsx:44`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\pages\AddMultipleProvision.jsx:64`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\pages\AddOrder.jsx:95`: Found active debug statement (console, debugger, alert)
- **[Temporary code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\pages\AddOrder.jsx:332`: Found temporary / hack / WIP code annotation
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\pages\AddOrderLineItem.jsx:35`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\pages\Branch.jsx:91`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\pages\Employee.jsx:68`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\pages\Issue.jsx:84`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\pages\Order.jsx:38`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\pages\OrderLineItem.jsx:21`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\pages\Product.jsx:119`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\pages\ProductCategory.jsx:39`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\pages\Profile.jsx:74`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\pages\User.jsx:88`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\pages\Vendor.jsx:53`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\permissions\CreatePermission.jsx:28`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\permissions\Module.jsx:39`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\permissions\Permissions.jsx:113`: Found active debug statement (console, debugger, alert)
- **[Debug code]** in `D:\stock-management-ibirds\frontend\stock_management\src\components\permissions\Role.jsx:67`: Found active debug statement (console, debugger, alert)
- **[Test data]** in `D:\stock-management-ibirds\frontend\stock_management\src\setupTests.jsx:1`: Test suite, mock data, or test fixture detected

