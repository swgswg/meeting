var WS = function (obj) {
 
    const config = obj ? obj : {};
    this.isReady = false;
    
    //接口地址url
    this.url = config.url || 'wss://im.chuanqingkeji.net/websocket';
    
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    if (!window.WebSocket) {
        // 检测浏览器支持
        console.error('错误: 浏览器不支持websocket');
        return;
    }
    
    this.socket = new WebSocket(this.url);
    
    this.socket.onopen = (e) => {
        this.isReady = true;
        this.open(e);
    };
    
    this.socket.onmessage = (evt) => {
        let data =  JSON.parse(evt.data);
        let action = data.action;
        let event = data.event || null;
        if (event) {
            switch (event){
                case 'created': this.created(data);
                break;
                case 'joined': this.joined(data);
                break;
                case 'disJoin': this.disJoin(data);
                break;
                case 'otherJoin': this.otherJoin(data);
                break;
                case 'offer': this.offer(data);
                break;
                case 'answer': this.answer(data);
                break;
                case 'candidate': this.candidate(data);
                break;
                case 'muteAudio': this.muteAudio(data);
                break;
                case 'userAudio': this.userAudio(data);
                break;
                case 'setAdmin': this.setAdmin(data);
                break;
                case 'roomLayout': this.roomLayout(data);
                break;
                case 'maxVideo': this.maxVideo(data);
                break;
                case 'editName': this.editName(data);
                break;
                case 'removeUser': this.removeUser(data);
                break;
                case 'closeRoom': this.closeRoom(data);
                break;
                case 'out': this.out(data);
                break;
            }
        } else {
            // this.handleAction[action](data);
            switch (action){
                case 'open': this.actionOpen(data);
                break;
            }
        }
    };
    
    this.socket.onclose = (e) => {
        // this.close(e);
        // 清理
        this.socket = null;
    };
    
    this.socket.onerror = (e) => {
        // this.error(e);
    };
    
    this.send = (sendData = {}) => {
        if(this.isReady){
            this.socket.send( JSON.stringify(sendData) );
        }
    };
    
    this.close = () => {
        this.socket.close();
    };
    
    // 心跳(50s)
    setInterval( () => {
        this.send({
            action:'index'
        });
    }, 50000);
};
