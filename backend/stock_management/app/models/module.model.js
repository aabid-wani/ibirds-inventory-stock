const connection = require('../config/db.connect.js');

async function getModule(){
    try{
        const result = await connection.query('SELECT * FROM public.modules');
        return result.rows;
    }catch(error){
        throw error;
    }
}

async function getModuleById(id){
    try{
        const result = await connection.query(`SELECT * FROM public.modules WHERE id=$1`,[id]);
        return result.rows;
    }catch(error){
        throw error;
    }
}

async function addModule(module){
    try{
        const result = await connection.query(`INSERT INTO public.modules(name,status,created_by) VALUES($1,$2,$3) RETURNING *`,[module.name,module.status,module.created_by]);
        return result.rows[0];
    }catch(error){
        throw error;
    }
}

async function updateModule(id, module){
    // console.log('module updated')
    try{
        const result = await connection.query(`UPDATE public.modules SET name=$2,status=$3, updated_by=$4 WHERE id=$1 RETURNING *`,[id,module.name,module.status,module.updated_by]);
        return result.rows[0];
    }catch(error){
        throw error;
    }
}

async function deleteModule(id){
    try{
        const result = await connection.query(`DELETE FROM public.modules WHERE id=$1 RETURNING *`,[id]);
        return result.rows[0];
    }catch(error){
        throw error;
    }
}

module.exports = {
    getModule,
    getModuleById,
    addModule,
    updateModule,
    deleteModule
}

