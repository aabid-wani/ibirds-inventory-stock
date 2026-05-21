const connection = require('../config/db.connect.js');

async function getPermission() {
    try {
        const result = await connection.query(`
            select perm.*, roles.name As role_name, modules.name As module_name from permissions perm
            inner join  roles role on perm.role_id = role.id 
            inner join  modules  on perm.module_id = modules.id
            `);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

async function checkPermissionExists(role_id, module_id) {
    try {
        const result = await connection.query(`
            SELECT * FROM permissions WHERE role_id = $1 AND module_id = $2
        `, [role_id, module_id]);
        return result.rows[0]; // Return the first matching permission or undefined if none found
    } catch (error) {
        throw error;
    }
}

async function getPermissionById(id) {
    try {
        const result = await connection.query(`
            select p.* from permissions p
            inner join modules m on p.module_id = m.id
            inner join roles r on p.role_id = r.id
            where p.role_id = $1`, [id]);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

async function addPermission(permission) {
    try {
      

        const result = await connection.query(`
            INSERT INTO public.permissions (status, edit, del, add, role_id, view, module_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `, [permission.status, permission.edit, permission.del, permission.add, permission.role_id, permission.view, permission.module_id]);

        // console.log(result);
        return result.rows[0];
    } catch (error) {
        console.error('Error adding permission', error);
        throw error;
    }
}

async function updatePermission(id, permission) {
    
    try {
      const { status, edit, del, add, role_id, view, module_id } = permission;
      const result = await connection.query(`
        UPDATE public.permissions
        SET status = $1, edit = $2, del = $3, add = $4, role_id = $5, view = $6, module_id = $7
        WHERE id = $8
        RETURNING *`,
        [status, edit, del, add, role_id, view, module_id, id]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

async function deletePermission(id) {
    try {
        const result = await connection.query(`
            Select * from public.permissions where $1    
        `, [id]);
        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

async function getPermissionByRole(roleName) {
    try {
        const result = await connection.query(`
            select perm.*, roles.name As role_name, modules.name As module_name from permissions perm
            inner join  roles role on perm.role_id = role.id 
            inner join  modules  on perm.module_id = modules.id  where roles.name = $1`,
            [roleName]);
            return result.rows;

            // SELECT P.*,r.name AS permission_role
			// 	FROM permissions AS p
            //     INNER JOIN role AS r ON p.role_id = r.role_id
            //     WHERE r.name =$1`, 
    } catch (error) {
        throw error;
    }
}

// async function getPermissionByRoleId(role_id){
//     try{
//         const result = await connection.query(`
//             select p.*, * from permissions p
//             inner join modules m on p.module_id = m.module_id
//             inner join roles r on p.role_id = r.role_id
//             where p.role_id = $1 AND p.permission_id = $1 
//             `,[role_id])
//         return result.rows;
//     }catch (error) {
//         throw error;
//     }
// }

async function getPermissionByRoleIdAndModuleId(role_id, module_id) {
    try{
        const result = await connection.query(`
            select p.* from permissions p
            inner join modules m on p.module_id = m.id
            inner join roles r on p.role_id = r.id
            where p.role_id = $1 and p.module_id = $2 
            `,[role_id, module_id])
        return result.rows;
    }catch (error) {
        throw error;
    }
}


// async function getPermissionByUserId(email,password) {
//     try {
//         const result = await connection.query(`
//             SELECT p.*, roles.*, modules.name AS module_name
//             FROM permissions p
//             INNER JOIN role roles ON p.role_id = roles.role_id
//             INNER JOIN modules ON p.module_id = modules.id
//             WHERE users.email = $1 AND users.password = $2
//         `, [email, password]);
//         return result.rows;
//     } catch (error) {
//         throw error;
//     }
// }

async function getPermissionByRoleId(id) {
    try {
        
        const result = await connection.query(`
            SELECT p.*, roles.*, modules.name AS module_name
            FROM permissions p
            INNER JOIN roles roles ON p.role_id = roles.id
            INNER JOIN modules ON p.module_id = modules.id
            WHERE roles.id = $1
        `, [id]);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getPermission,
    getPermissionById,
    addPermission,
    updatePermission,
    deletePermission,
    getPermissionByRole,
    getPermissionByRoleId,
    getPermissionByRoleIdAndModuleId,
    checkPermissionExists
}