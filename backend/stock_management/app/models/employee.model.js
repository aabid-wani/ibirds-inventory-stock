const db = require('../config/db.connect');

async function getAllEmployees() {
    try {
        const result = await db.query(`SELECT * FROM public.employees ORDER BY created_at DESC`);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

async function getEmployeeById(id) {
    try {
        const result = await db.query(`SELECT * FROM public.employees WHERE id = $1`, [id]);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

async function addEmployee(employee) {
    try {
        const query = `
            INSERT INTO public.employees (name, department, status, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *`;
        const values = [
            employee.name,
            employee.department || null,
            employee.status || 'Active',
            employee.created_by || null
        ];
        const result = await db.query(query, values);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

async function updateEmployee(id, employee) {
    try {
        const query = `
            UPDATE public.employees
            SET 
                name = $1,
                department = $2,
                status = $3,
                updated_by = $4
            WHERE id = $5
            RETURNING *`;
        const values = [
            employee.name,
            employee.department || null,
            employee.status || 'Active',
            employee.updated_by || null,
            id
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

async function deleteEmployee(id) {
  try {
    const result = await db.query(
      `DELETE FROM public.employees WHERE id = $1 RETURNING*`, [id]
    );
    return result.rows;  
  } catch (error) {
    throw error;  
  }
}

module.exports = {
    getAllEmployees,
    getEmployeeById,
    addEmployee,
    updateEmployee,
    deleteEmployee
};
