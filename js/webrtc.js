var remotePeer = {};

var remoteChannel = {};

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
    id: 0,
    ordered: true,    // 指示数据通道是否保证按顺序传递消息
    maxRetransmits:5, // 消息失败的重传次数
};

function createRemoteVideoElement(userId, roomInfo) {
    if (!document.getElementById(userId)) {
        if(userId === roomInfo.owner && localUserId !== roomInfo.owner){
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
function createPeerConnection(userId, roomInfo) {
    if(!remotePeer[userId]){
        // 每有一个人连接就创建一个video标签播放远程资源视频
        createRemoteVideoElement(userId, roomInfo);
        
        // 创建远程连接
        remotePeer[userId] = new RTCPeerConnection(pcConfig);
        
        // 监听远程连接的 icecandidate
        onIceCandidate(userId);
        
        // 监听 datachannel
        onDataChannel(remotePeer[userId], userId);
        
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
        if(document.getElementById(userId)){
            document.getElementById(userId).srcObject = null;
        }
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
            // document.querySelector('#sendValue').disabled = false;
            // document.querySelector('#sendValue').focus();
            // document.querySelector('#sendButton').disabled = false;
        } else {
            // document.querySelector('#sendValue').disabled = true;
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


/**
 * 监听dataChannel接收消息
 * @param event
 */
var fileInfo = {};
function onChannelMessage(event) {
    try {
        let message = JSON.parse(event.data);
        if(message.data.hasFile){
            createReceiveProgress(message.userId, message.data.fileId);
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
            document.getElementById(`progress_${fileInfo.fileId}`).max = message.data.fileSize;
        } else {
            // createChatTextLeft(message.userId, message.data.content);
            receiveContent(message.userName, message.userId, message.data.content)
        }
    } catch (e) {
        // 文件数据
        receiveChannelFile( event.data );
    }
}


function onChannelSend(userId, data) {
    try {
        if(remoteChannel[userId].readyState || remoteChannel[userId].readyState === 'open'){
            remoteChannel[userId].send(data);
        }
    } catch (e) {
    
    }
}


// 自己发送文件次数
let sendProgressNumber = 0;
function createSendProgress(fileName) {
    ++sendProgressNumber;
    let progress = `
        <div class="progress">
            <div class="label">发送: ${fileName}</div>
            <progress id="progress_${sendProgressNumber}" max="0" value="0"></progress>
        </div>
    `;
    $('#fileProgress').append(progress);
}


/**
 * 创建接收文件的进度条
 * @param userId
 * @param fileId
 */
function createReceiveProgress(userId, fileId) {
    if(document.getElementById(`progress_${fileId}`)){
        return;
    }
    let progress = `
        <div class="progress">
            <div class="label">接收 ${userId}:</div>
            <progress id="progress_${fileId}" max="0" value="0"></progress>
        </div>
    `;
    $('#fileProgress').append(progress);
}



/**
 * 接收dataChannel中的file信息
 * @param fileBuffer
 */
function receiveChannelFile(fileBuffer) {
    fileInfo.buffer.push(fileBuffer);
    fileInfo.chunkSize += fileBuffer.byteLength;
    document.getElementById(`progress_${fileInfo.fileId}`).value = fileInfo.chunkSize;
    if (fileInfo.chunkSize === fileInfo.fileSize) {
        let received = new Blob(fileInfo.buffer);
        let href = URL.createObjectURL(received);
        createDownloadAnchor(fileInfo.userId, {
            fileId: fileInfo.fileId,
            fileName: fileInfo.fileName,
            fileSize: fileInfo.fileSize,
            href: href
        });
        let ext = getFileExt(fileInfo.fileName);
        if(['pdf'].includes(ext)){
            $('#pdf').addClass('pdf-show');
            $('#pdf-object').attr('data', href);
            
        } else if(['png', 'jpeg', 'jpg', 'gif'].includes(ext)){
            $('#pdf').addClass('pdf-show');
            $('#receive-img').attr('src', href);
        }
        fileInfo = {};
    }
}


/**
 * 创建a标签下载文件
 * @param userId
 * @param fileInfo
 */
function createDownloadAnchor(userId, fileInfo) {
    $('#chatText').append(`
        <div class="chatTextBox chatTextLeft">
            <div class="chatTextLeftID">${userId}: </div>
            <div class="chatTextLeftContent">
                <a id="fileId_${fileInfo.fileId}"></a>
            </div>
        </div>
    `);
    let downloadAnchor = document.getElementById(`fileId_${fileInfo.fileId}`);
    downloadAnchor.href = fileInfo.href;
    downloadAnchor.download = fileInfo.fileName;
    let size = bytesTo(fileInfo.fileSize);
    downloadAnchor.textContent = `点击下载 '${fileInfo.fileName}' (${size})`;
}


function sendFiles(file, offsetChange = () => {}, readEnd = () => {}, chunkSize = 1200) {
    let fileReader = new FileReader();
    let offset = 0;
    fileReader.addEventListener('error', error => console.error('Error reading file:', error));
    fileReader.addEventListener('abort', event => console.log('File reading aborted:', event));
    fileReader.addEventListener('load', e => {
        sendChannelData(e.target.result, 'string');
        offset += e.target.result.byteLength;
        // sendProgress.value = offset;
        offsetChange(offset);
        if (offset < file.size) {
            readSlice(offset);
        } else {
            // createChatTextRight('发送文件:' + file.name);
            readEnd(file);
        }
    });
    const readSlice = o => {
        const slice = file.slice(offset, o + chunkSize);
        fileReader.readAsArrayBuffer(slice);
    };
    readSlice(0);
}
