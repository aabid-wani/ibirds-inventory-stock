const connection = require('../config/db.connect.js');
async function getProductCategory(){
    try{
        const result = await connection.query(`SELECT * FROM public.product_category ORDER BY created_at DESC `);
        return result.rows;
    }catch(error){
        throw error;
    }
}

async function getProductCategoryById(id){
    try{
        const result = await connection.query(`SELECT * FROM public.product_category WHERE id=$1`, [id]);
        return result.rows;
    }catch(error){
        throw error;
    }
}


async function addProductCategory(product_category){
    try{
        const result = await connection.query(`INSERT INTO public.product_category (name, status, created_by) VALUES ($1, $2, $3) RETURNING *`, 
            [product_category.name, product_category.status, product_category.created_by || null]);
        return result.rows;
    }catch(error){
        throw error;
    }
}


async function updateProductCategory(id, product_category){
    // console.log('product category',product_category)
    try{
        const result = await connection.query(`UPDATE public.product_category SET name=$1, status=$2, updated_by=$3 WHERE id=$4 RETURNING *`,
             [product_category.name, product_category.status, product_category.updated_by || null, id]);
        return result.rows;
    }catch(error){
        throw error;
    }
}



async function deleteProductCategory(id){
    try{
        // console.log(id);
        const result = await connection.query(`DELETE FROM public.product_category WHERE id =$1 RETURNING *`, [id]);
        return result.rows;
    }catch(error){
        throw error;
    }
}

module.exports = {
    getProductCategory,
    getProductCategoryById,
    addProductCategory,
    updateProductCategory,
    deleteProductCategory
}
