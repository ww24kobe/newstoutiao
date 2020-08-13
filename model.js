let mysql = require('mysql');
// 链接数据库
let database = require('./config/database.js');


// 连接mysql数据库
let connection = mysql.createConnection(database);

// 判断是否连接成功
connection.connect(function(err){
    if(err){
        throw err;
    }
    console.log('mysql连接成功');
});


module.exports = function query(sql){
    return new Promise((resolve,reject)=>{

        connection.query(sql,(err,rows,fields) => {
            if(err){ reject(err) } 
            resolve(rows) // // select rows => [{},{}],  insert update delete => rows.affected
        })
    })
    
}