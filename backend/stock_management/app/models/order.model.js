const connection = require('../config/db.connect.js');

async function getOrder() {
    try {
        const result = await connection.query(`               
        SELECT o.*, u.name AS user_name, b.name AS branch_name, v.name AS vendor_name
        FROM orders o
        INNER JOIN users u ON o.user_id = u.id
        INNER JOIN branches b ON o.branch_id = b.id
        INNER JOIN vendors v ON o.vendor_id = v.id
        ORDER BY o.order_date DESC
        `);
        return result.rows;
    } catch (error) {
        throw error;
    }
};

async function getOrderById(id) {
    try {
        const result = await connection.query(`
            SELECT 
                o.*, 
                o.order_date AS order_date,
                u.name AS user_name,
                b.name AS branch_name,
                v.name AS vendor_name 
            FROM orders o 
            INNER JOIN users u ON o.user_id = u.id
            INNER JOIN branches b ON o.branch_id = b.id
            INNER JOIN vendors v ON o.vendor_id = v.id
            WHERE o.id = $1`,
            [id]
        );
        return result.rows;
    } catch (error) {
        throw error;
    }
}


async function getOrderByUserId(id) {
    try {
        const result = await connection.query(`
            SELECT order_line_item.*, orders.*, products.name AS product_name
            FROM public.order_line_item
            INNER JOIN public.orders ON order_line_item.order_id = orders.id
            INNER JOIN public.products ON order_line_item.product_id = products.id
            INNER JOIN public.users ON orders.user_id = users.id  -- Join on orders.user_id
            WHERE users.id = $1`, [id]);
        return result.rows;
    } catch (error) {
        console.error('Error getting order by user id', error);
        throw error;
    }
}


async function addOrder(order) {
    try {
        const result = await connection.query(
            `INSERT INTO public.orders(invoice_number, order_date, status, total_amount, user_id, branch_id, vendor_id,created_by) 
            VALUES($1, $2, $3, $4, $5, $6, $7,$8) RETURNING *`,
            [order.invoice_number, order.order_date, order.status, order.total_amount, order.user_id, order.branch_id, order.vendor_id,created_by]
        );
        return result.rows;
    } catch (error) {
        throw error;
    }
}


async function updateOrder(id, order) {
    try {
        const result = await connection.query(`UPDATE public.orders SET name=$1, order_number=$2,  invoice_number=$3, order_date=$4, status=$5, total_amount=$6, user_id=$7, branch_id=$8, vendor_id=$9, updated_by=$10 WHERE id=$11 RETURNING *`,
            [order.name, order.order_number, order.invoice_number, order.order_date, order.status, order.total_amount, order.user_id, order.branch_id, order.vendor_id, order.updated_by, id]);
        return result.rows;
    } catch (error) {
        throw error;
    }
};

async function deleteOrder(id) {
    try {
        const result = await connection.query(`DELETE FROM public.orders WHERE id=$1 RETURNING *`, [id]);
        return result.rows;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    getOrder,
    getOrderById,
    getOrderByUserId,
    addOrder,
    updateOrder,
    deleteOrder,
};
