const connection = require('../config/db.connect.js');

async function getPermission() {
    try {
        const result = await connection.query(`
            SELECT perm.*, role.name AS role_name, modules.name AS module_name 
            FROM permissions perm
            INNER JOIN roles role ON perm.role_id = role.id 
            INNER JOIN modules ON perm.module_id = modules.id
            ORDER BY role.name, modules.name
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
            SELECT p.id, p.role_id, p.module_id, p.view, p.add, p.edit, p.del, p.status,
                   m.name AS module_name, r.name AS role_name
            FROM permissions p
            INNER JOIN modules m ON p.module_id = m.id
            INNER JOIN roles r ON p.role_id = r.id
            WHERE p.role_id = $1
            ORDER BY m.name`, [id]);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

async function upsertPermission(permission) {
    try {
        const { status, edit, del, add, role_id, view, module_id, updated_by, created_by } = permission;
        const result = await connection.query(`
            INSERT INTO public.permissions (status, edit, del, add, role_id, view, module_id, updated_by, created_by, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            ON CONFLICT (role_id, module_id)
            DO UPDATE SET
                status = EXCLUDED.status,
                edit = EXCLUDED.edit,
                del = EXCLUDED.del,
                add = EXCLUDED.add,
                view = EXCLUDED.view,
                updated_by = EXCLUDED.updated_by,
                updated_at = NOW()
            RETURNING *;
        `, [
            status !== undefined && status !== null ? status : true, 
            !!edit, 
            !!del, 
            !!add, 
            role_id, 
            !!view, 
            module_id,
            updated_by || null,
            created_by || null
        ]);
        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

async function addPermission(permission) {
    return upsertPermission(permission);
}

async function updatePermission(id, permission) {
    try {
      const { status, edit, del, add, role_id, view, module_id } = permission;
      const result = await connection.query(`
        UPDATE public.permissions
        SET status = $1, edit = $2, del = $3, add = $4, role_id = $5, view = $6, module_id = $7, updated_at = NOW()
        WHERE id = $8
        RETURNING *`,
        [status !== undefined && status !== null ? status : true, !!edit, !!del, !!add, role_id, !!view, module_id, id]);
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
            SELECT p.id, p.role_id, p.module_id, p.view, p.add, p.edit, p.del, p.status,
                   m.name AS module_name, roles.name AS role_name
            FROM permissions p
            INNER JOIN roles roles ON p.role_id = roles.id
            INNER JOIN modules m ON p.module_id = m.id
            WHERE roles.id = $1
            ORDER BY m.name
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
    upsertPermission,
    updatePermission,
    deletePermission,
    getPermissionByRole,
    getPermissionByRoleId,
    getPermissionByRoleIdAndModuleId,
    checkPermissionExists
}