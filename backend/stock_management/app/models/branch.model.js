const connection   =  require('../config/db.connect.js'); 



async function getBranch(){
    try{
        const result = await connection.query(`SELECT * FROM public.branches`);
        return result.rows;
    }catch(error){
        throw error;
    }
}

async function getBranchById(id){
    // console.log('branch id ',id);
    try{
        const result = await connection.query(`SELECT * FROM public.branches WHERE id=$1`, [id]);
        return result.rows;
    }catch(error){
        throw error;
    }
}

async function addBranch(branch){
    try{
        const result = await connection.query(`INSERT INTO public.branches (name, location, city, state, status, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, 
        [branch.name, branch.location, branch.city, branch.state, branch.status, branch.created_by || null]);
        return result.rows;
    }catch(error){
        throw error;
    }
}

async function updateBranch(id, branch){
    try{
        const result = await connection.query(`UPDATE public.branches SET name=$1, location=$2, city=$3, state=$4, status=$5, updated_by=$6 WHERE id=$7 RETURNING *`,
             [branch.name, branch.location, branch.city, branch.state, branch.status, branch.updated_by || null, id]);
        return result.rows;
    }catch(error){
        throw error;
    }
}

async function deleteBranch(id){
    try{
        const result = await connection.query(`DELETE FROM public.branches WHERE id=$1 RETURNING *`, [id]);
        return result.rows;
    }catch(error){
        throw error;
    }   
}

async function putBranch(id, branch){
    try{
        const result = await connection.query(`UPDATE public.branches SET name=$1, location=$2, city=$3, state=$4, status=$5 WHERE id=$6 RETURNING *`, [branch.name, branch.location, branch.city, branch.state, branch.status, id]);
        return result.rows;
    }catch(error){
        throw error;
    }
}

module.exports = {
    getBranch, 
    getBranchById,
    addBranch,
    updateBranch,
    putBranch,
    deleteBranch,    
}
