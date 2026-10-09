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
        const query = `
            SELECT 
                e.*,
                COALESCE(SUM(i.quantity), 0)::numeric AS total_issued_items,
                COUNT(i.id)::int AS total_issues_count
            FROM public.employees e
            LEFT JOIN public.issues i ON e.id = i.employee_id
            WHERE e.id = $1
            GROUP BY e.id
        `;
        const result = await db.query(query, [id]);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

async function getEmployeeIssues(id, month = null) {
    try {
        let query = `
            SELECT 
                i.id,
                i.quantity,
                i.issue_date,
                i.status,
                i.description,
                i.branch_id,
                i.created_at,
                u.name AS user_name,
                p.id AS product_id,
                p.name AS product_name,
                p.measurement_unit AS unit,
                b.name AS branch_name
            FROM public.issues i
            LEFT JOIN public.users u ON i.user_id = u.id
            LEFT JOIN public.products p ON i.product_id = p.id
            LEFT JOIN public.branches b ON i.branch_id = b.id
            WHERE i.employee_id = $1
        `;
        const values = [id];

        if (month && month !== 'all') {
            values.push(month);
            query += ` AND TO_CHAR(i.issue_date, 'YYYY-MM') = $2`;
        }

        query += ` ORDER BY i.issue_date DESC, i.created_at DESC`;

        const result = await db.query(query, values);
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
    getEmployeeIssues,
    addEmployee,
    updateEmployee,
    deleteEmployee
};
