// 自己的userId
var localUserId;
// 房间号
var roomId = 0;
var roomInfo = {};

// 是否共享屏幕 true是/false否
var isDisplayMedia = false;

// 显示自己的video标签
var localVideoSmall = document.getElementById('localVideoSmall');
var width = localVideoSmall.offsetWidth;
var height = localVideoSmall.offsetHeight;


// 本地视频资源
var localStream = {};

// 存放连接人的对应的PeerConnection  userId:peerConnecti
var remotePeer = {};
var remoteChannel ={};

var offerOptions = {
    offerToRecieveAudio: 1,
    offerToRecieveVideo: 1
};

var pcConfig = {
    rtcpMuxPolicy: 'require',
    bundlePolicy: 'max-bundle',
    iceServers: [
        {
            'urls': 'turn:stun.chuanqingkeji.net:3478',
            'credential': "demo",
            'username': "demo"
        },
        {
            'urls': 'turn:im.chuanqingkeji.net:3478',
            'credential': "demo",
            'username': "demo"
        },
        {
            'urls': 'turn:stun.gl.learningrtc.cn:3478',
            'credential': "mypasswd",
            'username': "garrylea"
        },
        // {
        //     'urls': 'stun:stun2.l.google.com:19302',
        // },
        // {
        //     'urls': 'stun:stun.ekiga.net',
        // },
        // {
        //     'urls': 'stun:stun.freeswitch.org',
        // },
        // {
        //     'urls': 'stun:stun.xten.com',
        // },
        // {
        //     'urls': 'stun:stun.voxgratia.org',
        // },
        // {
        //     'urls': 'stun:stun.ideasip.com',
        // },
        // {
        //     'urls': 'stun:stun.voiparound.com',
        // },
        // {
        //     'urls': 'stun:stun.voipbuster.com',
        // },
        // {
        //     'urls': 'stun:stun.voipstunt.com',
        // },
    ]
};


var channelOptions = {
    negotiatend: true,  // 是否双方通信
    id: roomId,
    ordered: true,    // 指示数据通道是否保证按顺序传递消息
    maxRetransmits:5, // 消息失败的重传次数
};


/**
 * 开启 WebRTC 获取音视频资源
 * @param _roomId
 * @param _userId
 * @param useUserStream
 * @param useDisplayStream
 */
function startWebRTC(_userId, _roomId, _roomInfo, useUserStream = false, useDisplayStream = false, options = {}){
    localUserId = _userId;
    roomId = _roomId;
    roomInfo = _roomInfo;
    channelOptions.id = roomId;
    getMediaStream(useUserStream, useDisplayStream, options);
    
}



/**
 * 获取资源
 */
function getMediaStream(useUserStream = false, useDisplayStream = false, options = {}) {
    if(navigator.mediaDevices){
        if(useUserStream){
            getUserMedia(options);
        }
        if(useDisplayStream){
            getDisplayMedia();
        }
    }else {
        alert('您的浏览器不支持, 请更换浏览器!!!');
    }
}


