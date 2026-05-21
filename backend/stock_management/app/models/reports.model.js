let connection = require("../config/db.connect");
const { getOpeningAndClosingStock } = require("../utils/stockUtils.js");
const { differenceInMonths, addMonths, format, startOfMonth, endOfMonth } = require('date-fns');


async function getIssuedProdQuantityMonthly(startDate, endDate) {
  try {
    const productResult = await connection.query(`
      SELECT DISTINCT p.name AS product_name, p.id AS product_id 
      FROM issues i 
      INNER JOIN products p ON i.product_id = p.id
      WHERE i.issue_date BETWEEN $1 AND $2
    `, [startDate, endDate]);

    const products = productResult.rows;
    const finalResult = [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const monthCount = differenceInMonths(end, start) + 1;

    for (const { product_name, product_id } of products) {
      let carriedStock = null;
      let previousBuyQty = null;

      for (let m = 0; m < monthCount; m++) {
        const monthStart = startOfMonth(addMonths(start, m));
        const monthEnd = endOfMonth(monthStart);

        // Daily issue breakdown
        const dailyResult = await connection.query(`
          SELECT 
            EXTRACT(DAY FROM i.issue_date)::int AS day,
            SUM(i.quantity)::int AS total,
            e.name AS employee_name,
            u.name AS issued_by
          FROM issues i
          INNER JOIN products p ON i.product_id = p.id
          LEFT JOIN employees e ON i.employee_id = e.id
          LEFT JOIN users u ON i.user_id = u.id
          WHERE p.id = $1 AND i.issue_date BETWEEN $2 AND $3
          GROUP BY day, e.name, u.name
          ORDER BY day
        `, [product_id, monthStart, monthEnd]);

        const dailyMap = {};
        const employeeNames = new Set();
        const issuedBys = new Set();

        dailyResult.rows.forEach(row => {
          dailyMap[row.day] = (dailyMap[row.day] || 0) + row.total;
          if (row.employee_name) employeeNames.add(row.employee_name);
          if (row.issued_by) issuedBys.add(row.issued_by);
        });

        const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
        const dailyArray = Array.from({ length: daysInMonth }, (_, i) => dailyMap[i + 1] || 0);

        const stock = await getOpeningAndClosingStock(
          product_id,
          format(monthStart, 'yyyy-MM-dd'),
          format(monthEnd, 'yyyy-MM-dd'),
          carriedStock,
          previousBuyQty
        );

        // Update carryover values
        carriedStock = stock.closingStock;
        previousBuyQty = stock.totalBuyQtyThisMonth;

        finalResult.push({
          product: product_name,
          month: format(monthStart, 'yyyy-MM'),
          opening_stock: stock.openingStock,
          daily: dailyArray,
          closing_stock: stock.closingStock,
          employee_name: Array.from(employeeNames).join(", ") || "N/A",
          issued_by: Array.from(issuedBys).join(", ") || "N/A",
        });
      }
    }

    return finalResult;
  } catch (error) {
    console.error('Error in getIssuedProdQuantityMonthly:', error);
    throw error;
  }
}


async function getIssuedProdQuantityYearly(startDate, endDate) {
  const productResult = await connection.query(
    `
    SELECT DISTINCT p.name AS product_name 
    FROM issues i 
    INNER JOIN products p ON i.product_id = p.id
    WHERE i.issue_date BETWEEN $1 AND $2
  `,
    [startDate, endDate]
  );

  const products = productResult.rows.map((row) => row.product_name);
  const finalResult = [];

  for (const product of products) {
    const monthlyResult = await connection.query(
    `
      SELECT 
        EXTRACT(MONTH FROM i.issue_date)::int AS month,
        SUM(i.quantity)::int AS total,
        e.name AS employee_name,
        u.name AS issued_by
      FROM issues i
      INNER JOIN products p ON i.product_id = p.id
      LEFT JOIN employees e ON i.employee_id = e.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE p.name = $1 AND i.issue_date BETWEEN $2 AND $3
      GROUP BY month, e.name, u.name
      ORDER BY month
    `,
      [product, startDate, endDate]
    );

    const monthlyMap = {};
    const employeeNames = new Set();
    const issuedBys = new Set();

    // ✅ Sum total by month even if multiple employees
    monthlyResult.rows.forEach((row) => {
      monthlyMap[row.month] = (monthlyMap[row.month] || 0) + row.total;

      if (row.employee_name) employeeNames.add(row.employee_name);
      if (row.issued_by) issuedBys.add(row.issued_by);
    });

    const monthlyArray = [];
    for (let i = 1; i <= 12; i++) {
      monthlyArray.push(monthlyMap[i] || 0);
    }

    const productRow = await connection.query(
      `SELECT id FROM products WHERE name = $1 LIMIT 1`,
      [product]
    );

    const productId = productRow.rows[0]?.id;

    let opening = 0;
    let closing = 0;
    if (productId) {
      const stock = await getOpeningAndClosingStock(productId, startDate, endDate);
      opening = stock.openingStock;
      closing = stock.closingStock;
    }

    finalResult.push({
      product,
      opening_stock: opening,
      monthly: monthlyArray,
      closing_stock: closing,
      employee_name: Array.from(employeeNames).join(', ') || "N/A",
      issued_by: Array.from(issuedBys).join(', ') || "N/A",
    });
  }

  return finalResult;
}


async function InventoryReport(year) {
  try {
    const result = await connection.query(
      `
     SELECT 
        p.id,
        p.name,
        p.total_buy_quantity,
        p.total_issue_quantity,
        (p.total_buy_quantity - p.total_issue_quantity) AS closing_stock,
        COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM i.issue_date) = $1 THEN i.quantity ELSE 0 END), 0) AS issued_this_year,
        COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM i.issue_date) = $1 - 1 THEN i.quantity ELSE 0 END), 0) AS issued_last_year
      FROM products p
      LEFT JOIN issues i ON p.id = i.product_id
      GROUP BY p.id, p.name, p.total_buy_quantity, p.total_issue_quantity
      ORDER BY p.name ASC;
    `,
      [year]
    );

    return result.rows;
  } catch (error) {
    console.error("Error fetching inventory report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getDayWiseIssuedEmployees(product, month, day) {
  try {
    const result = await connection.query(
      `
            SELECT 
                e.name AS employee_name,
                SUM(i.quantity) AS total_issued
            FROM issues i
            INNER JOIN employees e ON i.employee_id = e.id
            INNER JOIN products p ON i.product_id = p.id
            WHERE EXTRACT(MONTH FROM i.issue_date) = $1
            AND EXTRACT(DAY FROM i.issue_date) = $2
            AND p.name = $3
            GROUP BY e.name
        `,
      [month, day, product]
    );

    return result.rows;
  } catch (error) {
    throw error;
  }
}


async function lowStockReport(month) {
  try {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    const [year, mon] = month.split('-');
    const startDate = `${year}-${mon}-01`;
    const endDate = `${year}-${mon}-30`;

    // console.log('startDate =>', startDate);
    // console.log('endDate =>', endDate);
    let response = await connection.query(`
       SELECT 
          id, 
          name,
          total_buy_quantity,
          total_issue_quantity,
          (total_buy_quantity - total_issue_quantity) AS current_stock,
          min_quantity,
          created_at
        FROM products
        WHERE created_at BETWEEN $1 AND $2
          AND (total_buy_quantity - total_issue_quantity) <= min_quantity
        ORDER BY created_at ASC  
    `, [startDate, endDate]);

    return response;

  } catch (error) {
    throw error
  }
}

module.exports = {
  InventoryReport,
  getIssuedProdQuantityMonthly,
  getIssuedProdQuantityYearly,
  getDayWiseIssuedEmployees,
  lowStockReport
};
