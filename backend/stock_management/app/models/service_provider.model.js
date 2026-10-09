const db = require('../config/db.connect.js');

async function getAllServiceProviders() {
    try {
        const result = await db.query(`SELECT * FROM public.service_provider ORDER BY created_at DESC`);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

async function getServiceProviderById(id) {
    try {
        const result = await db.query(`SELECT * FROM public.service_provider WHERE id = $1`, [id]);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

async function createServiceProvider(data) {
    try {
        const statusBool = (data.status === true || data.status === 'active' || data.status === 'Active' || data.status === undefined) ? true : false;
        const rateVal = (data.rate !== undefined && data.rate !== '' && data.rate !== null) ? parseFloat(data.rate) : null;

        const query = `
            INSERT INTO public.service_provider (name, phone, service_type, description, rate, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`;
        const values = [
            data.name,
            data.phone || null,
            data.service_type || null,
            data.description || null,
            rateVal,
            statusBool
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

async function updateServiceProvider(id, data) {
    try {
        const statusBool = (data.status === true || data.status === 'active' || data.status === 'Active') ? true : false;
        const rateVal = (data.rate !== undefined && data.rate !== '' && data.rate !== null) ? parseFloat(data.rate) : null;

        const query = `
            UPDATE public.service_provider
            SET 
                name = $1,
                phone = $2,
                service_type = $3,
                description = $4,
                rate = $5,
                status = $6,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *`;
        const values = [
            data.name,
            data.phone || null,
            data.service_type || null,
            data.description || null,
            rateVal,
            statusBool,
            id
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

async function deleteServiceProvider(id) {
    try {
        const result = await db.query(`DELETE FROM public.service_provider WHERE id = $1 RETURNING *`, [id]);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getAllServiceProviders,
    getServiceProviderById,
    createServiceProvider,
    updateServiceProvider,
    deleteServiceProvider
};
