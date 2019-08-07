function PeerConnect (myUserId, roomId) {
    if(!myUserId && roomId > 65535){
        return;
    }
    
    this.myUserId = myUserId
    this.roomId = roomId;
    
    
    // pc配置项
    this.pcConfig = {
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
    this.offerConfig = {
        offerToRecieveAudio: 1,
        offerToRecieveVideo: 1
    };
    
    // dataChannel配置项
    this.channelOptions = {
        negotiatend: true,  // 是否双方通信
        ordered: true,    // 指示数据通道是否保证按顺序传递消息
        maxRetransmits:5, // 消息失败的重传次数
        id: roomId
    };
    
    // 所有连接的 peerConnection 集合
    this.pc = {};
    
    // 所有连接的 dataChannel 集合
    this.dc = {};
    
    
    /**
     * 交换信令四部曲-1
     * b进入房间, a该做的事 发送offer
     * @param userId
     * @param stream
     */
    this.otherJoin = function (userId, stream) {
        this.createPeerConnection(userId, stream);
        this.createDataChannel(userId);
        this.createOffer(userId);
    };
    
    
    /**
     * 交换信令四部曲-2
     * b 收到 a 的offer信令, b 回应answer
     * @param userId
     * @param stream
     * @param offerDesc
     */
    this.offer = function (userId, stream, offerDesc) {
        this.createPeerConnection(userId, stream);
        this.setRemoteDesc(userId, offerDesc);
        this.createAnswer(userId);
    };
    
    
    /**
     * 交换信令四部曲-3
     * a 收到 b 的 answer
     * @param userId
     * @param answerDesc
     */
    this.answer = function (userId, answerDesc) {
        this.setRemoteDesc(userId, answerDesc);
    };
    
    
    /**
     * 交换信令四部曲-4
     * a 和 b 交换candidate信息
     * @param userId
     * @param sdpMLineIndex
     * @param candidate
     */
    this.candidate = function (userId, sdpMLineIndex, candidate) {
        this.addIceCandidate(userId, sdpMLineIndex, candidate);
    };
    
    
    /**
     * 创建pc
     * @param userId 每一个连接用户的唯一标志
     * @param stream 获取的媒体源
     */
    this.createPeerConnection = function (userId, stream) {
        if(!this.pc[userId]){
            // 创建pc之前做的事 比如:每有一个人连接就创建一个video标签播放远程资源视频
            this.beforePC(userId);
    
            // 创建远程连接
            this.pc[userId] = new RTCPeerConnection(this.pcConfig);
        
            // 监听远程连接的 icecandidate
            this.onIceCandidate(userId);
        
            // 监听 datachannel
            this.onDataChannel(userId);
        
            // 获取远程资源放到对应用户的video标签上播放
            this.onTrack(userId);
        }
        // 把本地的资源发送到远程
        this.addTrack(userId, stream);
    };
    
    /**
     *  监听远程连接的 icecandidate
     * @param userId
     */
    this.onIceCandidate = function(userId) {
        this.pc[userId].onicecandidate = (e)=>{
            if(e.candidate) {
                this.iceCandidateEvent(e.candidate);
                // ws.send({
                //     action: 'webrtc',
                //     event: 'candidate',
                //     mine:{
                //         id: this.myUserId
                //     },
                //     webrtc:{
                //         id: userId
                //     },
                //     data: {
                //         sdpMLineIndex:e.candidate.sdpMLineIndex,
                //         sdpMid:e.candidate.sdpMid,
                //         candidate: e.candidate.candidate
                //     }
                // });
            }
        };
    };
    
    
    /**
     * 监听 音视频轨
     * @param userId
     */
    this.onTrack = function(userId) {
        // 获取远程资源放到对应用户的video标签上播放
        if( this.pc[userId] === null || this.pc[userId] === undefined) {
            return;
        }
        
        this.pc[userId].ontrack = (e)=>{
            this.onTrackEvent(userId, e.streams[0]);
    
            // if(document.getElementById(userId)){
            //     document.getElementById(userId).srcObject = null;
            //     document.getElementById(userId).srcObject = e.streams[0];
            // }
        };
    };
    
    
    
    /**
     * 把本地资源添加到远程连接
     * 添加到RTCPeerConnection中的媒体轨（音频track/视频track）
     * @param userId
     * @param stream
     */
     this.addTrack = function(userId, stream = null) {
        //add all track into peer connection
        if(this.pc[userId]){
            if(stream){
                stream.getTracks().forEach((track)=>{
                    this.pc[userId].addTrack(track, stream);
                });
            }
        }
    };
    
    
    
    /**
     * 把远程的 iceCandidate 添加到自己的候选者
     * @param userId
     * @param sdpMLineIndex
     * @param candidate
     */
    this.addIceCandidate = function(userId, sdpMLineIndex, candidate) {
        let ic = new RTCIceCandidate({
            sdpMLineIndex: sdpMLineIndex,
            candidate: candidate
        });
        this.pc[userId].addIceCandidate(ic);
    };
    
    
    
    /**
     * 创建 offer 协商
     * @param userId
     */
    this.createOffer = function(userId) {
        this.pc[userId].createOffer(this.offerOptions)
            .then((offerDesc)=>{
                this.setLocalOffer(userId, offerDesc);
            })
            .catch( (e)=>{
                this.createOfferError(e);
            } );
    };
    
    
    this.setLocalOffer = function(userId, offerDesc){
        this.setLocalDesc(userId, offerDesc, ()=>{
            this.setLocalOfferEvent(userId, offerDesc);
    
            //send offer sdp;
            // ws.send({
            //     action: 'webrtc',
            //     event: 'offer',
            //     mine:{
            //         id: this.myUserId
            //     },
            //     webrtc:{
            //         id: userId
            //     },
            //     data: offerDesc
            // });
            
        }, (e)=>{
            this.setLocalOfferError(e);
        });
    };
    
    
    /**
     * 设置本地协商描述
     * @param userId
     * @param desc
     * @param sCallback
     * @param eCallback
     */
    this.setLocalDesc = function(userId, desc, sCallback = ()=>{}, eCallback = ()=>{}) {
        try {
            this.pc[userId].setLocalDescription(desc);
            sCallback();
        } catch (e) {
            eCallback(e);
        }
    };
    
    
    
    /**
     * 设置远程协商描述
     * @param userId
     * @param desc
     */
    this.setRemoteDesc = function(userId, desc) {
        try {
            this.pc[userId].setRemoteDescription(new RTCSessionDescription(desc));
            this.setRemoteDescriptionSuccess();
        } catch (e) {
            this.setRemoteDescriptionError(e);
        }
    };
    
    
    
    /**
     * 创建 answer 协商
     * @param userId
     */
    this.createAnswer = function(userId) {
        this.pc[userId].createAnswer()
            .then((answerDesc)=>{
                this.setLocalAnswer(userId, answerDesc);
            })
            .catch( (e)=>{
                this.createAnswerError(e);
            } );
    };
    
    
    this.setLocalAnswer = function(userId, answerDesc) {
        setLocalDesc(userId, answerDesc, ()=>{
            this.setLocalAnswerEvent(userId, answerDesc);
    
            // ws.send({
            //     action: 'webrtc',
            //     event: 'answer',
            //     mine:{
            //         id: this.myUserId
            //     },
            //     webrtc:{
            //         id: userId
            //     },
            //     data: answerDesc
            // });
            
        }, (e) => {
            this.setLocalAnswerError(e);
        });
    };
    
    
    
    /**
     * 停止资源流分发
     * @param stream
     */
    this.stopTrack = function(stream) {
        if(stream){
            stream.getTracks().forEach( (track) => {
                track.stop();
            });
        }
    };
    
    
    /**
     * 获取远程媒体源
     * 此接口即将废弃, 不建议使用
     * 推荐使用getReceivers接口
     * @param userId
     * @returns {*}
     */
    this.getRemoteStreams = function (userId) {
        // getRemoteStreams接口也可以获取远程媒体源, 但是此接口即将废弃, 不建议使用
        // let remoteStreams = pc.getRemoteStreams();
        // document.getElementById(`${k}_new`).srcObject = remoteStreams;

        if(this.pc[userId]){
            return this.pc[userId].getRemoteStreams();
        }
        return false;
    };
    
    
    /**
     * 获取远程媒体
     */
    this.getReceivers = function(userId, cb) {
        // 推荐使用getReceivers接口
        if(this.pc[userId] && this.pc[userId].getReceivers){
            let stream = new MediaStream();
            this.pc[userId].getReceivers().forEach(function(receiver) {
                stream.addTrack(receiver.track);
            });
            cb(stream);
            // document.getElementById(`${k}_new`).srcObject = stream;
        }
    };
    
    
    /**
     * 获取本地媒体
     */
    this.getSenders = function(userId, cb) {
        if(this.pc[userId] && this.pc[userId].getSenders){
            let stream = new MediaStream();
            this.pc[userId].getSenders().forEach(function(sender) {
                stream.addTrack(sender.track);
            });
            cb(stream);
            // document.getElementById(`${k}_new`).srcObject = stream;
        }
    };
    
    
    /**
     * 替换媒体源
     * 如: 把视频源替换成共享桌面源
     */
    function replaceTrack(stream) {
        for (let k in this.pc) {
            this.pc[k].getSenders().forEach(function(sender) {
                if (sender.track.kind === 'video' ) {
                    sender.replaceTrack(stream.getTracks()[0]);
                }
            });
        }
    }
    
    
    
    /**
     * 获取源的音频状态(true开启/false关闭)
     * @param stream
     * @returns {boolean}
     */
    this.isMuteAudio = function (stream) {
        return stream.getAudioTracks()[0].enabled;
    };
    
    
    /**
     * 获取源的视频状态(true开启/false关闭)
     * @param stream
     * @returns {boolean}
     */
    this.isMuteVideo = function (stream) {
        return stream.getVideoTracks()[0].enabled;
    };
    
    
    
    /**
     * 静音
     * @param stream
     * @param mute(true不静音/false静音)
     * @returns {boolean}
     */
    this.muteAudio = function(stream, mute = false) {
        if(stream){
            let audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
                return true;
            }
            for (let i = 0; i < audioTracks.length; ++i) {
                audioTracks[i].enabled = mute;
            }
            return audioTracks[0].enabled === mute;
        } else {
            return false;
        }
    };
    
    
    /**
     * 黑屏
     * @param stream
     * @param mute
     * @returns {boolean}
     */
    this.muteVideo = function(stream, mute = false) {
        if(stream){
            let videoTracks = stream.getVideoTracks();
            if (videoTracks.length === 0) {
                return true;
            }
            let len = videoTracks.length;
            for (let i = 0; i < len; ++i) {
                videoTracks[i].enabled = mute;
            }
            return videoTracks[0].enabled === mute;
        } else {
            return false;
        }
        
    };
    
    
    
    
    /**
     * 创建 dataChannel 传输通道
     * @param userId
     */
    this.createDataChannel = function(userId) {
        if(!this.dc[userId]){
            this.dc[userId] = this.pc[userId].createDataChannel('chat', channelOptions);
            this.dc[userId].binaryType = 'arraybuffer';
            this.dc[userId].onopen = ()=>{
                this.onChannelState(userId);
            };
            this.dc[userId].onclose = ()=>{
                this.onChannelState(userId);
            };
            this.dc[userId].onerror = (error) =>{
                this.onChannelError(userId, error);
            };
            this.dc[userId].onmessage = this.onChannelMessage;
        }
    };
    
    
    
    /**
     * 监听dataChannel事件
     * @param userId
     */
    this.onDataChannel = function(userId) {
        this.pc[userId].ondatachannel = (event)=>{
            if(!this.dc[userId]){
                this.dc[userId] = event.channel;
                this.dc[userId].binaryType = 'arraybuffer';
                this.dc[userId].onopen = () => {
                    this.onChannelState(userId);
                };
                this.dc[userId].onclose = () => {
                    this.onChannelState(userId);
                };
                this.dc[userId].onerror = (error) =>{
                    this.onChannelErrorEvent(userId, error);
                };
                this.dc[userId].onmessage = this.onChannelMessage;
            }
        };
    };
    
    
    /**
     * 监听dataChannel状态变化
     * @param userId
     */
    this.onChannelState = function(userId) {
        if(this.dc[userId]){
            const readyState = this.dc[userId].readyState;
            if (readyState === 'open') {
                this.onDataChannelOpenEvent(userId);
            } else {
                this.onDataChannelCloseEvent(userId);
            }
        }
    };
    
    
    /**
     * dataChannel发送数据
     * @param data
     * @param receiveId
     * @param dataType 数据类型 json或者string类型
     */
    this.sendChannelData = function(data, receiveId = '') {
        if(data){
            if(receiveId){
               this.onDataChannelSend(data, receiveId);
            } else {
                for (let k in remoteChannel){
                    this.onDataChannelSend(data, k);
                }
            }
        }
    };
    
    this.onDataChannelSend = function(data, receiveId) {
        if(this.dc[receiveId] && this.dc[receiveId].send){
            this.dc[receiveId].send(data);
        }
    };
    
    
    /**
     * dc接收信息
     * @param event
     */
    this.onChannelMessage = function(event) {
        try {
            let message = JSON.parse(event.data);
            this.onDataChannelMessageEvent( message );
            
        } catch (e) {
            // 文件数据
            this.onDataChannelFileEvent( event.data );
        }
    };
    
    
    /**
     * 发送文件
     * @param file 文件信息
     * @param receiveId    接收人(空 给所有人发/默认)
     * @param chunkSize    每次发送块的大小/b
     */
    this.sendFile = function(file, receiveId = '', chunkSize = 10240) {
        let fileReader = new FileReader();
        let offset = 0;
        fileReader.addEventListener('error', this.sendFileErrorEvent );
        fileReader.addEventListener('abort', this.sendFileAbortEvent );
        fileReader.addEventListener('load', e => {
            sendChannelData(e.target.result, receiveId);
            offset += e.target.result.byteLength;
            this.sendFileLoadEvent(e.target.result, offset);
            if (offset < file.size) {
                setTimeout(function () {
                    readSlice(offset);
                }, 100);
            } else {
                this.sendFileEndEvent(file, offset);
            }
        });
        const readSlice = o => {
            const slice = file.slice(offset, o + chunkSize);
            fileReader.readAsArrayBuffer(slice);
        };
        readSlice(0);
        this.sendFileStartEvent(file);
    };
    
    
    this.cleanOneUser = function (userId) {
        if(this.pc[userId]){
            this.pc[userId].ontrack = null;
            this.pc[userId].onremovetrack = null;
            this.pc[userId].onremovestream = null;
            this.pc[userId].onicecandidate = null;
            this.pc[userId].oniceconnectionstatechange = null;
            this.pc[userId].onsignalingstatechange = null;
            this.pc[userId].onicegatheringstatechange = null;
            this.pc[userId].onnegotiationneeded = null;
            this.pc[userId].close();
            this.pc[userId] = null;
            this.dc[userId] = null;
            this.cleanOneUserEvent(userId);
        }
    };
    
    
    
    // 获取音视频流信息
    this.getStreamInfo = function() {
        for (let k in this.pc) {
            if(this.pc[k]){
                
                // 获取自己音视频信息
                if(this.pc[k].getSenders){
                    this.pc[k].getSenders().forEach(function (sender) {
                        if(sender.track.kind === 'video'){
                            sender.getStats().then( (res)=>{
                                res.forEach( (report)=>{
                                    this.getLocalInfo(report);
                                    // if( report.type === 'codec' ){
                                    //     nowLocalInfo.mediaType = report.mimeType;
                                    //
                                    // } else if( report.type === 'track' ){
                                    //     nowLocalInfo.width = report.frameWidth;
                                    //     nowLocalInfo.height = report.frameHeight;
                                    //
                                    //     if( !prevLocalInfo[k].framesSent ){
                                    //         prevLocalInfo[k].framesSent = report.framesSent;
                                    //         nowLocalInfo.framesSent = 30;
                                    //
                                    //     } else {
                                    //         nowLocalInfo.framesSent = report.framesSent - prevLocalInfo[k].framesSent;
                                    //         prevLocalInfo[k].framesSent = report.framesSent;
                                    //     }
                                    //
                                    // } else if(report.type === 'outbound-rtp'){
                                    //     nowLocalInfo.packetsLost = 0;
                                    //
                                    // } else if(report.type === 'transport'){
                                    //     if( !prevLocalInfo[k].bytesSent ){
                                    //         prevLocalInfo[k].bytesSent = report.bytesSent;
                                    //         prevLocalInfo[k].timestamp = report.timestamp;
                                    //         nowLocalInfo.bitrate = 0;
                                    //
                                    //     } else {
                                    //         nowLocalInfo.bitrate = 8 * (report.bytesSent - prevLocalInfo[k].bytesSent) / (report.timestamp - prevLocalInfo[k].timestamp);
                                    //         prevLocalInfo[k].bytesSent = report.bytesSent;
                                    //     }
                                    // }
                                    
                                });
                            });
                        }
                    });
                }
                
                // 获取接收的音视频信息
                if(this.pc[k].getReceivers){
                    this.pc[k].getReceivers().forEach(function (receiver) {
                        if(receiver.track.kind === 'video'){
                            receiver.getStats().then( (res)=>{
                                res.forEach( (report)=>{
                                    this.remoteInfo(report);
                                    // if(report.type === 'codec' ){
                                    //     nowRemoteInfo.mediaType = report.mimeType;
                                    //
                                    // }else if( (report.type === 'track') && (report.kind === 'video') ){
                                    //     nowRemoteInfo.width = report.frameWidth;
                                    //     nowRemoteInfo.height = report.frameHeight;
                                    //
                                    //     if( !prevRemoteInfo[k].framesReceived ){
                                    //         prevRemoteInfo[k].framesSent = report.framesReceived;
                                    //         nowRemoteInfo.framesSent = 30;
                                    //     } else {
                                    //         nowRemoteInfo.framesSent = report.framesReceived - prevRemoteInfo[k].framesSent;
                                    //         prevRemoteInfo[k].framesSent = report.framesReceived;
                                    //     }
                                    //
                                    // } else if(report.type === 'inbound-rtp'){
                                    //     nowRemoteInfo.packetsLost = report.packetsLost / report.packetsReceived;
                                    //
                                    // } else if(report.type === 'transport'){
                                    //     if( !prevRemoteInfo[k].bytesSent ){
                                    //         prevRemoteInfo[k].bytesSent = report.bytesSent;
                                    //         prevRemoteInfo[k].timestamp = report.timestamp;
                                    //         nowRemoteInfo.bitrate = 0;
                                    //
                                    //     } else {
                                    //         nowRemoteInfo.bitrate = 8 * (report.bytesSent - prevRemoteInfo[k].bytesSent) / (report.timestamp - prevRemoteInfo[k].timestamp);
                                    //         prevRemoteInfo[k].bytesSent = report.bytesSent;
                                    //     }
                                    // }
                                });
                            });
                        }
                    });
                }
            }
        }
    }
}






















