function UserMedia(options = {}) {
    this.constraints = {
        audio: {
            // 音量调整（范围 0-1.0， 0为静音，1为最大声）
            volume: 1,
            // 回音消除 （true/false）
            // echoCancellation: true,
            // 自动增益 （在原有录音的基础上是否增加音量， true/false）
            autoGainControl: true,
            // 是否开启降噪功能 （true/false）
            noiseSuppression: true,
        },
        video: {
            width: 500,
            height: 375,
            // 帧率'
            frameRate:20,
            // 摄像头 user前置摄像头 environment后置摄像头 left前置左侧摄像头 right前置右侧摄像头
            facingMode: 'user',
            // 采集画面是否裁剪
            resizeMode: false,
        }
    };
    
    
    this.setVideoConstraints = function (options) {
        if(options && isObject(options) && isObject(options.video)){
            for (let v in options.video){
                this.constraints.video[v] = options.video[v];
            }
            for (let a in options.audio){
                this.constraints.audio[a] = options.audio[a];
            }
        }
    };
    
    
    this.getUserMedia = function () {
        this.setVideoConstraints(options);
        if(navigator.mediaDevices.getUserMedia){
            navigator.mediaDevices
                .getUserMedia(this.constraints)
                .then((stream)=>{
                    this.getUserMediaSuccess(stream);
                })
                .catch((e)=>{
                    this.getUserMediaError(e);
                });
        } else {
            this.notSuportMdeia();
            alert('您的浏览器不支持[视频], 请更换浏览器!!!');
        }
    };
    
    
    this.gotDevices = function(){
        return navigator.mediaDevices.enumerateDevices();
    }
    
}