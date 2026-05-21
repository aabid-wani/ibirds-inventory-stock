const connection = require("../config/db.connect.js");


async function getLocation() {
  try {
    const result = await connection.query(
      `SELECT id, name FROM public.location ORDER BY name`
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
}


async function getLocationById(id) {
  try {
    const result = await connection.query(
      `SELECT id, name FROM public.location WHERE id = $1`,
      [id]
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
}

async function getLocationByName(name) {
  try {
    const result = await connection.query(
      `SELECT id, name FROM public.location WHERE name = $1`,
      [name]
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
}

async function addLocation(data) {
  try {
    const result = await connection.query(
      `INSERT INTO public.location (name,created_by) VALUES ($1,$2) RETURNING *`,
       [data.name,data.created_by]
    );
    return result.rows;
  } catch (error) {
    throw error; // bubble up 23505 for duplicate names
  }
}

// UPDATE
async function updateLocation(id,data) {
  try {
    const result = await connection.query(  `UPDATE public.location
         SET name = $1, updated_by =$2  WHERE id = $3
       RETURNING *`,
      [data.name,updated_by, id]
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
}

// DELETE (hard delete)
async function deleteLocation(id) {
  try {
    const result = await connection.query(
      `DELETE FROM public.location
       WHERE id = $1
       RETURNING id, name`,
      [id]
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
}
 
module.exports = {
  getLocation,
  getLocationById,
  getLocationByName,
  addLocation,
  updateLocation,
  deleteLocation,
};
