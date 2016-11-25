
import UIKit
import AVFoundation

class WKQrCodeViewController: UIViewController,AVCaptureMetadataOutputObjectsDelegate {
    
    fileprivate let sWidth = UIScreen.main.bounds.size.width
    fileprivate let sHeight = UIScreen.main.bounds.size.height
    fileprivate let maskViewColor = UIColor.black
    fileprivate let maskViewAlpha : CGFloat = 0.3
    
    deinit {
        print("二维码界面被销毁了")
    }
    
    
    
    //比例
    let scaleWidth : CGFloat = 0.6
    var session:AVCaptureSession?
    var lineView:UIImageView? = UIImageView.init(imageName: "qrscan_line")
    var timer = Timer()
    
    fileprivate var isSent: Bool = false
    
    override func viewWillAppear(_ animated: Bool) {
        
        //即将进入时对状态条进行隐藏
        UIApplication.shared.setStatusBarHidden(true, with: UIStatusBarAnimation.none)
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        self.timer.invalidate()
    }
  
    override func viewDidLoad() {
        
        super.viewDidLoad()
 
        //二维码框上的动画计时器
        self.timer = Timer.scheduledTimer(timeInterval: 2, target: self, selector: #selector(configLine), userInfo: nil, repeats: true)
        //获取摄像设备,注意是Video而不是Audio
        let device = AVCaptureDevice.defaultDevice(withMediaType: AVMediaTypeVideo)
        //初始化AV Session来协调和处理AV的输入和输出流
        let session = AVCaptureSession()
        
        //创建输入流
        let input:AVCaptureDeviceInput? = try! AVCaptureDeviceInput(device: device)
        
        if session.canAddInput(input){
            session.addInput(input)
        }
        
        //创建输出流
        let output:AVCaptureMetadataOutput = AVCaptureMetadataOutput()
        if session.canAddOutput(output){
            session.addOutput(output)
            //设置输出流代理，从接收端收到的所有元数据都会被传送到delegate方法，所有delegate方法均在queue中执行
            output.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
            //设置元数据的类型，这里是二维码QRCode
            output.metadataObjectTypes = [AVMetadataObjectTypeQRCode]
            
//            //固定宽度
//            let gdWidth : CGFloat = 200
//            let scaleWidth : CGFloat = 200 / sWidth
            
            //比例
//            let scaleWidth : CGFloat = 0.6
            /*!
             这个是手机横着的时候的 x,y,w,h
             */
            
            output.rectOfInterest = CGRect(x : (1 - scaleWidth * sHeight / sWidth) / 2, y : (1 - scaleWidth) / 2,width : scaleWidth * sHeight / sWidth, height :  scaleWidth)
            print(output.rectOfInterest)
        }
        
        //创建视频设备拍摄视频区域
        let layer:AVCaptureVideoPreviewLayer = AVCaptureVideoPreviewLayer.init(session: session)
        
        layer.videoGravity = AVLayerVideoGravityResizeAspectFill
        
        layer.frame = CGRect(x : 0, y : 0, width : UIScreen.main.bounds.size.height,height : UIScreen.main.bounds.size.width);
        
        self.view.layer.addSublayer(layer)
    
        //上
        let topView = UIView()
        print((sHeight - sWidth * scaleWidth) / 2)
        print(sHeight)//320
        print(sWidth)//640
        topView.frame = CGRect(x:0, y:0, width:sHeight, height:(sWidth -  sHeight * scaleWidth) / 2)
        topView.backgroundColor = maskViewColor
        topView.alpha = maskViewAlpha
        
        //下
        let downView = UIView()
        downView.frame = CGRect(x:0, y:sWidth - topView.frame.size.height, width:topView.frame.size.width, height:topView.frame.size.height)
        downView.backgroundColor = maskViewColor
        downView.alpha = maskViewAlpha
        
        //左
        let leftView = UIView()
        leftView.frame = CGRect(x:0,y:topView.frame.size.height,width:(sHeight - (sWidth - 2*topView.frame.size.height)) / 2, height:sWidth - 2*topView.frame.size.height)
        leftView.backgroundColor = maskViewColor
        leftView.alpha = maskViewAlpha

        //右
        let rightView = UIView()
        rightView.frame = CGRect(x:sWidth - 2*topView.frame.size.height + leftView.frame.size.width, y:topView.frame.size.height, width:(sHeight - (sWidth - 2*topView.frame.size.height)) / 2, height:sWidth - 2*topView.frame.size.height)
        rightView.backgroundColor = maskViewColor
        rightView.alpha = maskViewAlpha
        
        //温馨提示（上）
        var tmpview = UIView()
        tmpview = tmpview.configOnPrompt(center: rightView.center)
        view.addSubview(tmpview)
        //温馨提示（下）
        var lab = UILabel()
        lab = lab.configDownPrompt(frame: leftView.frame)
        view.addSubview(lab)
        
        self.view.layer.addSublayer(topView.layer)
        self.view.layer.addSublayer(downView.layer)
        self.view.layer.addSublayer(leftView.layer)
        self.view.layer.addSublayer(rightView.layer)
  
        //线
        configLine()
        
        //框
        configborder()
        
        //取消
        configBack()
        
        //开始采集视频数据
        session.startRunning()
 
    }
    
    func configBack() -> Void {
        
        let backButton = UIButton()
        backButton.setTitle("取消", for: .normal)
        backButton.sizeToFit()
        backButton.frame = CGRect(x:sHeight - 37.5, y:15, width:40, height:20)
        backButton.transform = CGAffineTransform(rotationAngle: CGFloat(M_PI_2));
        
        backButton.backgroundColor = UIColor.clear
        backButton.addTarget(self, action: #selector(backEvent), for: UIControlEvents.touchUpInside)

        view.addSubview(backButton)
 
    }
    
    func backEvent() -> Void {
   
        print("二维码界面的返回被点击")
        guard (self.presentingViewController? .isKind(of: WKQrConfirmViewController.classForCoder()))! else {
            
            self.presentingViewController?.dismiss(animated: true, completion: nil)
            return
        }
        
        self.presentingViewController?.presentingViewController?.dismiss(animated: true, completion: nil)
     
    }
    
     //线(存在问题是图片不能够放在UIImageView上)
    func configLine() -> Void {
        
        /*
         imageView.contentScaleFactor = [[UIScreen mainScreen] scale];
         5
         imageView.contentMode = UIViewContentModeScaleAspectFill;
         6
         imageView.autoresizingMask = UIViewAutoresizingFlexibleHeight;
         7
         imageView.clipsToBounds = YES;
         */
//        lineView?.contentScaleFactor = UIScreen.main.scale
//        lineView?.autoresizingMask = .flexibleHeight
//        lineView?.contentMode = .scaleAspectFill
        

        lineView!.frame = CGRect(x: (sHeight - (sWidth - 2*(sWidth -  sHeight * scaleWidth) / 2)) / 2 + self.sWidth - 2*(self.sWidth - self.sHeight * self.scaleWidth) / 2,y:  (sWidth -  sHeight * scaleWidth) / 2, width: 2, height: (sWidth -  sHeight * scaleWidth) / 2 + 2)

        UIView.animate(withDuration: 2) {
            
            self.lineView!.frame = CGRect(x: (self.sHeight - (self.sWidth - 2*(self.sWidth -  self.sHeight * self.scaleWidth) / 2)) / 2,y: (self.sWidth -  self.sHeight * self.scaleWidth) / 2,width: 2, height: (self.sWidth -  self.sHeight * self.scaleWidth) / 2 + 2)
            self.view.addSubview(self.lineView!)
            
            
        }
        
    }

    func configborder() -> Void {
        
        let qrCodeFrameView = UIImageView(image: UIImage(named: "qrscan_frame"))
        qrCodeFrameView.frame = CGRect(x:(sHeight - (sWidth - (sWidth -  sHeight * scaleWidth))) / 2, y:(sWidth -  sHeight * scaleWidth) / 2, width:sWidth - (sWidth -  sHeight * scaleWidth), height:sWidth - (sWidth -  sHeight * scaleWidth))
        view.addSubview(qrCodeFrameView)
        self.view.layer.addSublayer(qrCodeFrameView.layer);
    }
    
    //实现AVCaptureMetadataOutputObjectsDelegate的成员方法来处理二维码信息
    @objc(captureOutput:didOutputMetadataObjects:fromConnection:) func captureOutput(_ captureOutput: AVCaptureOutput!, didOutputMetadataObjects metadataObjects: [Any]!, from: AVCaptureConnection!) {
        session?.stopRunning()
    
        //获取二维码信息元数据
        guard let metadataObject = metadataObjects.first else {
            return
        }
        
        //让扫描只执行一次
        if isSent == true {
            return
        }
        isSent = true
        
        let readableObject = metadataObject as! AVMetadataMachineReadableCodeObject
        
        //添加震动
        AudioServicesPlaySystemSound(SystemSoundID(kSystemSoundID_Vibrate))
    
// MARK: - 拿到加密串base64 解码 && 反序列化
        let decodedData = NSData(base64Encoded
            : readableObject.stringValue!, options:.ignoreUnknownCharacters )
        
        let decodedString = String(data: decodedData! as Data, encoding: String.Encoding.utf8)
        
        let UTF8Data = decodedString?.data(using: String.Encoding.utf8)

        let oResult = try! JSONSerialization.jsonObject(with: UTF8Data!, options: [JSONSerialization.ReadingOptions.mutableContainers, JSONSerialization.ReadingOptions.mutableLeaves])
        print(oResult)
        guard let result = oResult as? [String: AnyObject] else {
            print("result没解析出来！！")
            return
        }

        let host = result["host"] as! String
        let port = String(describing: result["port"])
        let uuid = result["uuid"] as! String
        
        let viewModel = WKQrCodeViewModel()
        
        viewModel.qrCodeUpData(host: host, port : port, UUID: uuid, success: {
            
                let userToken = UserAccountViewModel.sharedUserAccount
                let para = ["uuid" : uuid, "token" : userToken.accessToken!] as [String : Any]
                print(para)
            

                viewModel.qrCodeUpDataAgain(para: para as! Dictionary<String, String>, success: {
              
                    //第二次网络请求成功，触发去除二维码界面，返回跳进刷新界面
                    //完成跳转后对二维码界面进行销毁
                    self.dismiss(animated: false, completion: nil)
                    let confirmVC = WKQrConfirmViewController()
                    
                    self.presentingViewController?.present(confirmVC, animated: true, completion: {
                      
                    })
                    
                }, failure: { (errMsg) in
                    print("打印第二次失败信息:\(errMsg)")
                    
                    let alert = UIAlertController(title: "温馨提示", message: "服务器故障，请取消扫码", preferredStyle: .alert)
                    alert.addAction(UIAlertAction(title: "知道了", style: .default){(action)->() in
                        
                        alert.view.isHidden = true
                    })
                    
                    alert.view.isHidden = true
                    self.present(alert, animated: true, completion: {() -> Void in
                        
                        alert.view.transform = CGAffineTransform(rotationAngle: CGFloat(M_PI_2))
                        alert.view.isHidden = false
                    })
                })

            
            }) { (errMsg) in
                print("打印失败信息\(errMsg)");

                let alert = UIAlertController(title: "温馨提示", message: "服务器故障，请取消扫码", preferredStyle: .alert)
                alert.addAction(UIAlertAction(title: "知道了", style: .default){(action)->() in
                    
                    alert.view.isHidden = true
                })
                
                alert.view.isHidden = true
                self.present(alert, animated: true, completion: {() -> Void in
                    
                    alert.view.transform = CGAffineTransform(rotationAngle: CGFloat(M_PI_2))
                    alert.view.isHidden = false
                })
        }
    }
    
    override var shouldAutorotate : Bool {
        return false
    }

    override var supportedInterfaceOrientations : UIInterfaceOrientationMask {
        return UIInterfaceOrientationMask.portrait
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
  
}

//MARK: 二维码界面提示
extension UIView {
    
    func configOnPrompt(center:CGPoint) -> UIView {
        
        let promptLab1 = UILabel()
        let promptLab2 = UILabel()
        let backboard = UIView()
        
        backboard.backgroundColor = UIColor.clear
        backboard.bounds = CGRect(x: 0,y: 0,width: 300,height: 40)
        backboard.center = center
        
        promptLab1.text = "请使用电脑登陆"
        promptLab1.textColor = UIColor.white
        promptLab1.font = UIFont.boldSystemFont(ofSize: 15)
        promptLab1.textAlignment = .center
        promptLab1.backgroundColor = UIColor.clear
        promptLab1.numberOfLines = 1
        promptLab1.frame = CGRect(x: 0,y: 0,width: 300,height: 15)
        promptLab2.text = "www.yiqiweikeshangchuan.com"
        promptLab2.textColor = UIColor.white
        promptLab2.font = UIFont.boldSystemFont(ofSize: 14)
        promptLab2.textAlignment = .center
        promptLab2.backgroundColor = UIColor.clear
        promptLab2.numberOfLines = 1
        promptLab2.frame = CGRect(x: 0,y: 20,width: 300,height: 15)
        
        backboard.addSubview(promptLab1)
        backboard.addSubview(promptLab2)
        
        backboard.transform = CGAffineTransform(rotationAngle: CGFloat(M_PI_2))
        return backboard
    }
}

extension UILabel {

    //温馨提示lable（下）
    func configDownPrompt(frame:CGRect) -> UILabel {
        
        let promptLab = UILabel()
        promptLab.text = "扫码登陆后进行上传"
        promptLab.textColor = UIColor.white
        promptLab.font = UIFont.boldSystemFont(ofSize: 15)
        promptLab.textAlignment = .center
        promptLab.backgroundColor = UIColor.clear
        promptLab.numberOfLines = 1
        promptLab.transform = CGAffineTransform(rotationAngle: CGFloat(M_PI_2))
        promptLab.frame = frame
        return promptLab
    }
}


