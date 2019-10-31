window.onload = function(){
    var run = document.getElementById('run');
    var clear = document.getElementById('clear');
    var addGroup = document.getElementById('add_group');
    var currentProxy = document.getElementById('currentProxy');
    var groupHead = this.document.querySelectorAll('.group-wrap');
    var wrap = this.document.querySelector('.wrap');
    var dataConfig = JSON.parse(localStorage.getItem('CLASS')) && JSON.parse(localStorage.getItem('CLASS')).length ? JSON.parse(localStorage.getItem('CLASS')) : [];
    // dataConfig =  localStorage.getItem('CLASS') && localStorage.getItem('CLASS').length ? localStorage.getItem('CLASS') : [];
    /*深层定位*/
    function deepLocate (name, id, base) {
        let obj = {}
        let find = false;
        for(let k in base) {
            if(typeof(base[k]) == 'object' && !find) {
                if (base[k].name && base[k].name == name && base[k].data[id]) {
                    return {
                        obj: base[k].data[id],
                        find: true,
                    };
                } else {
                    obj = deepLocate(name, id, base[k]);
                    find = obj.find;
                }
            }
        }
        return obj
    };

    function addItem (name){
        dataConfig.push({name:`${name}`,data:[]});
        createOption(dataConfig)
    }

    function renderItem(data) {
        var dataLi = '';
        data.data.map(function(k, i){
            dataLi += `<li>
                <div class="ipt-wrap">
                    <input type="text" name="sourceFile" data-group=${data.name} class="sourceFile" data-id=${i} placeholder="源文件" value=${k.s || ''}>
                </div>
                <div class="ipt-wrap">
                    <input type="text" name="targetFile" data-group=${data.name} class="targetFile" data-id=${i} placeholder="替换为" value=${k.t || ''}>
                </div>
                <input type="checkbox" class="checkbox" name=${data.name} data-id=${i} ${k.checked ? "checked" : ""}>
            </li>`;
        })
        return dataLi;
    }
    
    function createOption(dataList, node) {
        var itemStr = '';
        dataList.map(function(key, index) {
            itemStr += `<div class="group-wrap">
                <h5>${key.name}</h5>
                <div class="data-ul-wrap">
                    <ul>
                        ${renderItem(key)}
                    </ul>
                    <a href="javascript:;" class="add_item" data-group=${key.name}></a>
                    <a href="javascript:;" class="del_item" data-group=${key.name}></a>
                </div>
            </div>`;
        })
        wrap.innerHTML = itemStr;
    }

    function editPath(e) {//编辑
        if(e.target.type == 'text') {
            var groupName = e.target.dataset.group;
            var inputId = e.target.dataset.id;
            var type = e.target.classList.contains('sourceFile') ? 's' : 't';
            var value = e.target.value;
            dataConfig.map((key, index) => {
                if(key.name == groupName) {
                    key.data[inputId][type] = value;
                }
            })
        } else {
            var groupName = e.target.name;
            var inputId = e.target.dataset.id;
            var value = e.target.checked;
            // deepLocate(groupName, inputId, dataConfig).obj.checked = value;
            console.log(dataConfig);
        }
    }

    createOption(dataConfig);

    function createProxyArr () {
        let checkboxList = document.querySelectorAll(`.checkbox`);
        let proxyArr = [];
        for(var i=0;i<checkboxList.length;i++){
            let k = checkboxList[i];
            let name = k.name;
            let id = k.dataset.id;
            if(k.checked) {
                dataConfig.map((key,index) => {
                    if(key.name == name) {
                        key.data[id].checked = true;
                    }
                })
                proxyArr.push(deepLocate(name, id, dataConfig).obj)
            }
        };
        return proxyArr;
    }


    run.addEventListener('click',function(){
        let proxyArr = createProxyArr();
        localStorage.setItem('CLASS',JSON.stringify(dataConfig))
        chrome.runtime.sendMessage({proxyArr:proxyArr}, function(response) {
            console.log(response.proxy)
            let str = '';
            response.proxy.map((key, index) => {
                str+= `<p>源：${key.s}<p><p>目标：${key.t}<p>`
            })
            currentProxy.innerHTML = str;
        });
        
    },false);

    clear.addEventListener('click',function() {
        dataConfig.map((key,index) => {
            for(var i=0;i<key.data.length;i++){
                key.data[i].checked = false;
            }
        })
        localStorage.setItem('CLASS',JSON.stringify(dataConfig))
        createOption(dataConfig);
        let proxyArr = createProxyArr();
        chrome.runtime.sendMessage({proxyArr:proxyArr}, function(response) {
            console.log(response.proxy)
            let str = '';
            response.proxy.map((key, index) => {
                str+= `<p>源：${key.s}<p><p>目标：${key.t}<p>`
            })
            currentProxy.innerHTML = str;
        });
    },false)

    addGroup.addEventListener('click',function(){
        // console.log(prompt("请输入分组名称"))
        let keyword = prompt("请输入分组名称");
        if(keyword){
            addItem(keyword);
        }
    },false);

    document.body.addEventListener('change', function(e){
        editPath(e)
    },false)
    
    document.body.addEventListener('click',function(e){ 
        if(e.target.tagName == 'H5') {
            let curNode = e.target.nextElementSibling;
            curNode.classList.toggle('none');
        } else if(e.target.classList.contains('add_item')) {
            let tag = e.target.dataset.group;
            dataConfig.map(function(k, i){
                if (k.name == tag) {
                    k.data.push({'checked': false});
                }
            })
            localStorage.setItem('CLASS',JSON.stringify(dataConfig))
            createOption(dataConfig, e.target.parentNode);
        } else if(e.target.classList.contains('del_item')) {
            let tag = e.target.dataset.group;
            dataConfig.map(function(k, i){
                if (k.name == tag) {
                    var arr = new Array(...k.data);
                    let checkboxList = document.querySelectorAll(`.checkbox`);
                    let checkboxListArr = [];
                    for(var i = 0;i < checkboxList.length; i++){
                        checkboxListArr.push(checkboxList[i]);
                    }
                    checkboxListArr = checkboxListArr.filter(item => item.name == tag);
                    console.log('xxxxxxx', checkboxListArr)
                    for(var i = 0;i < checkboxListArr.length; i++){
                        if(checkboxListArr[i].checked) {
                            var checkedIndex = checkboxListArr[i].dataset['id'];
                            delete arr[checkedIndex];
                        }
                    }
                    arr = arr.filter(item => item != 'undefined');
                    k.data = arr;
                }
            });
            localStorage.setItem('CLASS',JSON.stringify(dataConfig))
            createOption(dataConfig, e.target.parentNode);
        }
    },false)
    
}
