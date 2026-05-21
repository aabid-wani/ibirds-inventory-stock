const connection = require('../config/db.connect.js');

async function getVendor() {
    try {
        const result = await connection.query(`
            SELECT 
                v.*, 
                b.name AS branch_name,
                COUNT(p.id)::INTEGER AS total_orders,               -- Cast to integer
                COALESCE(SUM(p.total_amount), 0)::INTEGER AS total_purchase  -- Cast to integer
            FROM vendors v
            INNER JOIN branches b ON v.branch_id = b.id
            LEFT JOIN orders p ON p.vendor_id = v.id
            GROUP BY 
                v.id, 
                b.name
            ORDER BY total_purchase DESC;

        `);
        return result.rows;
    }catch (error) {
       throw error;
    }
};

async function getVendorById(id) {
    // console.log('Getting vendor by id', id)
    try {
        const result = await connection.query(` 
            SELECT 
            vendor.*, branch.name AS branch_name 
            from vendors vendor inner join branches branch on vendor.branch_id = branch.id WHERE vendor.id=$1
            ORDER BY vendor.created_at DESC
            `,
            [id]);
        return result.rows;
    } catch (error) {
        throw error;
    }
};

async function addVendor(vendor) {
    try {
        const result = await connection.query(`INSERT INTO public.vendors (name, gst_no, mobile, status,address,city,state,branch_id,created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [vendor.name, vendor.gst_no, vendor.mobile, vendor.status, vendor.address, vendor.city, vendor.state, vendor.branch_id,vendor.created_by]);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

async function updateVendor(id, vendor) {
    // console.log('Updating vendor', id, vendor)
    try {
        const result = await connection.query(`UPDATE public.vendors SET name=$1, gst_no=$2, mobile=$3, status=$4, address=$5, city=$6, state=$7, branch_id=$8, updated_by=$9 WHERE id=$10 RETURNING *`,
            [vendor.name, vendor.gst_no, vendor.mobile, vendor.status, vendor.address, vendor.city, vendor.state, vendor.branch_id, vendor.updated_by, id]);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

async function deleteVendor(id) {
    try {
        const result = await connection.query(`DELETE FROM public.vendors WHERE id=$1 RETURNING *`, [id]);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getVendor, 
    getVendorById,
    addVendor,
    updateVendor,
    deleteVendor,
};
