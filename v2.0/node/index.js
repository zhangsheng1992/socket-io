/*-------------------- 日志记录 ---------------------*/

var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.File)({ filename: '/www/qrserver/access.log',json: false,level:'info',timestamp: true})
    ]
});


process.on('uncaughtException', function (err) {
    logger.error(err.stack)
});

var model = require('./model');
var crypto = require('crypto');

/*--------------- --- http 服务 --------------------*/

var http = require('http');
var url = require('url');
var query = require("querystring"); 
var server = http.createServer(function (request,response) {
    try{
        var pathUrl = url.parse(request.url).pathname;
        switch (pathUrl){
            case '/connection':
                var postdata = '';
                request.on("data",function(postchunk){
                    postdata += postchunk;
                })
                request.on("end",function(){
                    var data = query.parse(postdata.toString('utf-8'));
		    if(isNull(data.uuid)){
                        errorHead(response,'没传递uuid参数');
                    }else{
                        replayToDisplayer(data.uuid,{"status":0,"message":"手机端已链接成功"},'/appconnect',function (status){
			    
			if(status === false){
				errorHead(response,'客户端断开连接或连接已失效,请刷新页面重试');
                            }else{
				successHead(response,'链接成功');
                            } 
                        })
                    }
                    
                })
                break;


            //手机端确认登陆
            case '/confrim':
		
                var postdata = '';
                request.on("data",function(postchunk){
                    postdata += postchunk;
                })
                request.on("end",function(){
                    var data = query.parse(postdata.toString('utf-8'));
		    if(isNull(data.token)){
                        errorHead(response,'没传递token参数');
                    }else if(isNull(data.uuid)){
                        errorHead(response,'没传递uuid参数');
                    }else{
                        setTokenSalt(data.token,function (salt){
                            if(salt == false){
                                replayToDisplayer(data.uuid,{"status":1,"data":{},"message":"token校验失败"},'/error',function (status){
                                    if(status === false){
                                        errorHead(response,'客户端断开连接或连接已失效,请刷新页面重试');
                                    }else{
                                        errorHead(response,'token校验失败');
                                    } 
                                });
                            }else{
                                replayToDisplayer(data.uuid,{"status":0,"data":salt,"message":"手机端已确认登陆"},'/appconfirm' ,function (status){
				if(status === false){
                                        errorHead(response,'客户端断开连接或连接已失效,请刷新页面重试');
                                    }else{
                                        successHead(response,"已确定登陆");
					response.end();
                                    } 
                                });
                            } 
                        });
                        
                    }
                })
                break;

            default:
                errorHead(response);
                break;
        }
    }catch (e){
        logger.error(e.stack);
    }
}).listen(8889, "60.205.124.21");

/**
 * http请求成功应答 
 */
function successHead(response,notice){
    response.writeHead(200,{"Content-Type":"text/plain","Content-Type":"text/json; charset=utf-8"});
    response.write(JSON.stringify({"status":"0","data": "","message" :!isNull(notice) ? notice : "请求成功"}));
    response.end();
}

/**
 * http请求失败应答 
 */
function errorHead(response,notice){
    response.writeHead(200,{"Content-Type":"text/plain","Content-Type":"text/json; charset=utf-8"});
    response.write(JSON.stringify({"status":"1","data":"","message":  !isNull(notice) ? notice : "请求地址不存在"}));
    response.end();
}


//http服务状态报告
server.once('listening', function() {  
    logger.info('tcp服务开启 监听端口 8889');  
});


/*------------------------ socket 服务 ----------------------------*/
var request = require('request');
var io = require('socket.io').listen(8888);
logger.info('socket服务开启,监听端口:', 8888);

/**
 * socket.io事件  连接成功
 * @param {string} event名称
 * @param {function} 连接成功的回调函数 
 */
