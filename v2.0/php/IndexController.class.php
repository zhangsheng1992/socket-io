<?php
//这个就是个后端框架的一个控制器例子
class controller {
     /**
      * 获取二维码
      */
     public function getQrCodeAction(){
         $salt = $_GET['salt'];
         if(empty($salt)){
             $this->response(self::ERROR);
         }
         require_once 'phpqrcode/phpqrcode.php';
         $message = [
             'uuid'=>$salt,
             'port'=>self::PORT,
             'host'=>self::HOST
         ];
         \QRcode::png(base64_encode(json_encode($message)));
     }

     /**
      * 获取唯一标识符
      */
     public function getSaltAction(){
         $str = md5(time().mt_rand(1000, 9999));
         $this->response(self::SUCCESS,['uuid'=>$str,'host'=>self::HOST,"port"=>self::PORT]);
     }
}
