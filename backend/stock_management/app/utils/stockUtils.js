const pool = require("../config/db.connect");

async function getOpeningAndClosingStock(productId, startDate, endDate, carriedStock = null, previousBuyQty = null) {
  // Fetch current total buy and created_at
  const productResult = await pool.query(`
    SELECT total_buy_quantity, created_at 
    FROM products 
    WHERE id = $1
  `, [productId]);

  if (productResult.rowCount === 0) throw new Error("Product not found");

  const { total_buy_quantity, created_at } = productResult.rows[0];
  const currentBuyQty = parseInt(total_buy_quantity);
  const productCreatedAt = new Date(created_at);
  const start = new Date(startDate);

  let openingStock = 0;
  // console.log(currentBuyQty,'',productCreatedAt,'',start);
  // console.log('carriedStock',carriedStock,'previousByQty',previousBuyQty);
  
  if (carriedStock !== null && previousBuyQty !== null) {
    // New stock added this month
    const newStockAdded = currentBuyQty - previousBuyQty;
    openingStock = carriedStock + newStockAdded;
    // console.log(openingStock);
    
  } else {
  
      const totalIssuesBefore = await pool.query(`
        SELECT COALESCE(SUM(quantity), 0) AS total 
        FROM issues 
        WHERE product_id = $1 AND issue_date < $2
      `, [productId, startDate]);

      const issuedBefore = parseInt(totalIssuesBefore.rows[0].total);
      openingStock = currentBuyQty - issuedBefore;
    
  }

  // Get issues this period
  const periodIssues = await pool.query(`
    SELECT COALESCE(SUM(quantity), 0) AS total 
    FROM issues 
    WHERE product_id = $1 AND issue_date BETWEEN $2 AND $3
  `, [productId, startDate, endDate]);

  const issuedThisPeriod = parseInt(periodIssues.rows[0].total);
  // console.log(openingStock,'',issuedThisPeriod);
  
  const closingStock = openingStock - issuedThisPeriod; 
  // console.log('closingStock',closingStock);
  

  return {
    openingStock,
    closingStock,
    totalBuyQtyThisMonth: currentBuyQty, // for next iteration
  };
}

module.exports = { getOpeningAndClosingStock };