function setVideoConstraints(options = {}) {
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


/**
 * 获取视频
 * @param options
 */
function getUserMedia(options = {}) {
    // const audioSource = audioInputSelect.value;
    // const videoSource = videoSelect.value;
    let constraints  = setVideoConstraints(options);
    if(navigator.mediaDevices.getUserMedia){
        navigator.mediaDevices
            .getUserMedia(constraints)
            .then(getUserMediaSuccess)
            .then(gotDevices)
            .catch(getUserMediaError);
        
    } else {
        alert('您的浏览器不支持[视频], 请更换浏览器!!!');
    }
}


function getDisplayMedia() {
    let constraints = {
        video: true,
        audio:true
    };
    let displayMedia = null;
    if (navigator.getDisplayMedia) {
        displayMedia = navigator.getDisplayMedia(constraints);
    } else if (navigator.mediaDevices.getDisplayMedia) {
        displayMedia = navigator.mediaDevices.getDisplayMedia(constraints);
    } else {
        displayMedia = navigator.mediaDevices.getUserMedia({audio:true, video: {mediaSource: 'monitor'}});
    }
    displayMedia
        .then(getDisplayMediaSuccess)
        .catch(getDisplayMediaError);
}


function getUserMediaSuccess(stream) {
    localStream.user  = stream;
    // getMediaSuccess();
    localVideoSmall.srcObject = stream;
    return navigator.mediaDevices.enumerateDevices();
}


function getDisplayMediaSuccess(stream) {
    localStream.display  = stream;
    // getMediaSuccess();
    // centerVideoBig.srcObject = stream;
}


/**
 * WebRTC 开启成功
 * 绑定自己的音视频到video标签
 * @param stream
 * @returns {Promise<MediaDeviceInfo[]>}
 */
function getMediaSuccess(){
    if(isDisplayMedia){
        // document.getElementById('displayMediaButton').textContent = '共享视频';
    } else {
        // document.getElementById('displayMediaButton').textContent = '共享屏幕';
    }
}


/**
 * 获取userMedia错误
 * @param e
 */
function getUserMediaError(e){
    console.log('getUserMediaError');
    console.log(e);
    alert('请确定您的电脑是否有摄像头!!!');
}


function getDisplayMediaError(e) {
    console.log('getDisplayMediaError');
    console.log(e);
    isDisplayMedia = !isDisplayMedia;
}


// 切换摄像头 麦克风
function gotDevices(deviceInfos) {}



/**
 * 创建 远程连接的video标签
 * video标签的id就是用户的id, 方便对应查找
 * @param userId 远程用户的id
 */
function createRemoteVideoElement(userId) {
    if(!document.getElementById(userId)) {
        if(userId === roomInfo.owner && localUserId !== roomInfo.owner){
            if($('video.imageStyle').length = 0){
                $('.meeting-r-center').append(`<video class="allVideo videoStyle" id="${userId}" data-id="${userId}" playsinline autoplay></video>`);
            }else{
                $('body').append(`
                    <video class="allVideo" id="${userId}" data-id="${userId}" playsinline autoplay style="display: none;"></video>
                `);
            }
        }else{
            $('body').append(`
                <video class="allVideo" id="${userId}" data-id="${userId}" playsinline autoplay style="display: none;"></video>
            `);
        }
    }
}



/**
 * 创建RTC远程连接
 * 如果是多人的话，在这里要创建一个新的连接
 * 新创建好的放到一个对象remotePeer中
 * key=userid, value=peerconnection
 * @param userId  远程用户的id
 */
function createPeerConnection(userId) {
    if(!remotePeer[userId]){
        // 每有一个人连接就创建一个video标签播放远程资源视频
        createRemoteVideoElement(userId);
        
        // 创建远程连接
        remotePeer[userId] = new RTCPeerConnection(pcConfig);
        
        // 监听远程连接的 icecandidate
        onIceCandidate(userId);
        
        // 监听 datachannel
        onDataChannel(userId);
        
        // 获取远程资源放到对应用户的video标签上播放
        onTrack(userId);
    }
    // 把本地的资源发送到远程
    addTrack(userId);
}


/**
 *  监听远程连接的 icecandidate
 * @param userId
 */
function onIceCandidate(userId) {
    remotePeer[userId].onicecandidate = (e)=>{
        if(e.candidate) {
            ws.send({
                action: 'webrtc',
                event: 'candidate',
                mine:{
                    id: localUserId
                },
                webrtc:{
                    id: userId
                },
                data: {
                    sdpMLineIndex:event.candidate.sdpMLineIndex,
                    sdpMid:event.candidate.sdpMid,
                    candidate: event.candidate.candidate
                }
            });
        }
    };
}


/**
 * 监听 音视频轨
 * @param userId
 */
function onTrack(userId) {
    // 获取远程资源放到对应用户的video标签上播放
    if( remotePeer[userId] === null || remotePeer[userId] === undefined) {
        return;
    }
    remotePeer[userId].ontrack = (e)=>{
        getRemoteStream(userId, e);
    };
}


/**
 * 获取远程资源绑定到本地video标签
 * @param userId
 * @param e
 */
function getRemoteStream(userId, e){
    document.getElementById(userId).srcObject = e.streams[0];
}


/**
 * 把本地资源添加到远程连接
 * 添加到RTCPeerConnection中的媒体轨（音频track/视频track）
 * @param userId
 */
function addTrack(userId) {
    //add all track into peer connection
    if(remotePeer[userId]){
        if(localStream.user){
            localStream.user.getTracks().forEach((track)=>{
                remotePeer[userId].addTrack(track, localStream.user);
            });
        } else if(localStream.display){
            localStream.display.getTracks().forEach((track)=>{
                remotePeer[userId].addTrack(track, localStream.display);
            });
        }
    }
}



/**
 * 把远程的 iceCandidate 添加到自己的候选者
 * @param userId
 * @param data
 */
function addIceCandidate(userId, data) {
    let candidate = new RTCIceCandidate({
        sdpMLineIndex: data.sdpMLineIndex,
        candidate: data.candidate
    });
    remotePeer[userId].addIceCandidate(candidate);
}


/**
 * 创建 offer 协商
 * @param userId
 * @param _offerOptions
 */
function createOffer(userId, _offerOptions = offerOptions) {
    remotePeer[userId].createOffer(_offerOptions)
        .then((offerDesc)=>{
            setLocalOffer(userId, offerDesc);
        })
        .catch(handleOfferError);
}

function handleOfferError(err){
    console.error('Failed to create offer:', err);
}


function setLocalOffer(userId, offerDesc){
    setLocalDesc(userId, offerDesc);
    
    //send offer sdp;
    ws.send({
        action: 'webrtc',
        event: 'offer',
        mine:{
            id: localUserId
        },
        webrtc:{
            id: userId
        },
        data: offerDesc
    });
}


/**
 * 设置本地协商描述
 * @param userId
 * @param desc
 */
function setLocalDesc(userId, desc) {
    try {
        remotePeer[userId].setLocalDescription(desc);
        onSetSessionDescriptionSuccess();
    } catch (e) {
        onSetSessionDescriptionError(e);
    }
}


/**
 * 设置远程协商描述
 * @param userId
 * @param desc
 */
function setRemoteDesc(userId, desc) {
    try {
        remotePeer[userId].setRemoteDescription(new RTCSessionDescription(desc));
        onSetSessionDescriptionSuccess();
    } catch (e) {
        onSetSessionDescriptionError(e);
    }
    
}

function onSetSessionDescriptionSuccess() {
    // console.log('Set session description success.');
}

function onSetSessionDescriptionError(error) {
    console.log(`Failed to set session description: ${error.toString()}`);
}


/**
 * 创建 answer 协商
 * @param userId
 */
function createAnswer(userId) {
    remotePeer[userId].createAnswer()
        .then((answerDesc)=>{
            setLocalAnswer(userId, answerDesc);
        })
        .catch(handleAnswerError);
}


function handleAnswerError(err){
    console.error('Failed to create answer:', err);
}

function setLocalAnswer(userId, answerDesc) {
    setLocalDesc(userId, answerDesc);
    //send answer sdp
    ws.send({
        action: 'webrtc',
        event: 'answer',
        mine:{
            id: localUserId
        },
        webrtc:{
            id: userId
        },
        data: answerDesc
    });
}


function cleanOneUser(userId) {
    if(remotePeer[userId]){
        // remotePeer[userId].close();
        remotePeer[userId] = null;
        remoteChannel[userId] = null;
        if(document.getElementById(userId)){
            document.getElementById(userId).srcObject = null;
        }
    }
}


// 视频静音
function muteUserAudio(enabled) {
    if(localStream.user){
        muteAudio(localStream.user, enabled);
    }
}


// 屏幕静音
function muteDisplayAudio(enabled) {
    if(localStream.display){
        muteAudio(localStream.display, enabled);
    }
}


/**
 * 静音
 * @returns {boolean}
 */
function muteAudio(stream, enabled = false) {
    
    let audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
        return false;
    }
    if(audioTracks[0].enabled !== enabled){
        let len = audioTracks.length;
        for (let i = 0; i < len; ++i) {
            audioTracks[i].enabled = enabled;
        }
    }
    return audioTracks[0].enabled;
}


