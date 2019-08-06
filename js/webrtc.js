// 自己的userId
var localUserId;
// 房间号
var roomId = 0;
var roomInfo = {};

// 是否共享屏幕 true是/false否
var isDisplayMedia = false;

// 显示自己的video标签
var localVideoSmall = document.getElementById('localVideoSmall');
// var width = localVideoSmall.offsetWidth;
// var height = localVideoSmall.offsetHeight;
var width = 500;
var height = 375;


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
 * @param _roomInfo
 * @param useUserStream
 * @param useDisplayStream
 * @param options
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
            stopDisplayTrack();
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
        // echoCancellation: true,
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
    let constraints  = setVideoConstraints(options);
    if(navigator.mediaDevices.getUserMedia){
        navigator.mediaDevices
            .getUserMedia(constraints)
            .then(getUserMediaSuccess)
            .catch(getUserMediaError);
        
    } else {
        alert('您的浏览器不支持[视频], 请更换浏览器!!!');
    }
}


/**
 * 获取共享桌面
 */
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


var autoEnter = true;
function getUserMediaSuccess(stream) {
    localStream.user  = stream;
    localVideoSmall.srcObject = stream;
    ws.send({
        action: 'webrtc',
        event: 'joinRoom',
        mine: {
            id: localUserId
        },
        room: {
            id: roomInfo.roomId,
            pwd: roomInfo.psw,
        },
    });
    autoEnter = false;
    $('#shareDesktopBtn').attr('title', '开启桌面共享').children('.icon-zhuomianshezhi').removeClass('icon-zhuomianshezhi').addClass('icon-yunzhuomian');
}


function getDisplayMediaSuccess(stream) {
    if(stream){
        $('#shareDesktopBtn').attr('title', '停止演示').children('.icon-yunzhuomian').removeClass('icon-yunzhuomian').addClass('icon-zhuomianshezhi');
        localStream.display  = stream;
        localVideoSmall.srcObject = stream;
        replaceTrack(stream);
        ws.send({
            action: 'webrtc',
            event: 'maxVideo',
            mine: {
                id: localUserId
            },
            room: {
                id: roomId,
            },
            maxVideoId: localUserId
        });
    }
}




/**
 * 获取userMedia错误
 * @param e
 */
function getUserMediaError(e){
    // console.log('getUserMediaError');
    // console.log(e);
    alert('请确定您的电脑是否有摄像头!!!');
}


function getDisplayMediaError(e) {
    // console.log('getDisplayMediaError');
    // console.log(e);
    isDisplayMedia = !isDisplayMedia;
    $('#shareDesktopBtn i.redColor').removeClass('redColor');
}



/**
 * 创建 远程连接的video标签
 * video标签的id就是用户的id, 方便对应查找
 * @param userId 远程用户的id
 */
