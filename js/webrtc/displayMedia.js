var DM = function() {
    this.displayConstraints = {
        video: true,
        audio: true
    };
    
    this.getDisplayMedia = function() {
        let displayMedia = null;
        if (navigator.getDisplayMedia) {
            displayMedia = navigator.getDisplayMedia(this.displayConstraints);
        } else if (navigator.mediaDevices.getDisplayMedia) {
            displayMedia = navigator.mediaDevices.getDisplayMedia(this.displayConstraints);
        } else {
            displayMedia = navigator.mediaDevices.getUserMedia({audio:true, video: {mediaSource: 'screen'}});
        }
        displayMedia
            .then((stream)=>{
                this.getDisplayMediaSuccess(stream);
            })
            .catch( (e)=>{
                this.getDisplayMediaError(e);
            } );
    }
};





















