// 黑屏
function muteUserVideo(enabled) {
    if(localStream.user){
        muteVideo(localStream.user, enabled);
    }
}


// 共享屏幕黑屏
function muteDisplayVideo(enabled) {
    if(localStream.display){
        muteVideo(localStream.display, enabled);
    }
}


/**
 * 视频源黑屏
 * @param stream
 * @param enabled
 * @returns {boolean}
 */
function muteVideo(stream, enabled = false) {
    let videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) {
        return false;
    }
    if(videoTracks[0].enabled !== enabled){
        let len = videoTracks.length;
        for (let i = 0; i < len; ++i) {
            videoTracks[i].enabled = enabled;
        }
    }
    return videoTracks[0].enabled;
}


function stopUserTrack() {
    stopTrack(localStream.user);
}

function stopDisplayTrack() {
    stopTrack(localStream.display);
}


/**
 * 停止资源流分发
 * @param stream
 */
function stopTrack(stream) {
    if(stream){
        stream.getTracks().forEach( (track) => {
            track.stop();
        });
    }
}



/**
 * 创建 dataChannel 传输通道
 * @param userId
 */
function createDataChannel(userId) {
    if(!remoteChannel[userId]){
        remoteChannel[userId] = remotePeer[userId].createDataChannel('chat', channelOptions);
        remoteChannel[userId].binaryType = 'arraybuffer';
        remoteChannel[userId].onopen = ()=>{
            onChannelState(userId);
        };
        remoteChannel[userId].onclose = ()=>{
            onChannelState(userId);
        };
        remoteChannel[userId].onerror = (error) =>{
            onChannelError(userId, error);
        };
        remoteChannel[userId].onmessage = onChannelMessage;
    }
}



