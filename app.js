class VideoPlayer{
    constructor(_element){
        this.element = _element
        this.videoElement = _element.querySelector(".js-video")
        this.currentTimeLabel = this.element.querySelector(".js-current-time")

        this.initialize()

        this.setPlayState()
        this.setVolume()
        this.setSeekBar()
        this.previewOnSeekBar()

        this.listenFullscreen()
        this.addKeyboardControls()
        this.togglePictureInPicture()
    }

    _convertSeconds(sec){
        let hrs = Math.floor(sec / 3600)
        let min = Math.floor((sec - (hrs * 3600)) / 60)
        let seconds = sec - (hrs * 3600) - (min * 60)
        seconds = parseInt(Math.round(seconds * 100) / 100)


        let result = ""
        
        hrs > 0 ? result += (hrs < 10 ? "0" + hrs : hrs) + ":" : "" // if video > 60mn
        result += min > 0 ? (min < 10 ? "0" + min : min) : "00" // if video > 60s
        result += ":" + (seconds < 10 ? "0" + seconds : seconds)
        return result
    }

    initialize(){

        const lastCurrentTime = localStorage.getItem("player_lastTime")
        const lastVolume = localStorage.getItem("player_lastVolume")

        // canplay not triggered: solution from https://stackoverflow.com/questions/21103672/chrome-video-element-canplay-event-not-firing
        if (this.videoElement.readyState >= this.videoElement.HAVE_FUTURE_DATA) {
            this.element.querySelector(".js-total-time").innerText = this._convertSeconds(this.videoElement.duration)
            
            this.videoElement.currentTime = (lastCurrentTime !== null) ? lastCurrentTime : 0
            this.videoElement.volume      = (lastVolume !== null) ? lastVolume : 0
        } else {
            this.videoElement.addEventListener("canplay", () => {
                this.element.querySelector(".js-total-time").innerText = this._convertSeconds(this.videoElement.duration)
                
                this.videoElement.currentTime = (lastCurrentTime !== null) ? lastCurrentTime : 0
                this.videoElement.volume = (lastVolume !== null) ? lastVolume : 0
            })
        }

        this.videoElement.addEventListener("dblclick", this._toggleFullscreen.bind(this))

        // Remember state when leaving page
        window.addEventListener("beforeunload", (_event) => {
            localStorage.setItem("player_lastTime", this.videoElement.currentTime)
            localStorage.setItem("player_lastVolume", this.videoElement.volume)
        })
    }

    _toggleFullscreen(){
        console.log(this.element.innerHeight)
        console.log(window.innerHeight)
        console.log("====")
        if(this.element.offsetHeight == window.innerHeight){
            document.exitFullscreen()

            return
        }
        if(this.element.requestFullscreen){
            this.element.requestFullscreen()
        }else if(this.element.webkitRequestFullscreen){
            this.element.webkitRequestFullscreen()
        }else if(this.element.mozRequestFullScreen){
            this.element.mozRequestFullscreen()
        }

    }

    _togglePlayPause(){
        const playStateElement = this.element.querySelector(".js-play-state")

        if (this.videoElement.paused) {
            this.videoElement.play()

            playStateElement.classList.remove("fa-play")
            playStateElement.classList.add("fa-pause")
        } else {
            this.videoElement.pause()
            playStateElement.classList.remove("fa-pause")
            playStateElement.classList.add("fa-play")
        }
    }

    setPlayState(){ // play/pause
        const playStateElement = this.element.querySelector(".js-play-state")

        this.videoElement.addEventListener("click", this._togglePlayPause.bind(this))

        playStateElement.addEventListener("click", this._togglePlayPause.bind(this))
    }

    setVolume(){
        const volumeBarElement = this.element.querySelector(".js-volume-bar")

        let currentVolume = this.videoElement.volume

        volumeBarElement.querySelector(".js-volume-bar-fill").style.transform = `scaleY(${this.videoElement.volume})`
        this.videoElement.addEventListener("volumechange", () => {
            volumeBarElement.querySelector(".js-volume-bar-fill").style.transform = `scaleY(${this.videoElement.volume})`

            if (this.videoElement.volume > 0.1) {
                this.element.querySelector(".js-hardmute").classList.remove("fa-volume-off")
                this.element.querySelector(".js-hardmute").classList.add("fa-volume-up")
            } else {
                this.element.querySelector(".js-hardmute").classList.remove("fa-volume-up")
                this.element.querySelector(".js-hardmute").classList.add("fa-volume-off")
            }
        })

        this.element.querySelector(".js-hardmute").addEventListener("click", () => {
            if(this.videoElement.volume > 0){
                currentVolume = this.videoElement.volume
                this.videoElement.volume = 0
            }else{
                this.videoElement.volume = currentVolume
            }
        })

        let active = false,
            currentY,
            initialY,
            yOffset = 0


        const dragStart = (_event) => {
            if (_event.type === "touchstart") {
                initialY = _event.touches[0].clientY - yOffset
            } else {
                initialY = _event.clientY - yOffset
            }

            if (_event.target === volumeBarElement) active = true
        }

        const dragEnd = (_event) => {
            initialY = currentY

            active = false
        }

        const drag = (_event) => {
            if (active) {
                if(_event.type === "touchmove"){
                    currentY = _event.touches[0].clientY - initialY
                }else{
                    currentY = _event.clientY - initialY
                }

                yOffset = currentY
             
                const bounding = volumeBarElement.getBoundingClientRect()
                const ratio = 1 - (_event.clientY - bounding.top) / bounding.height
                const time = ratio * 1
                
                this.videoElement.volume = time
            }
        }

        volumeBarElement.addEventListener("touchstart", dragStart, false)
        volumeBarElement.addEventListener("touchend", dragEnd, false)
        volumeBarElement.addEventListener("touchmove", drag, false)

        volumeBarElement.addEventListener("mousedown", dragStart, false)
        volumeBarElement.addEventListener("mouseup", dragEnd, false)
        volumeBarElement.addEventListener("mousemove", drag, false)

        volumeBarElement.addEventListener("click", (_event) => {
            const bounding = volumeBarElement.getBoundingClientRect()
            const ratio = 1 - (_event.clientY - bounding.top) / bounding.height
            const time = ratio * 1

            this.videoElement.volume = time
            volumeBarElement.querySelector(".js-volume-bar-fill").style.transform = `scaleY(${time})`
        })
    }

    setSeekBar(){
        const seekBarElement = this.element.querySelector(".js-seek-bar")
        
        this.videoElement.addEventListener("timeupdate", () => {
            const durationRatio = this.videoElement.currentTime / this.videoElement.duration
            seekBarElement.querySelector(".js-seek-bar-fill").style.transform = `scaleX(${durationRatio})`
            this.currentTimeLabel.innerText = this._convertSeconds(this.videoElement.currentTime)
        })
        

        // Click & Drag code heavily inspired from https://www.kirupa.com/html5/drag.htm 
        let active = false,
            currentX,
            initialX,
            xOffset = 0

            
        const dragStart = (_event) => {
            if(_event.type === "touchstart") {
                initialX = _event.touches[0].clientX - xOffset
            }else{
                initialX = _event.clientX - xOffset
            }
            
            if(_event.target === seekBarElement) active = true
        }
        
        const dragEnd = (_event) => {
            initialX = currentX
            
            active = false
        }
        
        const drag = (_event) => {
            if (active) {
                if(_event.type === "touchmove"){
                    currentX = _event.touches[0].clientX - initialX
                }else{
                    currentX = _event.clientX - initialX
                }
                
                xOffset = currentX
                
                const bounding = seekBarElement.getBoundingClientRect()
                const ratio = (_event.clientX - bounding.left) / bounding.width
                const time = ratio * this.videoElement.duration
                
                this.videoElement.currentTime = time
            }
        }
        
        seekBarElement.addEventListener("touchstart", dragStart, false)
        seekBarElement.addEventListener("touchend", dragEnd, false)
        seekBarElement.addEventListener("touchmove", drag, false)

        seekBarElement.addEventListener("mousedown", dragStart, false)
        seekBarElement.addEventListener("mouseup", dragEnd, false)
        seekBarElement.addEventListener("mousemove", drag, false)

        seekBarElement.addEventListener("click", (_event) => {
            const bounding = seekBarElement.getBoundingClientRect()
            const ratio    = (_event.clientX - bounding.left) / bounding.width
            const time     = ratio * this.videoElement.duration
            
            this.videoElement.currentTime = time
        })
    }

    listenFullscreen(){
        this.element.addEventListener("fullscreenchange", () => {
            this.videoElement.classList.toggle("fullscreen")
            this.element.querySelector(".js-toggle-fullscreen").classList.toggle("fa-expand")
            this.element.querySelector(".js-toggle-fullscreen").classList.toggle("fa-compress")
        })

        this.element.querySelector(".js-toggle-fullscreen").addEventListener("click", this._toggleFullscreen.bind(this))
    }

    previewOnSeekBar(){
        const seekBarElement = this.element.querySelector(".js-seek-bar")
        const viewPreviewElement = this.element.querySelector(".js-preview")

        seekBarElement.addEventListener("mouseover", (_event) => {
            const bounding = seekBarElement.getBoundingClientRect()
            const ratio    = (_event.clientX - bounding.left) / bounding.width
            const time     = ratio * this.videoElement.duration
            
            viewPreviewElement.parentNode.style.transform = `translateX(${ _event.clientX - bounding.left }px)`

            viewPreviewElement.currentTime = time
        })

        seekBarElement.addEventListener("mouseleave", (_event) => {
            viewPreviewElement.parentNode.style.transform = "scale(0)"
        })
    }

    addKeyboardControls(){
        document.addEventListener("keydown", (_event) => {
            switch(_event.key.toLowerCase()){
                case " ":
                    this._togglePlayPause()
                    break
                case "arrowleft":
                    if(this.videoElement.currentTime <= 5){
                        this.videoElement.currentTime = 0
                    }else{
                        this.videoElement.currentTime -= 5
                    }
                    break
                case "arrowright":
                    if (this.videoElement.currentTime + 5 >= this.videoElement.duration) {
                        this.videoElement.currentTime = this.videoElement.duration
                    } else {
                        this.videoElement.currentTime += 5
                    }
                    break
                case "arrowup":
                    this.videoElement.volume = Math.min(this.videoElement.volume + .2, 1)
                    break
                case "arrowdown":
                    this.videoElement.volume = Math.max(this.videoElement.volume - .2, 0)
                    break
                case "f":
                    this._toggleFullscreen()
                    break
                case "p":
                    this._pipToggleAction()
                    break
            }
        })
    }

    _pipToggleAction(){
        const pipTogglerElement = this.element.querySelector(".js-toggle-pip")
        pipTogglerElement.disabled = true

        if(this.videoElement !== document.pictureInPictureElement){
            this.videoElement.requestPictureInPicture()
                .then((_e) => {
                    pipTogglerElement.disabled = false
                })
        } else {
            document.exitPictureInPicture()
                .then((_e) => {
                    pipTogglerElement.disabled = false
                })
        }
    }

    togglePictureInPicture() { // got help from https://dev.to/ananyaneogi/implement-picture-in-picture-on-the-web-17g8
        const pipTogglerElement = this.element.querySelector(".js-toggle-pip")
        pipTogglerElement.addEventListener("click", () => {
            if('pictureInPictureEnabled' in document){
                pipTogglerElement.addEventListener('click', this._pipToggleAction.bind(this))
            }else{
                pipTogglerElement.style.opacity = 0
            }
        })
    }
}

const mainPlayer = new VideoPlayer(document.querySelector(".js-player"))