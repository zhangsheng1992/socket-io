$().ready(function (){
    Init();
});

var timer=90;//倒计时初始时间为90秒
var imple=null;
var myDate=new Date();
var myTime=myDate.getTime();
var sta=parseInt(myTime * Math.random());//根据时间取随机数
var curImg="/images/coded.gif";//无效二维码图片地址
$(function(){
    imple=setInterval(count,1000);//每一秒钟执行一次倒计时方法
})

function refresh(){
    Init();
    $(".expir").hide();//二维码过期层隐藏
    $(".count").show();//二维码倒计时层显示
    imple=setInterval(count,1000);
}
//实现倒计时功能
function count(){
    if(timer>0){
        timer--;
        $(".count span").text(timer);
        if(timer==0){//时间为0
            $(".code_box").children("img").prop("src",curImg);//调用无效二维码提示图片
            $(".count").hide();//有效二维码层消失
            $(".expir").show();//无效二维码提示层显示
            clearInterval(imple);
            $(".count span").text("90");//倒计时初始时间置为90
            $(".shuaxin").click(refresh);
            return timer=90;
        }
    }
}

//刷新二维码
//调整下信息  先建立socket链接  再刷新二维码
function Init(){
    getsalt(function (data){
        socketInit(data.data,function (){
            //链接成功 且数据库插入数据成功以后再出现二维码
            getQrcode(data.data.uuid);
        });   	
    });
}


//获取uuid
function getsalt(callback){
	$.ajax({
     	type: "GET",
 	url: "/application/base/getSalt",
     	dataType: "json",
     	success: function(data){
            callback(data);
        }
    });
}


//获取二维码
function getQrcode(uuid){
    $(".shuaxin").unbind("click");
    $(".code_box").children("img").prop("src","/application/base/getQrCode?salt="+uuid);
    $(".code_box").children("img").css('width',"288px");
    return false;
}

/**
 * 链接socket
 */
function socketInit(data,callback){
    console.log(data);
    var url = 'http://'+ data.host+":"+data.port;
    var socket = io.connect(url);

    //向服务器发送uuid绑定socket.id  
    socket.emit('/register',{uuid:data.uuid}); 
    console.log("链接成功");
    
    socket.on('/insertSuccess',function (data){
        console.log("uuid已保存");
        callback();
    });

    //手机端扫码成功
    socket.on('/appconnect',function(data){  
        console.log(data);
        console.log("扫码成功");
    });


    //手机端确认登陆
    socket.on('/appconfirm',function(data){  
        console.log(data);  
        window.location.href="/application/base/upload?token=" + data.data;
    });
    
    //错误提示
    socket.on('/error',function (data){
        console.log(data.message);
    });
}

