var localUserStream = null;

var localUserVideo = document.querySelector('#localVideoSmall');
var width = localUserVideo.offsetWidth;
var height = localUserVideo.offsetHeight;

function setVideoConstraints(options) {
    let mute = false;
    if(options.isMeetingMute){
        mute = true;
    }
    let audio = mute ? false : {
        // 音量调整（范围 0-1.0， 0为静音，1为最大声）
        volume: 1,
        // 回音消除 （true/false）
        echoCancellation: true,
        // 自动增益 （在原有录音的基础上是否增加音量， true/false）
        autoGainControl: true,
        // 是否开启降噪功能 （true/false）
        noiseSuppression: true,
        deviceId: options.audioSource ? {exact: options.audioSource} : undefined
    };
    
    let video = {
        width: options.width || width,
        height: options.height || height,
        // 帧率'
        frameRate:options.fpxRange || 20,
        // 摄像头 user前置摄像头 environment后置摄像头 left前置左侧摄像头 right前置右侧摄像头
        facingMode: 'user',
        // 采集画面是否裁剪
        resizeMode: false,
        // 多个摄像头或音频输入输出设备时，可进行设备切换（例如切换前后置摄像头）
        deviceId: options.videoSource ? {exact: options.videoSource} : undefined
    };
    
    return {
        audio: audio,
        video: video
    };
}


function getUserMedia(successCallback, options = {} ) {
    let constraints = setVideoConstraints(options);
    if(navigator.mediaDevices.getUserMedia){
        navigator.mediaDevices
            .getUserMedia(constraints)
            .then((stream)=>{
                return getUserMediaSuccess(stream, successCallback);
            })
            .then(gotDevices)
            .catch(getUserMediaError);
        
    } else {
        alert('您的浏览器不支持[视频], 请更换浏览器!!!');
    }
}


function gotDevices(deviceInfos){

}


function getUserMediaSuccess(stream, successCallback) {
    localUserStream  = stream;
    localUserVideo.srcObject = stream;
    successCallback();
    return navigator.mediaDevices.enumerateDevices();
}




function getUserMediaError(e) {
    console.log('getUserMediaError');
    console.log(e);
    alert('请确定您的电脑是否有摄像头!!!');
}



// 视频静音
function muteUserAudio(mute = false) {
    return muteAudio(localUserStream, mute);
}


// 视频黑屏
function muteUserVideo(mute = false) {
    return muteVideo(localUserStream, mute);
}
