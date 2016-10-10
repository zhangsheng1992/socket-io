/**
 * 日志记录
 * winston 日志记录模块
 */
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({level: "info", timestamp: true}),
        new (winston.transports.File)({ filename: 'access.log',json: false})
    ]
});


/**
 * http服务
 * http     http服务模块
 * url      get解析模块
 * query    post解析模块
 */
var http = require('http');
var url = require('url');
var query = require("querystring"); 
var server = http.createServer(function (request,response) {
    var pathUrl = url.parse(request.url).pathname;
    switch (pathUrl){
        //手机端链接成功
        case '/connection':
            var postdata = '';
            request.on("data",function(postchunk){
                postdata += postchunk;
            })

            request.on("end",function(){
                var data = query.parse(postdata.toString('utf-8'));
                if(!isNull(data.uuid)){
                    errorHead(response,'没传递uuid参数');
                    response.end();
                }
                replayToDisplayer(data.uuid,{"status":0,"message":"手机端已链接成功"},'/appconnect')
                successHead(response,data.token);
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
                if(!isNull(data.token)){
                    errorHead(response,'没传递token参数');
                    response.end();
                }

                if(!isNull(data.uuid)){
                    errorHead(response,'没传递uuid参数');
                    response.end();
                }

                replayToDisplayer(data.uuid,{"status":0,"data":{"token":data.token},"message":"手机端已确认登陆"},'/appconfirm')
                successHead(response,data.token);
            })
            break;

        default:
            errorHead(response);
            break;
    }
}).listen(8889, "127.0.0.1");

/**
 * http请求成功应答 
 */
function successHead(response,notice,token){
    response.writeHead(200,{"Content-Type":"text/plain","Content-Type":"text/html; charset=utf-8"});
    var message = {"status":"0","data": isNull(token) ? token : "","message" :isNull(notice) ? notice : "请求成功"};
    response.write(JSON.stringify(message));
    response.end();
}

/**
 * http请求失败应答 
 */
function errorHead(response,notice){
    response.writeHead(200,{"Content-Type":"text/plain","Content-Type":"text/html; charset=utf-8"});
    var message = {"status":"1","data":"","message":  isNull(notice) ? notice : "请求地址不存在"};
    response.write(JSON.stringify(message));
    response.end();
}


//服务状态报告
server.once('listening', function() {  
    logger.info('tcp服务开启 监听端口 8889');  
});



/**
 *  socket 服务模块
 */
//定义一个list存放uuid 每一个uuid对应一个socket id  
var UUIDMap = {};

/**
 * 开启socket.io服务 
 */
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
    var UUID;

    //客户端进行uuid与socket.id绑定  
    socket.on('/register', function(data){  
        UUID = data['uuid']; 
        UUIDMap[UUID] = socket.id;  
        logger.info('web端注册,uuid为', UUID);  
    }); 

    //客户端断开链接  
    socket.on('/disconnect', function () {  
        if (UUID != null) {  
            logger.info('客户端断开链接,从连接池中删除', "uuid 为"+UUID+",socket.id为"+socket.id);  
            delete UUIDMap[UUID];  
        }  
    }); 
});


/**
 * 向指定web端发送信息
 * 
 * @param {json} data 要返回的数据
 * @param {string} event 要回调客户端的监听事件
 * @returns {undefined}
 */
function replayToDisplayer(uuid, data, event) {
    var submitUUID = uuid;
    var displayerSocket = findSocketByUUID(submitUUID);

    if (displayerSocket != null) {
        logger.info('根据uuid:'+uuid+"找到socket.id:");
        displayerSocket.emit(event, data);
    } 
}

/**
 * 通过uuid查找socket connection id
 * @param {uuid} data 要返回的数据
 */
function findSocketByUUID(UUID) {
    var targetSocketID = UUIDMap[UUID];
    if (targetSocketID != null) {
        var targetSocket = io.sockets.connected[targetSocketID];
        if (targetSocket != null) {
            return targetSocket;
        }else{
            logger.info('不能根据uuid找到socketid,uuid为', UUID);
        }
    }
    return null;
}

/** 
 * 判断是否null 
 * @param {string} data
 * @return bool 
 */
function isNull(data){ 
    return (data == "" || data == undefined || data == null) ? false : true; 
}



