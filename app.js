class VideoPlayer{
    constructor(_element){
        this.element = _element
        this.videoElement = _element.querySelector(".js-video")

        this.setPlayState()
        this.setVolume()
        this.setSeekBar()
    }

    setPlayState(){ // play/pause
        const playStateElement = this.element.querySelector(".js-play-state")

        playStateElement.addEventListener("click" , (_event) => {
            if(this.videoElement.paused){
                this.videoElement.play()  
                playStateElement.innerText = "Pause"
            }else{
                this.videoElement.pause()
                playStateElement.innerText = "Play"
            }
        })

    }

    setVolume(){
        const volumeBarElement = this.element.querySelector(".js-volume-bar")

        volumeBarElement.querySelector(".js-volume-bar-fill").style.transform = `scaleY(${this.videoElement.volume})`
        this.videoElement.addEventListener("volumechange", () => {
            volumeBarElement.querySelector(".js-volume-bar-fill").style.transform = `scaleY(${this.videoElement.volume})`
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


        // ++: flèches (gauche droite avancer/reculer || haut bas volume up/down), F (fullscreen), double clic,
        // ++: preview survol tps
        // ++: PiP, drag&drop tps & duration
        // cf player YT

    }
}

const mainPlayer = new VideoPlayer(document.querySelector(".js-player"))