
import Foundation

class WKQrCodeViewModel {
    
    var url = "" //不含路径
    private let netTool = NetworkTools.sharedTools;
    
    func qrCodeUpData(host : String, port : String, UUID : String, success :  @escaping ()->(), failure : @escaping (_ errMsg : String) -> ()) {
        
        //协议
        let url_protocol = "http://"
        //路径
        let url_host = host;
        //端口号(暂用8889)
        let url_port = ":8889"
        //前缀
        let path = "/connection"
        
        url = url_protocol + url_host + url_port
        
        print("第一次当前的url是\(url)")
        //url
        let urlStr: String = url + path
        
        //参数
        let param = ["uuid":UUID]

        print("拼接后的网址是\(urlStr),parameterDic是\(param)")
        
        //请求
        netTool.request(.POST, URLString: urlStr, parameters: param as [String : AnyObject]?) { (result, error) in
            
            if error == nil {
                guard let result = result as? [String: AnyObject] else {
                    return
                }
                
                guard let status = result["status"] as? String else {
                    return
                }
                print(status,result)
                
                if Int(status) == 0 {
                    success()
                }else {
                    
                    guard let message = result["message"] as? String else {
                        return
                    }
                    failure(message)
                }
            } else {
     
                
                failure("网络异常")
            }
        }
    }
    
    //第二次请求
    func qrCodeUpDataAgain(para : Dictionary<String, String>, success:@escaping ()->(), failure:@escaping (_ errMsg : String)->()) -> Void {
        
        print(url)
        netTool.request(.POST, URLString: url+"/confrim", parameters: para as [String : AnyObject]?) { (result, error) in
            
                if error == nil {
                guard let result = result as? [String: AnyObject] else {
                    return
                }
            
                guard let status = result["status"] as? String else {
                    return
                }
                print(status,result)
                
                if Int(status) == 0 {
                    
                    success()
                }else {
                    guard let message = result["message"] as? String else {
                        
                        return
                    }
                    //服务器返回失败消息
                    failure(message)
                }
            }else {

                failure("网络异常")
            }
        }
    }
}



