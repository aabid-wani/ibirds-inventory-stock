const connection = require("../config/db.connect.js");

// async function getProduct() {
//   try {
//     const result = await connection.query(`
//         SELECT
//         prod.*, cat.name AS category_name
//         from
//         products prod inner join product_category cat on prod.category_id = cat.id
//         ORDER BY prod.created_at DESC
//         `);
//     return result.rows;
//   } catch (error) {
//     throw error;
//   }
// }

async function getProduct() {
  try {
    const result = await connection.query(
      `SELECT 
          prod.*,  
          cat.name AS category_name, 
        sum(total_issue_quantity) as total_issue,
          (prod.total_buy_quantity - prod.total_issue_quantity) AS available_quantity, 
          AVG(oli.price) AS avg_price,
          MAX(oli.price) AS max_price,
          MIN(oli.price) AS min_price,
          (
              SELECT oli2.price 
              FROM order_line_item oli2 
              WHERE oli2.product_id = prod.id 
              LIMIT 1
          ) AS latest_price,
          (
              SELECT iss.issue_date
              FROM issues iss
              WHERE iss.product_id = prod.id
              ORDER BY iss.issue_date DESC
              LIMIT 1
          ) AS latest_issue_date
      FROM products AS prod 
      INNER JOIN product_category AS cat  
          ON prod.category_id = cat.id
      LEFT JOIN order_line_item AS oli  
          ON oli.product_id = prod.id
      GROUP BY prod.id, cat.name
      ORDER BY prod.created_at DESC;`
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
}

async function LowStockAvailable() {
  try {
    const result = await connection.query(`
      SELECT 
      name,
      total_buy_quantity, 
      total_issue_quantity,
      min_quantity,
      (total_buy_quantity - total_issue_quantity) AS available_quantity
      FROM products
      WHERE (total_buy_quantity - total_issue_quantity) <= min_quantity`);
    return result.rows;
  } catch (error) {
    throw error;
  }
}

async function getProductById(productId) {
  try {
    const query = `
            SELECT p.*, pc.name AS category_name 
            FROM products p
            INNER JOIN product_category pc ON p.category_id = pc.id
            WHERE p.id = $1
        `;
    const result = await connection.query(query, [productId]);
    // console.log(result.rows[0]);
    return result.rows;
  } catch (error) {
    throw error;
  }
}

async function addProduct(product) {
  // console.log("product =>", product);

  // Helper function to safely parse numbers
  function safeParseNumber(value) {
    if (value === undefined || value === null || value === "") return null;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }

  const total_buy_quantity = safeParseNumber(product.total_buy_quantity);
  const total_issue_quantity = safeParseNumber(product.total_issue_quantity);
  const min_quantity = safeParseNumber(product.min_quantity);
  const max_quantity = safeParseNumber(product.max_quantity);
  const measurement_unit = product.measurement_units || null;
  const available_stock = total_buy_quantity;

  //  1. Validation happens BEFORE any DB insert
  if ((min_quantity && !max_quantity) || (!min_quantity && max_quantity)) {
    throw new Error(
      "Both min_quantity and max_quantity must be provided if one is filled."
    );
  }

  if (min_quantity && max_quantity) {
    if (total_buy_quantity === null) {
      throw new Error(
        "total_buy_quantity is required when min and max are set."
      );
    }
    //  Corrected validation logic here
    if (!(
        total_buy_quantity >= min_quantity && total_buy_quantity <= max_quantity
      )) {
      throw new Error(
        `total_buy_quantity (${total_buy_quantity}) must be between min_quantity (${min_quantity}) and max_quantity (${max_quantity}).`
      );
    }
  }

  //  2. Only insert if validation passed
  try {
    const result = await connection.query(
      `
      INSERT INTO public.products(
        name, category_id, description, status,
        total_buy_quantity, total_issue_quantity,
        min_quantity, max_quantity, measurement_unit,
        available_stock, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        product.name,
        product.category_id,
        product.description,
        product.status,
        total_buy_quantity,
        total_issue_quantity,
        min_quantity,
        max_quantity,
        measurement_unit,
        available_stock,
        product.created_by || null,
      ]
    );

    return result.rows; // you can wrap this in { success: true, ... } if needed
  } catch (error) {
    throw error;
  }
}

async function updateProductStock(id, product) {
  // console.log("Updating productStock", id, product);
  try {
    let query = `UPDATE public.products SET `;
    let values = [];
    let setClauses = [];
    let index = 1;
    if (product.total_buy_quantity !== undefined) {
      setClauses.push(`total_buy_quantity = $${index++}`);
      values.push(product.total_buy_quantity);
    }

    if (product.total_issue_quantity !== undefined) {
      setClauses.push(`total_issue_quantity = $${index++}`);
      values.push(product.total_issue_quantity);
    }

    if (product.available_stock !== undefined) {
      setClauses.push(`available_stock = $${index++}`);
      values.push(product.available_stock);
    }

    if (setClauses.length === 0) {
      throw new Error("No valid fields to update.");
    }

    query += setClauses.join(", ");
    query += ` WHERE id = $${index} RETURNING *`;
    values.push(id);

    // console.log("QueryData", query);
    // console.log("ValuesData", values);

    const result = await connection.query(query, values);
    return result.rows;
  } catch (error) {
    throw error;
  }
}

async function updateProduct(id, product) {
  // console.log("productData=>", id, product);
  const {
    total_issue_quantity,
    total_buy_quantity,
    min_quantity,
    max_quantity,
    measurement_units,
  } = product;

  const parsedValues = {
    total_issue_quantity:
      total_issue_quantity === "" ? null : parseInt(total_issue_quantity, 10),
    total_buy_quantity:
      total_buy_quantity === "" ? null : parseInt(total_buy_quantity, 10),
    min_quantity: min_quantity === "" ? null : parseInt(min_quantity, 10),
    max_quantity: max_quantity === "" ? null : parseInt(max_quantity, 10),
    measurement_unit: measurement_units || null,
  };
 
 console.log('parsedValues',parsedValues);

  // if ( 
  //   parsedValues.min_quantity !== 0 &&  parsedValues.total_buy_quantity !== 0 &&
  //   (parsedValues.total_buy_quantity < parsedValues.min_quantity ||  parsedValues.total_buy_quantity > parsedValues.max_quantity) ) {
  //     throw new Error(
  //       `Total Buy Quantity (${parsedValues.total_buy_quantity}) should be between Minimum Quantity (${parsedValues.min_quantity}) and Maximum Quantity (${parsedValues.max_quantity}).`
  //     );
      
  // }
  try {
    // console.log("Updating full product", id, product);
    const result = await connection.query(
      `
            UPDATE public.products 
            SET 
                name = $1, 
                category_id = $2, 
                description = $3, 
                status = $4, 
                total_buy_quantity = $5, 
                total_issue_quantity = $6,
                min_quantity = $7,
                max_quantity = $8,
                measurement_unit = $9,
                updated_by = $10
            WHERE id = $11 
            RETURNING *
        `,
      [
        product.name,
        product.category_id,
        product.description,
        product.status,
        parsedValues.total_buy_quantity,
        parsedValues.total_issue_quantity,
        parsedValues.min_quantity,
        parsedValues.max_quantity,
        parsedValues.measurement_unit,
        product.updated_by || null,
        id,
      ]
    );
    // console.log("update product result", result.rows);
    return result.rows;
  } catch (error) {
    console.error("Update error:", error.message);
    throw error;
  }
}

async function deleteProduct(id) {
  try {
    const result = await connection.query(
      `DELETE FROM public.products WHERE id=$1 RETURNING *`,
      [id]
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
}

async function updateIssuedQuantities(updates) {
  console.log("bulk update product", updates);

  try {
    await connection.query("BEGIN");

    for (const { id, issued_qty } of updates) {
      // Get current product quantities
      const { rows } = await connection.query(
        "SELECT total_buy_quantity, total_issue_quantity FROM products WHERE id = $1",
        [id]
      );

      if (rows.length === 0) {
        throw new Error(`Product ID ${id} not found`);
      }

      const { total_buy_quantity, total_issue_quantity } = rows[0];
      const available = total_buy_quantity - total_issue_quantity;

      if (issued_qty > available) {
        throw new Error(`Not enough stock for product ID ${id}`);
      }

      // Update issued quantity
      await connection.query(
        "UPDATE products SET total_issue_quantity = total_issue_quantity + $1 WHERE id = $2",
        [issued_qty, id]
      );
    }

    await connection.query("COMMIT");
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  }
}

module.exports = {
  getProduct,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  LowStockAvailable,
  updateIssuedQuantities,
};