/**
 * 监听dataChannel事件
 * @param userId
 */
function onDataChannel(userId) {
    remotePeer[userId].ondatachannel = (event)=>{
        if(!remoteChannel[userId]){
            remoteChannel[userId] = event.channel;
            remoteChannel[userId].binaryType = 'arraybuffer';
            remoteChannel[userId].onopen = () => {
                onChannelState(userId);
            };
            remoteChannel[userId].onclose = () => {
                onChannelState(userId);
            };
            remoteChannel[userId].onerror = (error) =>{
                onChannelError(userId, error);
            };
            remoteChannel[userId].onmessage = onChannelMessage;
        }
    };
}


/**
 * dataChannel发送数据
 * @param data
 * @param receiveId
 * @param dataType 数据类型 json或者string类型
 */
function sendChannelData(data, dataType = 'json', receiveId = '') {
    if(data){
        if(receiveId){
            if(dataType === 'json'){
                sendDataByJson(data, receiveId);
            } else {
                sendDataByString(data, receiveId)
            }
        } else {
            if(dataType === 'json'){
                for (let k in remoteChannel){
                    sendDataByJson(data, k);
                }
            } else {
                for (let k in remoteChannel){
                    sendDataByString(data, k);
                }
            }
        }
    }
}


function sendDataByJson(data, receiveId) {
    let jsonData = JSON.stringify({
        userId: localUserId,
        data:data,
    });
    onChannelSend(receiveId, jsonData);
}


function sendDataByString(data, receiveId) {
    onChannelSend(receiveId, data);
}


