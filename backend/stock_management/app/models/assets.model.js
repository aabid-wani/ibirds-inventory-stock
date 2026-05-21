const connection = require("../config/db.connect.js");

async function getAssets() {
  const { rows } = await connection.query(`
    SELECT  a.*,
        l.name          AS location_name,
        t.name          AS asset_type_name,
        t.is_movable ,  t.asset_no
      FROM  public.assets a
      JOIN  public.location     l ON l.id = a.location_id
      JOIN  public.asset_type   t ON t.id = a.asset_type_id
     ORDER  BY a.created_at DESC
  `);
  return rows;
}

async function getAssetById(id) {
  const { rows } = await connection.query(
    `SELECT * FROM public.assets WHERE id = $1`,
    [id]
  );
  return rows;          
}

async function addAsset(asset) {
  const {
    location_id,
    asset_type_id,
    brand_name,
    quantity,
    purchase_date,
    remarks,
    created_by,
    unit_cost
  } = asset;

  const { rows } = await connection.query(
    `INSERT INTO public.assets
       (location_id, asset_type_id, brand_name, 
        quantity, purchase_date, remarks, created_by, unit_cost)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      location_id,
      asset_type_id,
      brand_name,
      quantity,
      purchase_date,
      remarks,
      created_by,
      unit_cost,
    ]
  );
  return rows;
}

async function updateAsset(id, asset) {
  console.log('id=>',id,'asset=>',asset);
  const {
    location_id,
    asset_type_id,
    brand_name,
    quantity,
    purchase_date,
    remarks,
    modified_by,
    unit_cost,
  } = asset;

  const { rows } = await connection.query(
    `UPDATE public.assets
        SET location_id   = $1,
            asset_type_id = $2,
            brand_name    = $3,
            quantity      = $4,
            purchase_date = $5,
            remarks       = $6,
            unit_cost     = $7,
            modified_at   = NOW()
      WHERE id = $8
      RETURNING *`,
    [
      location_id,
      asset_type_id,
      brand_name,
      quantity,
      purchase_date,
      remarks,
      unit_cost,
      id,
    ]
  );
  return rows;
}

async function deleteAsset(id) {
  const { rows } = await connection.query(
    `DELETE FROM public.assets WHERE id = $1 RETURNING id`,
    [id]
  );
  return rows;
}

 async function assetReportQuarterly({ from, to } = {}) {
  const clauses = [];
  const params  = [];

  if (from) {
    params.push(from);                              
    clauses.push(`purchase_date >= $${params.length}`);
  }
  if (to) {
    params.push(to);                               
    clauses.push(`purchase_date <= $${params.length}`);
  }

  const where = clauses.length ? "WHERE " + clauses.join(" AND ") : "";

  const sql = `
    SELECT
      EXTRACT(YEAR FROM purchase_date)        AS year,
      EXTRACT(QUARTER FROM purchase_date)     AS qtr,
      SUM(quantity)                           AS total_units,
      COALESCE(SUM(quantity * unit_cost), 0)  AS total_cost
    FROM assets
    ${where}
    GROUP BY year, qtr
    ORDER BY year, qtr;
  `;

  const { rows } = await connection.query(sql, params);
  return rows;
}

async function assetListByQuarter({ year, quarter }) {
  const sql = `
    SELECT
      id,
      location_id,
      asset_type_id,
      brand_name,
      quantity,
      unit_cost,
      purchase_date,
      remarks
    FROM assets
    WHERE EXTRACT(YEAR    FROM purchase_date) = $1
      AND EXTRACT(QUARTER FROM purchase_date) = $2
    ORDER BY purchase_date, id;
  `;

  const { rows } = await connection.query(sql, [year, quarter]);
  return rows;
}


module.exports = {
  getAssets,
  getAssetById,
  addAsset,
  updateAsset,
  deleteAsset,
  assetReportQuarterly,
  assetListByQuarter
};
