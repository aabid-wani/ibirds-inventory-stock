const Pool = require('pg').Pool
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'stock_management',
    password: 'root',
    port: 5432,
})

if(pool.connect()) {
}
module.exports = pool;
