const connection = require('../config/db.connect');

async function getReturn() {
    try{
        // console.log('Getting returns');
        const result = await connection.query('SELECT * FROM returns');
        return result.rows;
    }catch(err){
        throw err;
    }
}
async function getReturnAll() {
    // console.log('Getting all returns');
    try{
            //  select returns.*, products.name As product_name,orders.order_number,issues.issue_date from returns 
	   		//  inner join products on returns.product_id = products.id
            //  inner join orders on returns.order_id = orders.id
        const result = await connection.query(`
             select returns.*, products.name As product_name,issues.issue_date from returns 
	   		inner join products on returns.product_id = products.id
            inner join issues on returns.issue_id = issues.id
            `);
            // console.log(result);
        return result.rows;
    }catch(error){
        throw error;
    }
}

async function getReturnByIssueId(id) {
    // console.log('Getting return by issue id', id);
    try {
        const result = await connection.query(`
            SELECT returns.*,
                   TO_CHAR(returns.return_date, 'DD/MM/YYYY') AS return_date,
                   TO_CHAR(issues.issue_date, 'DD/MM/YYYY') AS issue_date,
                   products.name AS product_name
            FROM returns
            INNER JOIN products ON returns.product_id = products.id
            INNER JOIN issues ON returns.issue_id = issues.id
            WHERE returns.issue_id = $1`, [id]);
        return result.rows;
    } catch (error) {
        throw error;
    }
}


async function getReturnByOrderId(id) {
    try {
        const result = await connection.query(`
            SELECT returns.*,
                   TO_CHAR(returns.return_date, 'DD/MM/YYYY') AS return_date,
                   products.name AS product_name
            FROM returns
            INNER JOIN products ON returns.product_id = products.id
            WHERE returns.order_id = $1`, [id]);
        return result.rows;
    } catch (error) {
        throw error;
    }
}



async function getReturnData(id, field = 'issue_id') {
    try{ 
      const fieldName = field === 'order_id' ? 'orders.id' : 'issues.id';
      const joinTable = field === 'order_id' ? 'orders' : 'issues'; 
  
      const result = await connection.query(`
        SELECT returns.*,
               TO_CHAR(returns.return_date, 'DD/MM/YYYY') AS return_date,
               TO_CHAR(${joinTable}.issue_date, 'DD/MM/YYYY') AS issue_date,
               products.name AS product_name
        FROM returns
        INNER JOIN products ON returns.product_id = products.id
        INNER JOIN ${joinTable} ON returns.${fieldName} = ${joinTable}.id
        WHERE ${fieldName} = $1`, [id]);
  
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
  


async function addReturn(returnObj) {
    // console.log('returnObj',returnObj);
    try {
        const { product_id, quantity, return_date, order_id, issue_id} = returnObj;
        // console.log(product_id);
        const result = await connection.query(`INSERT INTO returns (product_id, quantity, return_date, order_id, issue_id)
            VALUES ($1, $2, $3, $4, $5) RETURNING *`, [product_id, quantity, return_date, order_id || null , issue_id || null]);
        // console.log(result);
        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

async function updateReturn(id, returnObj) {
    try{
        const result = await connection.query(`
            UPDATE returns SET product_id=$1, return_type=$2, quantity=$3, return_date=$4, order_id=$5, issue_id=$6
            WHERE id=$7 RETURNING *`, [returnObj.product_id, returnObj.return_type, returnObj.quantity, returnObj.return_date, returnObj.order_id, returnObj.issue_id, id]);
        return result.rows[0];
    }catch(error){
        throw error;
    }
}


async function deleteReturn(id) {
    try{
        const result = await connection.query("DELETE FROM returns WHERE id=$1 RETURNING *", [id]);
        return result.rows[0];
    }catch(error){
        throw error;
    }
}

module.exports={
    getReturn,
    getReturnAll,
    addReturn,
    updateReturn,
    deleteReturn,
    getReturnByIssueId,
    getReturnByOrderId,
    getReturnData,
}