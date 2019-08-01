// pc配置项
var pcConfig = {
    rtcpMuxPolicy: 'require',
    bundlePolicy: 'max-bundle',
    iceServers: [
        {
            'urls': 'turn:39.105.118.224:3478',
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
        // {
        //     'urls': 'stun:stun.voxgratia.org',
        // },
        // {
        //     'urls': 'stun:stun.xten.com',
        // },
    ]
};

// createOffer配置项
var offerConfig = {
    offerToRecieveAudio: 1,
    offerToRecieveVideo: 1
};


var channelOptions = {
    negotiatend: true,  // 是否双方通信
    ordered: true,    // 指示数据通道是否保证按顺序传递消息
    maxRetransmits:5, // 消息失败的重传次数
};

var remoteChannel = {};


function peerConnection(){
    // 创建远程连接
    return (new RTCPeerConnection(pcConfig));
}

function createPeerConnection(pc, stream, onIceCandidateCallback, onTrackCallback, addTrackCallback = null){
    if(pc){
        // 监听远程连接的 icecandidate
        pc.onicecandidate = (e)=>{
            if(e.candidate) {
                // 发送候选者
                onIceCandidateCallback(e.candidate);
            }
        };

        // 获取远程资源放到对应用户的video标签上播放
        onTrack(pc, onTrackCallback);
    
    }
    // 把本地的资源发送到远程
    addTrack(pc, stream, addTrackCallback);
}


/**
 * 获取远程资源放到对应用户的video标签上播放
 * @param pc
 * @param onTrackCallback
 */
function onTrack(pc, onTrackCallback) {
    pc.ontrack = (e)=>{
        onTrackCallback(e);
    };
}


/**
 * 把本地资源添加到远程连接
 * 添加到RTCPeerConnection中的媒体轨（音频track/视频track）
 * @param pc
 * @param stream
 * @param addTrackCallback
 */
function addTrack(pc, stream, addTrackCallback) {
    //add all track into peer connection
    if(stream){
        stream.getTracks().forEach((track)=>{
            pc.addTrack(track, stream);
        });
    } else {
        addTrackCallback();
    }
    
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
 * 把远程的 iceCandidate 添加到自己的候选者
 * @param pc
 * @param data
 */
function addIceCandidate(pc, data) {
    let candidate = new RTCIceCandidate({
        sdpMLineIndex: data.sdpMLineIndex,
        candidate: data.candidate
    });
    pc.addIceCandidate(candidate);
}



/**
 * 创建 offer 协商
 * @param pc
 * @param setOfferSuccess
 * @param setOfferError
 */
function createOffer(pc, setOfferSuccess, setOfferError) {
    pc.createOffer(offerConfig)
        .then((offerDesc)=>{
            pc.setLocalDescription(offerDesc);
            setOfferSuccess(offerDesc);
        })
        .catch(setOfferError);
}



/**
 * 创建 answer 协商
 * @param pc
 * @param setAnswerSuccess
 * @param setAnswerError
 */
function createAnswer(pc, setAnswerSuccess, setAnswerError) {
    pc.createAnswer()
        .then((ad)=>{
            pc.setLocalDescription(ad);
            setAnswerSuccess(ad);
        })
        .catch(setAnswerError);
}


/**
 * 设置远程协商描述
 * @param pc
 * @param desc
 * @param setDescriptionError
 */
function setRemoteDesc(pc, desc, setDescriptionError) {
    try {
        pc.setRemoteDescription(new RTCSessionDescription(desc));
    } catch (e) {
        setDescriptionError(e);
    }
}




/**
 * 静音
 * @param stream
 * @param mute
 * @returns {boolean}
 */
function muteAudio(stream, mute = false) {
    if(stream){
        let audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
            return false;
        }
        for (let i = 0; i < audioTracks.length; ++i) {
            audioTracks[i].enabled = false;
        }
        return audioTracks[0].enabled;
    } else {
        return false;
    }
    
}


/**
 * 黑屏
 * @param stream
 * @param mute
 * @returns {boolean}
 */
function muteVideo(stream, mute = false) {
    let videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) {
        return false;
    }
    let len = videoTracks.length;
    for (let i = 0; i < len; ++i) {
        videoTracks[i].enabled = mute;
    }
    return videoTracks[0].enabled;
}