/**
 * 随机字符串
 * @param length
 * @returns {string}
 */
function getRandChars(length = 6) {
    let str = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
        'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
        'u', 'v', 'w', 's', 'y', 'z', '1', '2', '3', '4',
        '5', '6', '7', '8','9', '0'
    ];
    let chars = '';
    for(let i = 0; i < length; i++){
        chars += str[rand(0, 35)];
    }
    return chars;
}


/**
 * 区间内的随机数
 * @param m
 * @param n
 * @returns {number}
 */
function rand(m,n){
    return Math.ceil(Math.random()*(n-m+1))+(m-1);
}


/**
 * 随机数字
 * @param length
 * @returns {string}
 */
function getRandNumber(length = 6) {
    let str = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    let chars = '';
    for(let i = 0; i < length; i++){
        chars += str[rand(0, 9)];
    }
    return chars;
}


/**
 * 格式化时间
 * @param format
 * @param time
 * @returns {string}
 */
function formatDate(format='Y-m-d h:i:s', time = null){
    let date = null;
    if(time){
         date = new Date(time);
    } else {
        date = new Date();
    }
    let year = date.getFullYear(),
        month = date.getMonth()+1,//月份是从0开始的
        day = date.getDate(),
        hour = date.getHours(),
        min = date.getMinutes(),
        sec = date.getSeconds();
    
    let newTime = format
        .replace(/Y/g, year)
        .replace(/m/g, month)
        .replace(/d/g, day)
        .replace(/h/g, hour)
        .replace(/i/g, min)
        .replace(/s/g, sec);
    return newTime;
}



//如果返回的是false说明当前操作系统是手机端，如果返回的是true则说明当前的操作系统是电脑端
function IsPC() {
    let userAgentInfo = navigator.userAgent;
    let Agents = ["Android", "iPhone","SymbianOS", "Windows Phone","iPad", "iPod"];
    let flag = true;
    let len = Agents.length;
    for (let v = 0; v < len; v++) {
        if (userAgentInfo.indexOf(Agents[v]) > 0) {
            flag = false;
            break;
        }
    }
    
    return flag;
}

//如果返回true 则说明是Android  false是ios
function is_android() {
    let u = navigator.userAgent, app = navigator.appVersion;
    let isAndroid = u.indexOf('Android') > -1 || u.indexOf('Linux') > -1; //g
    let isIOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
    if (isAndroid) {
        //这个是安卓操作系统
        return true;
    }
    
    if (isIOS) {
        //这个是ios操作系统
        return false;
    }
}


/**
 * byte转化为 KB MB GB
 * @param byte
 * @returns {string}
 */
function bytesTo(byte) {
    let k = parseInt(byte) / 1024;
    let m = 0;
    if(k > 1024){
        m = k / 1024;
        if(m > 1024){
            let g = (m / 1024).toFixed(2);
            return g + 'GB';
        } else {
            return m.toFixed(2) + 'MB'
        }
    } else {
        return k.toFixed(2) + 'KB';
    }
}


/**
 * 睡眠 秒
 * @param second
 */
function sleep(second = 1) {
    setTimeout(function () {}, second * 1000);
}


/**
 * 睡眠 毫秒
 * @param millisecond
 */
function usleep(millisecond = 1000) {
    setTimeout(function () {}, millisecond);
}


/**
 * 二进制转换为字符串
 * @param buffer
 * @returns {string}
 */
function arrayBufferToBase64(buffer) {
    let binary = '';
    let bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len; ++i){
        binary += String.fromCharCode( bytes[i] );
    }
    return btoa( binary );
}


/**
 * 字符串转二进制
 * @param b64Data
 * @param contentType
 */
function base64ToBlob(b64Data, contentType) {
    contentType = contentType || '';
    
    let byteArrays = [];
    let byteNumbers = 0;
    let slice = '';
    
    let len = b64Data.length;
    for (let i = 0; i < len; ++i){
        slice = b64Data[i];
        let sliceLen = slice.length;
        byteNumbers =  new Array(sliceLen);
        for(let j = 0; j < sliceLen; ++j){
            byteNumbers[j] = slice.charCodeAt(j);
        }
        let byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, {type: contentType});
}


/**
 * 获取文件名的扩展
 * @param fileName
 * @returns {*}
 */
function getFileExt(fileName) {
    return fileName.slice(fileName.lastIndexOf('.') + 1);
}


function generateRoomId(roomId) {
    if (roomId > 65535) {
        roomId = roomId - 65535
    }
    return roomId;
}


function getNowTimestamp() {
    return new Date().getTime();
}