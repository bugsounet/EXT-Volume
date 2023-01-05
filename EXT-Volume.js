/**
 ** Module : EXT-Volume
 ** @bugsounet
 ** ©01-2022
 ** support: https://forum.bugsounet.fr
 **/

logNOTI = (...args) => { /* do nothing */ }

Module.register("EXT-Volume", {
  defaults: {
    debug: false,
    mySpeakerScript: null,
    startSpeakerVolume: 100,
    myRecorderScript: null,
    startRecorderVolume: 50,
  },

  start: function () {
    if (this.config.debug) logNOTI = (...args) => { console.log("[VOLUME]", ...args) }
    this.config.volumeText = this.translate("VolumeText")
    this.timerOutSpeaker = null
    this.timerOutRecorder = null
    this.timerOutMuted = null
    if (this.config.startSpeakerVolume > 100) this.config.startSpeakerVolume = 100
    if (this.config.startSpeakerVolume < 0) this.config.startSpeakerVolume = 0
    if (this.config.startRecorderVolume > 100) this.config.startRecorderVolume = 100
    if (this.config.startRecorderVolume < 0) this.config.startRecorderVolume = 0
    this.currentLevel = {}
    this.oldLevel = {}
  },

  getScripts: function() {
    return [ ]
  },

  getStyles: function () {
    return [
      "EXT-Volume.css",
      "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css",
      "https://cdn.materialdesignicons.com/5.2.45/css/materialdesignicons.min.css"
    ]
  },

  getDom: function() {
    var dom = document.createElement("div")
    dom.style.display = 'none'
    return dom
  },

  notificationReceived: function(noti, payload, sender) {
    switch(noti) {
      case "DOM_OBJECTS_CREATED":
        this.sendSocketNotification("INIT", this.config)
        this.prepareVolume()
        break
      case "GAv4_READY":
        if (sender.name == "MMM-GoogleAssistant") {
          this.sendNotification("EXT_HELLO", this.name)
          this.sendSocketNotification("INITIAL_VOLUME")
        }
        break
      case "EXT_VOLUME-SPEAKER_SET":
        this.sendSocketNotification("VOLUMESPEAKER_SET", payload)
        break
      case "EXT_VOLUME-SPEAKER_UP":
        this.sendSocketNotification("VOLUMESPEAKER_UP")
        break
      case "EXT_VOLUME-SPEAKER_DOWN":
        this.sendSocketNotification("VOLUMESPEAKER_DOWN")
        break
      case "EXT_VOLUME-RECORDER_SET":
        this.sendSocketNotification("VOLUMERECORDER_SET", payload)
        break
      case "EXT_VOLUME-RECORDER_UP":
        this.sendSocketNotification("VOLUMERECORDER_UP")
        break
      case "EXT_VOLUME-RECORDER_DOWN":
        this.sendSocketNotification("VOLUMERECORDER_DOWN")
        break
    }
  },

  socketNotificationReceived: function(noti, payload) {
    switch(noti) {
      case "VOLUMESPEAKER_DONE":
        this.drawVolumeSpeaker(payload)
        break
      case "VOLUMERECORDER_DONE":
        this.drawVolumeRecorder(payload)
        break
      case "VOLUMESPEAKER_LEVEL":
        this.sendNotification("EXT_VOLUME_GET", payload)
        this.currentLevel = payload
        if (this.currentLevel.SpeakerIsMuted == true) {
          this.drawVolumeMuted()
        }
        if ((this.currentLevel.SpeakerIsMuted == false) && this.oldLevel.SpeakerIsMuted == true) {
          this.drawVolumeSpeaker(this.currentLevel.Speaker)
        }
        this.oldLevel = payload
        break
      case "WARNING":
        this.sendNotification("EXT_ALERT", { type: "warning", message: this.translate(payload) })
    }
  },

  /****************************/
  /*** TelegramBot Commands ***/
  /****************************/

  getCommands: function(commander) {
    commander.add({
      command: "volume",
      description: this.translate("VolumeHelp"),
      callback: "tbVolume"
    })
    commander.add({
      command: "record",
      description: "Set recorder volume",
      callback: "tbRecorder"
    })
    commander.add({
      command: "mute",
      description: "Mute speaker",
      callback: "tbMute"
    })
    commander.add({
      command: "unmute",
      description: "UnMute speaker",
      callback: "tbUnMute"
    })
  },

  tbVolume: function(command, handler) {
    if (handler.args) {
      var value = Number(handler.args)
      if ((!value && value != 0) || ((value < 0) || (value > 100))) return handler.reply("TEXT", "/volume [0-100]")
      this.sendSocketNotification("VOLUMESPEAKER_SET", value)
      handler.reply("TEXT", "Speaker Volume " + value+"%")
    }
    else handler.reply("TEXT", "Speaker Volume " + this.currentLevel.Speaker + "%")
  },

  tbRecorder: function(command, handler) {
    if (handler.args) {
      var value = Number(handler.args)
      if ((!value && value != 0) || ((value < 0) || (value > 100))) return handler.reply("TEXT", "/volume [0-100]")
      this.sendSocketNotification("VOLUMERECORDER_SET", value)
      handler.reply("TEXT", "Recorder Volume " + value+"%")
    }
    else handler.reply("TEXT", "Recorder Volume " + this.currentLevel.Recorder +"%")
  },

  tbMute: function(command, handler) {
    if (this.currentLevel.SpeakerIsMuted) return handler.reply("TEXT", "Speaker is already Muted")
    this.sendSocketNotification("VOLUMESPEAKER_SET", "mute")
    handler.reply("TEXT", "Speaker is now Muted")
  },

  tbUnMute: function(command, handler) {
    if (!this.currentLevel.SpeakerIsMuted) return handler.reply("TEXT", "Speaker is already UnMuted")
    this.sendSocketNotification("VOLUMESPEAKER_SET", "unmute")
    handler.reply("TEXT", "Speaker is now UnMuted")
  },

  /** Volume display **/
  prepareVolume () {
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
  },

  drawVolumeSpeaker (current) {
    clearTimeout(this.timerOutSpeaker)
    var volume = document.getElementById("EXT_VOLUME-SPEAKER")
    volume.classList.remove("hidden", "animate__zoomOut")
    volume.classList.add("animate__zoomIn")
    var volumeText = document.getElementById("EXT_VOLUME-SPEAKER_TEXT")
    volumeText.innerHTML = this.config.volumeText + " " + current + "%"
    var volumeBar = document.getElementById("EXT_VOLUME-SPEAKER_BAR")
    volumeBar.style.width = current + "%"
    this.timerOutSpeaker = setTimeout(()=>{
      volume.classList.remove("animate__zoomIn")
      volume.classList.add("animate__zoomOut")
      volume.addEventListener('animationend', (e) => {
        if (e.animationName == "flipOutX" && e.path[0].id == "EXT_VOLUME-SPEAKER") {
          volume.classList.add("hidden")
        }
        e.stopPropagation()
      }, {once: true})
    }, 3000)
  },

  drawVolumeRecorder (current) {
    clearTimeout(this.timerOutRecorder)
    var volume = document.getElementById("EXT_VOLUME-RECORDER")
    volume.classList.remove("hidden", "animate__zoomOut")
    volume.classList.add("animate__zoomIn")
    var volumeText = document.getElementById("EXT_VOLUME-RECORDER_TEXT")
    volumeText.innerHTML = this.config.volumeText + " " + current + "%"
    var volumeBar = document.getElementById("EXT_VOLUME-RECORDER_BAR")
    volumeBar.style.width = current + "%"
    this.timerOutRecorder = setTimeout(()=>{
      volume.classList.remove("animate__zoomIn")
      volume.classList.add("animate__zoomOut")
      volume.addEventListener('animationend', (e) => {
        if (e.animationName == "flipOutX" && e.path[0].id == "EXT_VOLUME-RECORDER") {
          volume.classList.add("hidden")
        }
        e.stopPropagation()
      }, {once: true})
    }, 3000)
  },

  drawVolumeMuted() {
    clearTimeout(this.timerOutMuted)
    var mute = document.getElementById("EXT_VOLUME-MUTE")
    mute.classList.remove("hidden", "animate__zoomOut")
    mute.classList.add("animate__zoomIn")
    this.timerOutMuted = setTimeout(()=>{
      mute.classList.remove("animate__zoomIn")
      mute.classList.add("animate__zoomOut")
      mute.addEventListener('animationend', (e) => {
        if (e.animationName == "flipOutX" && e.path[0].id == "EXT_VOLUME-MUTE") {
          mute.classList.add("hidden")
        }
        e.stopPropagation()
      }, {once: true})
    }, 3000)
  },

  getTranslations: function() {
    return {
      en: "translations/en.json",
      fr: "translations/fr.json",
      it: "translations/it.json",
      de: "translations/de.json",
      es: "translations/es.json",
      nl: "translations/nl.json",
      pt: "translations/pt.json",
      ko: "translations/ko.json",
      el: "translations/el.json"
    }
  },
})
