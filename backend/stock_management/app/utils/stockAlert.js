const cron = require("node-cron");
const nodemailer = require("nodemailer");
const db = require("../config/db.connect");
const fs = require("fs");
const path = require("path");

// Configure transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendStockAlert = async () => {
  try {
    const result = await db.query(`
      SELECT 
        name, 
        total_buy_quantity, 
        total_issue_quantity,
        min_quantity,
        (total_buy_quantity - total_issue_quantity) AS available_quantity
      FROM products
      WHERE (total_buy_quantity - total_issue_quantity) <= min_quantity
    `);

    const lowStockProducts = result.rows;

    if (lowStockProducts.length === 0) {
      // console.log("No low stock products found.");
      return;
    }

    // Format HTML content
    const productListHtml = lowStockProducts
      .map(
        (p, index) =>
          `<tr>
            <td>${index + 1}</td>
            <td>${p.name}</td>
            <td>${p.total_buy_quantity}</td>
            <td>${p.total_issue_quantity}</td>
            <td>${p.available_quantity}</td>
            <td>${p.min_quantity}</td>
          </tr>`
      )
      .join("");

    const htmlContent = `
      <h2>🔔 Low Stock Alert</h2>
      <p>The following products are below their minimum stock levels:</p>
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th>#</th>
            <th>Product Name</th>
            <th>Total Purchased</th>
            <th>Total Issued</th>
            <th>Available</th>
            <th>Min Required</th>
          </tr>
        </thead>
        <tbody>
          ${productListHtml}
        </tbody>
      </table>
      <p>Please check the attached CSV for detailed information.</p>
    `;

    // Create CSV content
    const csvContent = [
      ["Product Name", "Total Purchased", "Total Issued", "Available", "Min Required"],
      ...lowStockProducts.map((p) => [
        p.name,
        p.total_buy_quantity,
        p.total_issue_quantity,
        p.available_quantity,
        p.min_quantity,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const filePath = path.join(__dirname, "../temp/low_stock_report.csv");

    // Ensure the temp directory exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    fs.writeFileSync(filePath, csvContent);

    // Email options with attachment
    const mailOptions = {
      from: `"Stock Alert System" <${process.env.EMAIL_USER}>`,
      to: "ali.h@ibirdsservices.com", 
      cc: "admin@ibirdsservices.com",
      subject: "⚠️ Low Stock Alert - Action Required",
      html: htmlContent,
      attachments: [
        {
          filename: "Low_Stock_Report.csv",
          path: filePath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log("Low stock email sent with attachment.");

    // Optional: delete the temp file after sending
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error("Error sending stock alert email:", error);
  }
};

// Schedule: Every day at 11 AM
cron.schedule("0 11 * * *", sendStockAlert);
