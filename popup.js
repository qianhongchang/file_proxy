var proxyArr = null;
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log('选择的环境',request)
        proxyArr = request.proxyArr;
        sendResponse({proxy: proxyArr});
    }
);

// 这里是onBeforeRequest
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if(proxyArr) {
            console.log("这里是测试测试",proxyArr);
            if(proxyArr.length == 0){//如果没有指定代理某个文件，默认代理全部
                return;
            }else{
                for(var i=0;i<proxyArr.length;i++){
                    if(proxyArr[i].s.indexOf('*') != -1 && proxyArr[i].t.indexOf('*') != -1 ) {
                        var sTag = proxyArr[i].s.split('*')[0];
                        var tTag = proxyArr[i].t.split('*')[0];
                        if(details.url.indexOf(sTag) != -1){
                            var targetEnd = details.url.split(sTag)[1];
                            return {
                                redirectUrl: tTag+targetEnd
                            };
                        }
                    }else{
                        if(proxyArr[i].s.indexOf(details.url) != -1){
                            var targetJs = proxyArr[i].t;
                            return {
                                redirectUrl: targetJs
                            };
                        }
                    }
                }
            }
        }
    },
    {urls: ["<all_urls>"]},
    ["blocking"]
);