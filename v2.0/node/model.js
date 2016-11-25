var mysql=require('mysql');
/**
 * 初始化连接配置
 * @type type
 */
var connection = mysql.createConnection({
    host : '182.92.161.188',
    user : 'zhangsheng',
    password : '426759',
    database : 'test',
    port:'3306'
});

connection.connect();

/**
 * query方法
 */
var query = function (condition,callback){
    var sql = createSql(condition);
    console.log(sql);
    if(sql === false){
       callback(false); 
    }
    connection.query(sql,function(err,rows,fields){
        if (err){
            callback(false,sql,err)
        }else{
            callback(rows,sql);
        }
    });
};

/*
 * 组装sql
 * @param condition object 条件
 * @return string | false
 */
function createSql(condition){
    if(typeof(condition.type) == 'undefined'){
        return false;
    }
    var sql;
    switch(condition.type){
        case 'select':
            sql = select(condition);
            break;
        case 'delete':
            sql = del(condition);
            break;
        case 'update':
            sql = update(condition);
            break;
        case 'insert':
            sql = insert(condition);
            break;
        
    }
    return sql;
}

function insert(condition){
    var sql =  'insert into ';
    if(typeof(condition.table) == 'undefined'){
        return false;
    }

    sql +=  condition.table + ' (';
    if(typeof(condition.data) != 'undefined'){
        var value = '';
        for( var i in condition.data){
            sql += i+',';
            value +=  '\''+condition.data[i] + '\','
        }
        sql = sql.substring(0,sql.length-1) + ')values('+ value.substring(0,value.length-1) + ')';
        return sql;
    }else{
        return false;
    }
}


/**
 * 查询方法
 * @param {object} condition 条件对象 
 * @returns {select.sql|String|Boolean}
 */
function select(condition){
    var sql = 'SELECT ';
    if(typeof(condition.filed) == 'undefined'){
        sql += '*';
    }else{
        sql += condition.filed;
    }
    if(typeof(condition.table) == 'undefined'){
        return false;
    }
    sql += ' FROM '+condition.table;
    if(typeof(condition.where) != 'undefined'){
        sql += ' WHERE '+condition.where;
    }
    if(typeof(condition.group) != 'undefined'){
        sql += ' GROUP BY '+condition.order;
    }
    if(typeof(condition.order) != 'undefined'){
        sql += ' ORDER BY '+condition.order;
    }
    if(typeof(condition.limit) != 'undefined'){
        sql += ' LIMIT '+condition.limit;
    }
    return sql;
}

/**
 * 删除方法 安全限制 没有where条件不执行
 * @param {object} condition 条件对象 
 * @returns {select.sql|String|Boolean}
 */
function del(condition){
    var sql = 'DELETE';
    if(typeof(condition.table) == 'undefined'){
        return false;
    }
    sql += ' FROM '+condition.table;
    if(typeof(condition.where) != 'undefined'){
        sql += ' WHERE '+ condition.where;
    }else{
        return false;
    }
    return sql;
}

/**
 * 修改方法 安全限制 没有where条件不执行
 * @param {object} condition 条件对象 
 * @returns {select.sql|String|Boolean}
 */
function update(condition){
    var sql = 'UPDATE ';
    if(typeof(condition.table) == 'undefined'){
        return false;
    }
    sql +=  condition.table + ' SET ';
    if(typeof(condition.update) != 'undefined'){
        for( var i in condition.update){
            sql += i +' = ' + '\''+condition.update[i] + '\',';
        }
    }
    sql = sql.substring(0,sql.length-1);
    if(typeof(condition.where) != 'undefined'){
        sql += ' WHERE '+condition.where;
    }else{
        return false;
    }
    return sql;
}

//获取总条数
function count(tablename,callback){
    var sql = 'select count(*) as num from ' + tablename;
    var num = 0;
    connection.query(sql,function(err,rows,fields){
        if (err) {
            connection.rollback(function() {
                throw err;
            });
        }else{
            num = rows[0]['num'];
            callback(num);
        }
    });
}

exports.query = query;
exports.count = count;