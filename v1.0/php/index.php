<?php
include 'qrcode/phpqrcode.php';
//uuid 唯一的标示符 用于指定客户端收发信息
$uuid = 'abc123';
//生成二维码文件
$filename = 'qrcode'.time().mt_rand(1000,9999).'.png';
//二维码中包含的数据
$data = [
    "ip"=>'127.0.0.1',
    "port"=>'8888',
    'exprise'=>time()+60,
    'uuid'=>$uuid
];

try{
   QRcode::png('$data','temp/'.$filename,'L',15);
   echo json_encode(['code'=>1,'message'=>'temp/'.$filename,'uuid'=>$uuid]);
}catch(\Exception $e) {
   echo json_encode(['code'=>0,'message'=>$e->getMessage()]);
}




