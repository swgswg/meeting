var remotePeer = {};


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


function createRemoteVideoElement(userId) {
    if (!document.getElementById(userId)) {
        if(userId == roomInfo.owner && localUserId != roomInfo.owner){
            $('.meeting-r-center').append(`<video class="allVideo videoStyle" id="${userId}" data-id="${userId}" playsinline autoplay></video>`);
        }else{
            $('body').append(`
                <video class="allVideo" id="${userId}" data-id="${userId}" playsinline autoplay></video>
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
                    label:event.candidate.sdpMLineIndex,
                    id:event.candidate.sdpMid,
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
        alert('userId is null or undefined!');
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
        if(localUserStream){
            localUserStream.getTracks().forEach((track)=>{
                remotePeer[userId].addTrack(track, localUserStream);
            });
        }else if(localDisplayStream){
            localDisplayStream.getTracks().forEach((track)=>{
                remotePeer[userId].addTrack(track, localDisplayStream);
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
        sdpMLineIndex: data.label,
        candidate: data.candidate
    });
    remotePeer[userId].addIceCandidate(candidate);
}


/**
 * 创建 offer 协商
 * @param userId
 * @param _offerOptions
 */
function createOffer(userId, _offerOptions = offerConfig) {
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
        remotePeer[userId].close();
        remotePeer[userId] = null;
        remoteChannel[userId] = null;
        document.getElementById(userId + '_user').srcObject = null;
        document.getElementById(userId+ '_display').srcObject = null;
    }
}