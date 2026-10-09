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
    try {
        const result = await connection.query(` 
            SELECT 
                v.*, 
                b.name AS branch_name,
                COUNT(p.id)::INTEGER AS total_orders,
                COALESCE(SUM(p.total_amount), 0)::INTEGER AS total_purchase
            FROM vendors v 
            INNER JOIN branches b ON v.branch_id = b.id 
            LEFT JOIN orders p ON p.vendor_id = v.id
            WHERE v.id = $1
            GROUP BY v.id, b.name
            ORDER BY v.created_at DESC
        `, [id]);
        return result.rows;
    } catch (error) {
        throw error;
    }
};

async function getVendorOrders(id, month = null) {
    try {
        let query = `
            SELECT 
                o.id,
                o.order_number,
                o.invoice_number,
                o.order_date,
                o.status,
                o.total_amount,
                o.created_at,
                u.name AS created_by_name,
                COUNT(oli.id)::INTEGER AS item_count,
                COALESCE(SUM(oli.quantity), 0)::NUMERIC AS total_quantity,
                json_agg(
                    json_build_object(
                        'id', oli.id,
                        'product_id', oli.product_id,
                        'product_name', p.name,
                        'quantity', oli.quantity,
                        'price', oli.price
                    )
                ) FILTER (WHERE oli.id IS NOT NULL) AS line_items
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_line_item oli ON o.id = oli.order_id
            LEFT JOIN products p ON oli.product_id = p.id
            WHERE o.vendor_id = $1
        `;
        const values = [id];

        if (month && month !== 'all') {
            query += ` AND TO_CHAR(o.order_date, 'YYYY-MM') = $2`;
            values.push(month);
        }

        query += `
            GROUP BY o.id, u.name
            ORDER BY o.order_date DESC
        `;

        const result = await connection.query(query, values);
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
    getVendorOrders,
    addVendor,
    updateVendor,
    deleteVendor,
};
