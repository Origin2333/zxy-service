let mysql = require('mysql');
let db = {}

//插入操作，注意使用异步返回查询结果
db.insert = function(connection, sql, paras, callback){
    connection.query(sql, paras, function (error, results, fields) {
        if (error) throw error;
        callback(results.insertId);//返回插入的id
    });
}

//关闭数据库
db.close = function(connection){
    //关闭连接
    connection.end(function(err){
        if(err){
            return;
        }else{
            console.log('关闭连接');
        }
    });
}

//获取数据库连接
db.connection = function(){
    //数据库配置
    let connection = mysql.createConnection({
        host:'localhost',
        user:'root',
        password:'li950626',
        database:'test',
        port:3306,
        multipleStatements: true
    });
    //数据库连接
    connection.connect(function(err){
        if(err){
            console.log(err);
            return;
        }
    });
    return connection;
}
module.exports = db;