io.sockets.on('connection', function (socket) {
	logger.info('web端链接成功,socket_id为:', socket.id);
    socket.on('/register', function(data){
        if(isNull(data.uuid)){
            logger.error('can not found uuid!');
        }
        model.query(
            {
                type:'insert',
                table: 'code',
                data: {
                    uuid:data.uuid,
                    socket_id:socket.id,
                    express_time:Math.ceil((new Date().getTime())/1000)
                }
            },

            function (data,sql,err){
                if(data === false){
                    logger.error('sql error:',sql);
                    var targetSocket = io.sockets.connected[socket.id];
                    socket.emit('/error', {"status":1,"data":{},"message":"与服务器连接已断开,请刷新页面重新连接"});
                }else{
                    logger.info('sql :' ,sql);
		    socket.emit('/insertSuccess',{"status":0});
                }
        });
        logger.info('web端注册,uuid为', data.uuid); 
    }); 

    //客户端断开链接  
    socket.on('disconnect', function () {  
        model.query({type:'delete',table: 'code',where: 'socket_id = '+ '\''+socket.id+'\''},function (data,sql,err){
            if(data === false){
                logger.error('sql error:',err);
            }
            logger.info('客户端断开链接,从连接池中删除',"socket.id为"+socket.id); 
        });

        //晚上12时有断开连接操作会触发flush一下表 这部分需要修改下
        if(new Date().getHours() == 23){
            model.query({type:'delete',table: 'code',where: 'express_time < '+ (Math.ceil((new Date().getTime())/1000) - 300) },function (data,sql,err){
                if(data === false){
                    logger.error('sql error:',err);
                }
                logger.info('flush code table'," 影响条数为"+data); 
            });
        }
    }); 
});


/**
 * 向指定web端发送信息
 */
function replayToDisplayer(uuid, params, event, callback) {

    model.query({
            type:'select',
            table:'code',
            where: ' uuid = ' + '\''+uuid+'\''
        },

        function (data,sql,err){
            if(data === false){
                logger.error('sql error:',err);
            }else{
                logger.info('sql :',sql);
            }

            if(isNull(data)){
                logger.info('不能根据uuid找到socketid,uuid为', uuid);
                callback(false);
            }else if(!isNull(data[0].socket_id)){
                logger.info('根据uuid:'+uuid+"找到socket.id:"+data[0].socket_id);
                var result = reply(data[0].socket_id,params,event);
                callback(result);
            }
    });
}

/** 
 *  应答客户端
 */
function reply(socket_id,data,event){
    try{
        var targetSocket = io.sockets.connected[socket_id];
        targetSocket.emit(event, data);
        logger.info("已经返回web端,返回事件"+event,"返回信息"+data);
        return true;
    } catch(e){
        logger.error("返回客户端异常:",e);
        return false;
    }

}


/*--------------------------- 公共函数 --------------------------------*/

/** 
 * 判断是否null 
 * @param {string} data
 * @return bool 
 */
function isNull(data){
    switch (typeof data) {

        case 'undefined':
                return true;

        case 'string':
            if (data.replace(/(^[ \t\n\r]*)|([ \t\n\r]*$)/g, '').length == 0){
                 return true;  
            }
            break;

        case 'boolean':
            if (!data){
                return true;
            }
            break;
        case 'number':
            if (0 === data || isNaN(data)){
                return true;
            }
            break;
        case 'object':
            if (null === data || data.length === 0){
                return true;
            }
            for (var i in data) {
                return false;
            }
            return true;
    }
    return false;
}

/**
 * 根据token生成salt
 */
function setTokenSalt(user_id,callback){
    if(isNull(user_id)){
        callback(false);
    }
    //生成md5签名
    var token = user_id + new Date().getTime();
    var md5 = crypto.createHash('md5');
    md5.update(token);
    var salt = md5.digest('hex');

    model.query(
        {
            type:'select',
            table: 'token',
            where : 'user_id = ' + parseInt(user_id)
        },  
        function (data,sql,err){
            logger.info('sql :' ,sql); 
            if(data === false){
                logger.error('sql error:',err);
            }

            //没有则插入记录
            if(isNull(data) === true){
                model.query(
                    {
                        type:'insert',
                        table:'token',
                        data:{
                            user_id : user_id,
                            token : salt,
                            express_time : Math.ceil((new Date().getTime())/1000)+120
                        }
                    },
                    function (data,sql,err){
                        logger.info('sql :' ,sql);
                        if(data === false){
                            logger.error('sql error:',err);
                            callback(false);
                        }else{
                            logger.info('已新建用户 token为'+salt,"用户ID为"+user_id);
                            callback(salt);
                        }
                    }
                )
            }else{
                //有则更新记录
                model.query(
                    {
                        type:'update',
                        table:'token',
                        update:{
                            token : salt,
                            express_time : Math.ceil((new Date().getTime())/1000)+120
                        },
                        where: "user_id  = "+user_id
                    },
                    function (data,sql,err){
                        logger.info('sql :' ,sql);
                        if(data === false){
                            logger.error('sql error:',err);
                            callback(false);
                        }else{
                            logger.info('已更新用户token为'+salt,"用户ID为"+user_id);
                            callback(salt);
                        }
                    });
            }
        }
    );
}




