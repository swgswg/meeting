var localDisplayVideo = document.querySelector('#localVideoBig');


/**
 * 获取共享桌面流
 * @param successCallback
 * @param errorCallback
 */
const displayConstraints = {
    video: true,
    audio: true
};

function getDisplayMedia(successCallback) {
    let displayMedia = null;
    if (navigator.getDisplayMedia) {
        displayMedia = navigator.getDisplayMedia(displayConstraints);
    } else if (navigator.mediaDevices.getDisplayMedia) {
        displayMedia = navigator.mediaDevices.getDisplayMedia(displayConstraints);
    } else {
        displayMedia = navigator.mediaDevices.getUserMedia({audio:true, video: {mediaSource: 'screen'}});
    }
    displayMedia
        .then((stream)=>{
            getDisplayMediaSuccess(stream, successCallback);
        })
        .catch(getDisplayMediaError);
}



function getDisplayMediaSuccess(stream, successCallback) {
    localDisplayStream  = stream;
    localDisplayVideo.srcObject = stream;
    successCallback();
}


function getDisplayMediaError(e) {
    console.log('getDisplayMediaError');
    console.log(e);
}



// 屏幕静音
function muteDisplayAudio(mute = false) {
    return muteAudio(localDisplayStream, mute);
}


// 屏幕黑屏
function muteDisplayVideo(mute = false) {
    return muteVideo(localDisplayStream, mute);
}

























































