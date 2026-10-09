const connection = require("../config/db.connect.js"); 


async function getUser() {
  try {
    const result = await connection.query(`
      SELECT users.*, roles.name AS role_name, branches.name AS branch_name 
        FROM 
            users
        INNER JOIN 
            roles ON users.role_id = roles.id
        INNER JOIN 
            branches ON users.branch_id = branches.id
        ORDER BY users.created_at DESC ; 
  `);
    return result.rows;
  } catch (error) {
    throw error;
  }
};


async function getAllUsers() {
  try {
    const result = await connection.query(`
      SELECT users.*, roles.name AS role_name, branches.name AS branch_name
      FROM users
      LEFT JOIN roles ON users.role_id = roles.id
      LEFT JOIN branches ON users.branch_id = branches.id
      WHERE users.status = 'active'
      ORDER BY users.created_at ASC
    `);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

async function getUserLoginByEmail(email) {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const result = await connection.query(`
        SELECT u.*, r.name As role_name FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        WHERE (LOWER(TRIM(u.email)) = $1 OR LOWER(TRIM(COALESCE(u.user_name, ''))) = $1) 
          AND u.status = 'active'
      `, [cleanEmail]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
}
async function getUserById(id) {

  try {
    const query = `
      														
	    SELECT users.*, branches.name AS branch_name, roles.name AS role_name
      FROM users 
      INNER JOIN branches ON users.branch_id = branches.id 
      INNER JOIN roles ON users.role_id = roles.id 
      WHERE users.id = $1
    `;
    const result = await connection.query(query, [id]);
  
    return result.rows;
  } catch (error) {
    throw error;
  }
}


async function addUser(user) {
  try {
    const { name, contact, email, role_id, user_name, password, status, branch_id, created_by } = user;
    const result = await connection.query("INSERT INTO public.users(name, contact, email, role_id, user_name, password, status, branch_id,created_by )VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
      [name, contact, email, role_id, user_name, password, status, branch_id, created_by]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
}

async function updateUser(id, user) {
  try {
    const existing = await connection.query("SELECT * FROM public.users WHERE id=$1", [id]);
    if (!existing.rows.length) return null;
    const current = existing.rows[0];

    const name = user.name !== undefined && user.name !== "" ? user.name : current.name;
    const contact = user.contact !== undefined && user.contact !== "" ? user.contact : current.contact;
    const email = user.email !== undefined && user.email !== "" ? user.email : current.email;
    const role_id = (user.role_id && user.role_id !== "") ? user.role_id : current.role_id;
    const user_name = user.user_name !== undefined && user.user_name !== "" ? user.user_name : current.user_name;
    const password = (user.password && user.password !== "") ? user.password : current.password;
    const status = user.status !== undefined && user.status !== "" ? user.status : current.status;
    const branch_id = (user.branch_id && user.branch_id !== "") ? user.branch_id : current.branch_id;
    const profile_image = user.profile_image !== undefined && user.profile_image !== "" ? user.profile_image : current.profile_image;
    const updated_by = (user.updated_by && user.updated_by !== "") ? user.updated_by : id;

    const result = await connection.query(
      `UPDATE public.users 
       SET name=$2, contact=$3, email=$4, role_id=$5, user_name=$6, password=$7, status=$8, branch_id=$9, updated_by=$10, profile_image=$11, updated_at=NOW() 
       WHERE id=$1 RETURNING *`,
      [id, name, contact, email, role_id, user_name, password, status, branch_id, updated_by, profile_image]
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
}

async function deleteUser(id) {
  try {
    const result = await connection.query("DELETE FROM public.users WHERE id=$1 RETURNING *", [id]);

    return result.rows[0];
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getUser,
  getUserById,
  getUserLoginByEmail,
  addUser,
  updateUser,
  deleteUser,
  getAllUsers
}
