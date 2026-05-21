require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 3001
const os = require('os');
const multer = require('multer');
const fileURLToPath = require('url').fileURLToPath;
const path = require('path');
const hostname = os.hostname();
console.log('Hostname:', hostname);

const interfaces = os.networkInterfaces();
let currentIP = '';

for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    // Skip over internal (i.e., 127.0.0.1) and non-IPv4 addresses
    if (iface.family === 'IPv4' && !iface.internal) {
      currentIP = iface.address;
      break;
    }
  }
  if (currentIP) break;
}

console.log('Current IP:', currentIP);
var corsOptions = {
    origin: "*"
};  

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
// For parsing multipart/form-data
app.use(multer().any());
//in node js 
// const fileName = fileURLToPath(import.meta.url);
// const dirName = path.dirname(fileName);
// console.log('Current directory:', dirName);

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to application. server" }); 
});

require('./app/utils/stockAlert.js');
require("./app/routes/auth.routes.js")(app);
require("./app/routes/branch.routes.js")(app);
require("./app/routes/role.routes.js")(app);
require("./app/routes/prd_category.routes.js")(app);
require("./app/routes/product.routes.js")(app);
require('./app/routes/vendor.routes.js')(app);
require('./app/routes/issue.routes.js')(app);
require('./app/routes/order.routes.js')(app);
require('./app/routes/order_line_item.routes.js')(app);
require('./app/routes/permission.routes.js')(app);
require('./app/routes/module.routes.js')(app);
require('./app/routes/return.routes.js')(app);
require('./app/routes/employee.router.js')(app);
require('./app/routes/reports.router.js')(app);
require('./app/routes/assets.router.js')(app);
require('./app/routes/assets_type.router.js')(app);
require('./app/routes/location.router.js')(app);

app.listen(PORT, () => {
  console.log(`Server is running on port -${PORT}.`);
});