function createRemoteVideoElement(userId) {
    if(!document.getElementById(userId)) {
        if(userId === roomInfo.owner && localUserId !== roomInfo.owner){
            if($('img.imageStyle').length == 0 && $('object.videoStyle').length == 0 && $('video.videoStyle').length == 0 && $('#waiting').length == 0) {
                $('.meeting-r-center').append(`<video class="allVideo videoStyle" id="${userId}" data-id="${userId}" playsinline autoplay></video>`);
            }else{
                $('body').append(`
                    <video class="allVideo" id="${userId}" data-id="${userId}" playsinline autoplay style="display: none;"></video>
                `);
            }
        }else{
            if($('img.imageStyle').length == 0 && $('object.videoStyle').length == 0 && $('video.videoStyle').length == 0 && $('#waiting').length == 0){
                $('.meeting-r-center').append(`<video class="allVideo videoStyle" id="${userId}" data-id="${userId}" playsinline autoplay></video>`);
            }else{
                $('body').append(`
                    <video class="allVideo" id="${userId}" data-id="${userId}" playsinline autoplay style="display: none;"></video>
                `);
            }
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
    if(document.getElementById(userId)){
        document.getElementById(userId).srcObject = null;
        document.getElementById(userId).srcObject = e.streams[0];
    }
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
    if(remotePeer[userId]){
        remotePeer[userId].addIceCandidate(candidate);
    }
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


/**
 * 用户退出 清除信息
 * @param userId
 */
function cleanOneUser(userId) {
    if(remotePeer[userId]){
        remotePeer[userId].ontrack = null;
        remotePeer[userId].onremovetrack = null;
        remotePeer[userId].onremovestream = null;
        remotePeer[userId].onicecandidate = null;
        remotePeer[userId].oniceconnectionstatechange = null;
        remotePeer[userId].onsignalingstatechange = null;
        remotePeer[userId].onicegatheringstatechange = null;
        remotePeer[userId].onnegotiationneeded = null;
        remotePeer[userId].close();
        remotePeer[userId] = null;
        remoteChannel[userId] = null;
        if(document.getElementById(userId)){
            let remoteVideo = document.getElementById(userId);
            if (remoteVideo.srcObject) {
                remoteVideo.srcObject.getTracks().forEach(track => track.stop());
            }
            remoteVideo.removeAttribute("src");
            remoteVideo.removeAttribute("srcObject");
            $(`#${userId}`).remove();
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
 * 获取远程媒体
 */
function getReceivers(pc, cb) {
    
    // getRemoteStreams接口也可以获取远程媒体源, 但是此接口即将废弃, 不建议使用
    // let remoteStreams = pc.getRemoteStreams();
    // document.getElementById(`${k}_new`).srcObject = remoteStreams;
    
    // 推荐使用getReceivers接口
    if(pc && pc.getReceivers){
        let stream = new MediaStream();
        pc.getReceivers().forEach(function(receiver) {
            stream.addTrack(receiver.track);
        });
        // document.getElementById(`${k}_new`).srcObject = stream;
        cb(stream);
    }
}


/**
 * 获取本地媒体
 */
function getSenders(pc) {
    if(pc && pc.getSenders){
        let stream = new MediaStream();
        pc.getSenders().forEach(function(sender) {
            stream.addTrack(sender.track);
        });
        // document.getElementById(`${k}_new`).srcObject = stream;
    }
}


/**
 * 替换媒体源
 * 如: 把视频源替换成共享桌面源
 */
function replaceTrack(stream) {
    for (let k in remotePeer) {
        remotePeer[k].getSenders().forEach(function(sender) {
            if (sender.track.kind === 'video' ) {
                sender.replaceTrack(stream.getTracks()[0]);
            }
        });
    }
}



/**
 * 创建 dataChannel 传输通道(类似websocket)
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
 * 监听dataChannel事件(类似websocket)
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


/**
 * 通过json格式发送数据
 * @param data 发送的数据(json格式)
 * @param receiveId  接收人id(不传发给所有人)
 */
function sendDataByJson(data, receiveId) {
    let jsonData = JSON.stringify({
        userId: localUserId,
        data:data,
    });
    onChannelSend(receiveId, jsonData);
}


/**
 * 通过字符串格式发送数据
 * @param data
 * @param receiveId
 */
function sendDataByString(data, receiveId) {
    onChannelSend(receiveId, data);
}


/**
 * dataChannel发送数据(类似ws)
 * @param userId
 * @param data
 */
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
        if (readyState === 'open') {
        
        } else {
            document.querySelector('#Send').disabled = true;
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





// 接收文件信息
var fileInfo = {};
var fileUserId = '';

/**
 * dataChannel 接收信息
 * @param event
 */
function onChannelMessage(event) {
    try {
        let message = JSON.parse(event.data);
        if(message.data.hasFile){
            fileInfo[message.data.fileId] = {
                userId: message.userId,
                fileUserName: message.data.fileUserName,
                fileId: message.data.fileId,
                fileName: message.data.fileName,
                fileSize: message.data.fileSize,
                fileType: message.data.fileType,
                chunkSize:0,
                buffer: []
            };
            fileUserId = message.data.fileId;
            createProcess(message.userId, message.data.fileId);
        } else {
            receiveContent(message.data.userName, message.userId, message.data.content);
        }
    } catch (e) {
        // 文件数据
        receiveChannelFile( event.data );
    }
}

function receiveContent(userName, userId, message) {
    let str = `
        <li>
            <span>${userName}：</span>
            <p data-id="${userId}">
                ${message}
            </p>
        </li>
    `;
    appendChatList(str);
}


/**
 * 接收dataChannel中的file信息
 * @param fileBuffer
 */
function receiveChannelFile(fileBuffer) {
    fileInfo[fileUserId].buffer.push(fileBuffer);
    fileInfo[fileUserId].chunkSize += fileBuffer.byteLength;
    changeProcessValue(fileUserId, fileInfo[fileUserId].chunkSize);
    if (fileInfo[fileUserId].chunkSize >= fileInfo[fileUserId].fileSize) {
        arrayBufferToBlob();
        fileUserId = '';
    }
}


/**
 * 把arrayBuffer数据格式转为blob
 */
function arrayBufferToBlob() {
    let received = new Blob(fileInfo[fileUserId].buffer, {type: fileInfo[fileUserId].fileType});
    let href = URL.createObjectURL(received);
    fileInfo[fileUserId].href = href;
    delete(fileInfo[fileUserId].buffer);
    delete(fileInfo[fileUserId].chunkSize);
    
    $('#videoDialogPopup').show("slow");
    if ($('img.imageStyle').length > 0) {
        $('.videoDialog div.videoDialog-container').empty()
    }
    if ($('object.videoStyle').length > 0) {
        $('.videoDialog div.videoDialog-container').empty()
    }
    showFile(fileUserId, href);
}


function showFile(fileUserId, href) {
    let ext = getFileExt(fileInfo[fileUserId].fileName);
    if(['pdf'].includes(ext)){
        createPdf(href);
        
    } else if(['png', 'jpeg', 'jpg', 'gif'].includes(ext)){
        createImage(href);
    }
}


// 进度条
function createProcess(userId, fileId) {
    if(!document.getElementById(fileId)){
        let str = `
            <li>
                <span>${localUserId === userId ? '我' : fileInfo[fileId].fileUserName}：</span>
                <p class="showFile" data-id="${userId}">
                    <span class="f10">${fileInfo[fileId].fileName}</span>
                    <progress id="${fileId}" max="${fileInfo[fileId].fileSize}" value="0"></progress>
                </progress>
            </li>
        `;
        appendChatList(str);
    }
}


function changeProcessValue(fileId, value) {
    $(`#${fileId}`).attr('value', value);
}


function appendChatList(str) {
    $('#chatList').append(str);
    $(".meeting-chatList").scrollTop($(".meeting-chatList")[0].scrollHeight);
}


function createPdf(href) {
    $('.videoDialog div.videoDialog-container').empty();
    let str = `
        <object data="${href}" class="videoStyle"></object>
    `;
    $('.videoDialog div.videoDialog-container').append(str);
    $('#videoDialogPopup').show("slow");
}

function createImage(href) {
    $('.videoDialog div.videoDialog-container').empty();
    let str = `
            <img src="${href}" class="imageStyle" />
        `;
    $('.videoDialog div.videoDialog-container').append(str);
    $('#videoDialogPopup').show("slow");
}


/**
 * 发送文件
 * @param file 文件信息
 * @param offsetChange 每次发送块执行的回调方法
 * @param readEnd      发送完成执行的回调方法
 * @param chunkSize    每次发送块的大小/b
 */
var localSendFileId = '';
function sendFiles(file, offsetChange = () => {}, readEnd = () => {}, chunkSize = 10240) {
    let fileReader = new FileReader();
    let offset = 0;
    fileReader.addEventListener('error', error => console.error('Error reading file:', error));
    fileReader.addEventListener('abort', event => console.log('File reading aborted:', event));
    fileReader.addEventListener('load', e => {
        sendChannelData(e.target.result, 'string');
        offset += e.target.result.byteLength;
        changeProcessValue(localSendFileId, offset);
        offsetChange(e.target.result);
        if (offset < file.size) {
            setTimeout(function () {
                readSlice(offset);
            }, 100);
        } else {
            readEnd(file);
            localSendFileId = '';
        }
    });
    const readSlice = o => {
        const slice = file.slice(offset, o + chunkSize);
        fileReader.readAsArrayBuffer(slice);
    };
    readSlice(0);
    
    fileInfo[localSendFileId] = {
        userId: localUserId,
        fileId: localSendFileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
    };
    createProcess(localUserId, localSendFileId);
}


// 获取音视频流信息
var streamInfo = [];
var prevLocalInfo = {};
var prevRemoteInfo = {};
function streamState() {
    streamInfo = [];
    for (let k in remotePeer) {
        if(remotePeer[k]){
        
            // 获取自己音视频信息
            if(remotePeer[k].getSenders){
                remotePeer[k].getSenders().forEach(function (sender) {
                    if(sender.track.kind === 'video'){
                        let nowLocalInfo = {source: '本地', userId: k};
                        sender.getStats().then( (res)=>{
                            if(!prevLocalInfo[k] ){
                                prevLocalInfo[k] = {};
                            }
                            res.forEach( (report)=>{
                                if( report.type === 'codec' ){
                                    nowLocalInfo.mediaType = report.mimeType;
                        
                                } else if( report.type === 'track' ){
                                    nowLocalInfo.width = report.frameWidth;
                                    nowLocalInfo.height = report.frameHeight;
                        
                                    if( !prevLocalInfo[k].framesSent ){
                                        prevLocalInfo[k].framesSent = report.framesSent;
                                        nowLocalInfo.framesSent = 30;
                            
                                    } else {
                                        nowLocalInfo.framesSent = report.framesSent - prevLocalInfo[k].framesSent;
                                        prevLocalInfo[k].framesSent = report.framesSent;
                                    }
                        
                                } else if(report.type === 'outbound-rtp'){
                                    nowLocalInfo.packetsLost = 0;
                        
                                } else if(report.type === 'transport'){
                                    if( !prevLocalInfo[k].bytesSent ){
                                        prevLocalInfo[k].bytesSent = report.bytesSent;
                                        prevLocalInfo[k].timestamp = report.timestamp;
                                        nowLocalInfo.bitrate = 0;
                            
                                    } else {
                                        nowLocalInfo.bitrate = 8 * (report.bytesSent - prevLocalInfo[k].bytesSent) / (report.timestamp - prevLocalInfo[k].timestamp);
                                        prevLocalInfo[k].bytesSent = report.bytesSent;
                                    }
                                }
                            });
                        });
                        streamInfo.push(nowLocalInfo);
                    }
                });
            }
            
            // 获取接收的音视频信息
            if(remotePeer[k].getReceivers){
                remotePeer[k].getReceivers().forEach(function (receiver) {
                    if(receiver.track.kind === 'video'){
                        let nowRemoteInfo = {'source': '远程', userId: k};
                        receiver.getStats().then( (res)=>{
                            if(!prevRemoteInfo[k] ){
                                prevRemoteInfo[k] = {};
                            }
                            res.forEach( (report)=>{
                                if(report.type === 'codec' ){
                                    nowRemoteInfo.mediaType = report.mimeType;
                        
                                }else if( (report.type === 'track') && (report.kind === 'video') ){
                                    nowRemoteInfo.width = report.frameWidth;
                                    nowRemoteInfo.height = report.frameHeight;
                        
                                    if( !prevRemoteInfo[k].framesReceived ){
                                        prevRemoteInfo[k].framesSent = report.framesReceived;
                                        nowRemoteInfo.framesSent = 30;
                                    } else {
                                        nowRemoteInfo.framesSent = report.framesReceived - prevRemoteInfo[k].framesSent;
                                        prevRemoteInfo[k].framesSent = report.framesReceived;
                                    }
                        
                                } else if(report.type === 'inbound-rtp'){
                                    nowRemoteInfo.packetsLost = report.packetsLost / report.packetsReceived;
                        
                                } else if(report.type === 'transport'){
                                    if( !prevRemoteInfo[k].bytesSent ){
                                        prevRemoteInfo[k].bytesSent = report.bytesSent;
                                        prevRemoteInfo[k].timestamp = report.timestamp;
                                        nowRemoteInfo.bitrate = 0;
                            
                                    } else {
                                        nowRemoteInfo.bitrate = 8 * (report.bytesSent - prevRemoteInfo[k].bytesSent) / (report.timestamp - prevRemoteInfo[k].timestamp);
                                        prevRemoteInfo[k].bytesSent = report.bytesSent;
                                    }
                                }
                            });
                        });
                        streamInfo.push(nowRemoteInfo);
                    }
                });
            }
        }
    }
}