function onChannelSend(userId, data) {
    try {
        if(remoteChannel[userId].readyState || remoteChannel[userId].readyState === 'open'){
            remoteChannel[userId].send(data);
        }
    } catch (e) {
    
    }
}


/**
 * 监听dataChannel状态变化
 * @param userId
 */
function onChannelState(userId) {
    if(remoteChannel[userId]){
        const readyState = remoteChannel[userId].readyState;
        console.log('remoteChannel state');
        console.log(readyState);
        if (readyState === 'open') {
            // document.querySelector('#Send').disabled = false;
            // document.querySelector('#sendValue').focus();
            // document.querySelector('#sendButton').disabled = false;
        } else {
            document.querySelector('#Send').disabled = true;
            // document.querySelector('#sendButton').disabled = true;
        }
    }
}


/**
 * 监听dataChannel错误
 * @param userId
 * @param error
 */
function onChannelError(userId, error) {
    document.querySelector('#sendValue').disabled = true;
    document.querySelector('#sendButton').disabled = true;
    console.log('channel error');
    console.log(error);
}


function receiveContent(userName, userId, message) {
    var str = `
        <li>
        <span>${userName}：</span>
        <p data-id="${userId}">
        ${message}
        </p >
        </li>
    `;
    $('#chatList').append(str);
}


var fileInfo = {};
function onChannelMessage(event) {
    try {
        let message = JSON.parse(event.data);
        if(message.data.hasFile){
            fileInfo = {};
            fileInfo = {
                userId: message.userId,
                fileId: message.data.fileId,
                fileName: message.data.fileName,
                fileSize: message.data.fileSize,
                fileType: message.data.fileType,
                chunkSize:0,
                buffer: []
            };
        } else {
            receiveContent(message.data.userName, message.data.userId, message.data.content);
        }
    } catch (e) {
        console.log(e);
        // 文件数据
        receiveChannelFile( event.data );
    }
}



/**
 * 接收dataChannel中的file信息
 * @param fileBuffer
 */
function receiveChannelFile(fileBuffer) {
    fileInfo.buffer.push(fileBuffer);
    fileInfo.chunkSize += fileBuffer.byteLength;
    if (fileInfo.chunkSize >= fileInfo.fileSize) {
        let received = new Blob(fileInfo.buffer, {type: fileInfo.fileType});
        let href = URL.createObjectURL(received);
        console.log(href);
        let ext = getFileExt(fileInfo.fileName);
        let bbb = $('.meeting-r-center video.videoStyle');
        if(bbb.length > 0){
            bbb.removeClass('videoStyle');
            $('.onePeople-videoBox').append(bbb);
        }
        if(['pdf'].includes(ext)){
            let str = `
                <object data="${href}" class="imageStyle"></object>
            `;
            $('.meeting-r-center').append(str);
            
        } else if(['png', 'jpeg', 'jpg', 'gif'].includes(ext)){
            let str = `
                <img src="${href}" class="imageStyle" />
            `;
            $('.meeting-r-center').append(str);
        }
        fileInfo = {};
    }
}



function sendFiles(file, offsetChange = () => {}, readEnd = () => {}, chunkSize = 10240) {
    let fileReader = new FileReader();
    let offset = 0;
    fileReader.addEventListener('error', error => console.error('Error reading file:', error));
    fileReader.addEventListener('abort', event => console.log('File reading aborted:', event));
    fileReader.addEventListener('load', e => {
        sendChannelData(e.target.result, 'string');
        offset += e.target.result.byteLength;
        offsetChange(e.target.result);
        if (offset < file.size) {
            setTimeout(function () {
                readSlice(offset);
            }, 100);
        } else {
            readEnd(file);
        }
    });
    const readSlice = o => {
        const slice = file.slice(offset, o + chunkSize);
        fileReader.readAsArrayBuffer(slice);
    };
    readSlice(0);
}