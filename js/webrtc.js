// 清除某个人的信息
function cleanOneUser(userId) {
    if (remotePeer[userId]) {
        remotePeer[userId].close();
        remotePeer[userId] = null;
        remoteChannel[userId] = null;
        if(document.getElementById(userId)){
            document.getElementById(userId).srcObject = null;
        }
    }
}


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



function createUserPeerConnection(userId, roomId) {
    if(!remotePeer[userId]){
        // 每有一个人连接就创建一个video标签播放远程资源视频
        createRemoteVideoElement(userId);
        
        // 创建远程连接
        remotePeer[userId] = peerConnection();
        
        createPeerConnection(remotePeer[userId], null, (e)=>{
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
                    sdpMLineIndex: e.sdpMLineIndex,
                    id: e.sdpMid,
                    candidate: e.candidate
                }
            });
        }, (e)=>{
        
        
        }, () => {
            if (remotePeer[userId]) {
                if (localUserStream) {
                    localUserStream.getTracks().forEach((track) => {
                        remotePeer[userId].addTrack(track, localUserStream);
                    });
                } else if (localDisplayStream) {
                    localDisplayStream.getTracks().forEach((track) => {
                        remotePeer[userId].addTrack(track, localDisplayStream);
                    });
                }
            }
        });
        
        onDataChannel(remotePeer[userId], userId);
    }
}


function createUserOffer(userId) {
    createOffer(remotePeer[userId], (offerDesc)=>{
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
    }, (err)=>{
        console.error('Failed to create offer:', err);
    });
}


function createUserAnswer(userId) {
    createAnswer(remotePeer[userId], (answerDesc)=>{
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
    }, (err)=>{
        console.error('Failed to create answer:', err);
    })
}


function setUserRemoteDesc(userId, desc) {
    setRemoteDesc(remotePeer[userId], desc, (error)=>{
        console.log(`Failed to set session description: ${error.toString()}`);
    });
}


function createUserDataChannel(userId, roomId){
    createDataChannel(remotePeer[userId] ,userId, roomId);
}


function addUserIceCandidate(userId, data) {
    let candidate = new RTCIceCandidate({
        sdpMLineIndex: data.sdpMLineIndex,
        candidate: data.candidate
    });
    remotePeer[userId].addIceCandidate(candidate);
}