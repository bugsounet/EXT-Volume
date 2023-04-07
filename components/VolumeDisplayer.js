class VolumeDisplayer {
  constructor(text) {
    this.volumeText = text
    this.timerOutSpeaker = null
    this.timerOutRecorder = null
    this.timerOutMuted = null
    console.log("[VOLUME] VolumeDisplayer Ready")
  }

  prepare () {
    var volumeContainer = document.createElement("div")
    volumeContainer.id = "EXT_VOLUME-SPEAKER"
    volumeContainer.classList.add("hidden")
    volumeContainer.className= "hidden animate__animated"
    volumeContainer.style.setProperty('--animate-duration', '1s')
    var volumeIconContainer = document.createElement("div")
    volumeIconContainer.id= "EXT_VOLUME-SPEAKER_CONTAINER_ICON"
      var volumeIcon = document.createElement("div")
      volumeIcon.id = "EXT_VOLUME-SPEAKER_ICON"
      volumeIcon.className = "mdi mdi-volume-high"
      volumeIconContainer.appendChild(volumeIcon)
    volumeContainer.appendChild(volumeIconContainer)
    var volumeText = document.createElement("div")
    volumeText.id = "EXT_VOLUME-SPEAKER_TEXT"
    volumeContainer.appendChild(volumeText)
    var volumeBar = document.createElement("div")
    volumeBar.id = "EXT_VOLUME-SPEAKER_BAR"
    volumeContainer.appendChild(volumeBar)
    document.body.appendChild(volumeContainer)

    var recorderContainer = document.createElement("div")
    recorderContainer.id = "EXT_VOLUME-RECORDER"
    recorderContainer.classList.add("hidden")
    recorderContainer.className= "hidden animate__animated"
    recorderContainer.style.setProperty('--animate-duration', '1s')
    var volumeIconContainer = document.createElement("div")
    volumeIconContainer.id= "EXT_VOLUME-RECODER_CONTAINER_ICON"
      var volumeIcon = document.createElement("div")
      volumeIcon.id = "EXT_VOLUME-RECORDER_ICON"
      volumeIcon.className = "mdi mdi-microphone"
      volumeIconContainer.appendChild(volumeIcon)
    recorderContainer.appendChild(volumeIconContainer)
    var volumeText = document.createElement("div")
    volumeText.id = "EXT_VOLUME-RECORDER_TEXT"
    recorderContainer.appendChild(volumeText)
    var volumeBar = document.createElement("div")
    volumeBar.id = "EXT_VOLUME-RECORDER_BAR"
    recorderContainer.appendChild(volumeBar)
    document.body.appendChild(recorderContainer)

    var muteContainer = document.createElement("div")
    muteContainer.id = "EXT_VOLUME-MUTE"
    muteContainer.classList.add("hidden")
    muteContainer.className= "hidden animate__animated"
    muteContainer.style.setProperty('--animate-duration', '1s')
    var volumeIconContainer = document.createElement("div")
    volumeIconContainer.id= "EXT_VOLUME-MUTE_CONTAINER_ICON"
      var volumeIcon = document.createElement("img")
      volumeIcon.id = "EXT_VOLUME-MUTE_ICON"
      volumeIcon.src = "/modules/EXT-Volume/resources/mute.png"
      volumeIconContainer.appendChild(volumeIcon)
    muteContainer.appendChild(volumeIconContainer)
    document.body.appendChild(muteContainer)
  }

  drawVolumeSpeaker (current) {
    clearTimeout(this.timerOutSpeaker)
    var volume = document.getElementById("EXT_VOLUME-SPEAKER")
    volume.classList.remove("hidden", "animate__zoomOut")
    volume.classList.add("animate__zoomIn")
    var volumeText = document.getElementById("EXT_VOLUME-SPEAKER_TEXT")
    volumeText.innerHTML = this.volumeText + " " + current + "%"
    var volumeBar = document.getElementById("EXT_VOLUME-SPEAKER_BAR")
    volumeBar.style.width = current + "%"
    this.timerOutSpeaker = setTimeout(()=>{
      volume.classList.remove("animate__zoomIn")
      volume.classList.add("animate__zoomOut")
      volume.addEventListener('animationend', (e) => {
        if (e.animationName == "zoomOut") volume.classList.add("hidden")
        e.stopPropagation()
      }, {once: true})
    }, 3000)
  }

  drawVolumeRecorder (current) {
    clearTimeout(this.timerOutRecorder)
    var volume = document.getElementById("EXT_VOLUME-RECORDER")
    volume.classList.remove("hidden", "animate__zoomOut")
    volume.classList.add("animate__zoomIn")
    var volumeText = document.getElementById("EXT_VOLUME-RECORDER_TEXT")
    volumeText.innerHTML = this.volumeText + " " + current + "%"
    var volumeBar = document.getElementById("EXT_VOLUME-RECORDER_BAR")
    volumeBar.style.width = current + "%"
    this.timerOutRecorder = setTimeout(()=>{
      volume.classList.remove("animate__zoomIn")
      volume.classList.add("animate__zoomOut")
      volume.addEventListener('animationend', (e) => {
        if (e.animationName == "zoomOut") volume.classList.add("hidden")
        e.stopPropagation()
      }, {once: true})
    }, 3000)
  }

  drawVolumeMuted() {
    clearTimeout(this.timerOutMuted)
    var mute = document.getElementById("EXT_VOLUME-MUTE")
    mute.classList.remove("hidden", "animate__zoomOut")
    mute.classList.add("animate__zoomIn")
    this.timerOutMuted = setTimeout(()=>{
      mute.classList.remove("animate__zoomIn")
      mute.classList.add("animate__zoomOut")
      mute.addEventListener('animationend', (e) => {
        if (e.animationName == "zoomOut") mute.classList.add("hidden")
        e.stopPropagation()
      }, {once: true})
    }, 3000)
  }
}

