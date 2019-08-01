var channelOptions = {
    negotiatend: true,  // 是否双方通信
    id: roomId,
    ordered: true,    // 指示数据通道是否保证按顺序传递消息
    maxRetransmits:5, // 消息失败的重传次数
};
var remoteChannel = {};

/**
 * 创建 dataChannel 传输通道
 * @param pc
 * @param userId
 * @param roomId
 */
function createDataChannel(pc ,userId, roomId) {
    if(!remoteChannel[userId]){
        channelOptions.id = roomId;
        remoteChannel[userId] = pc.createDataChannel('chat', channelOptions);
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
 * @param pc
 * @param userId
 */
function onDataChannel(pc, userId) {
    if(!remoteChannel[userId]){
        pc.ondatachannel = (event) => {
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
        };
    }
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
