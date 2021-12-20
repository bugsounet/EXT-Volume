/**
 ** Module : MMM-Volume
 ** @bugsounet
 ** ©12-2021
 ** support: http://forum.bugsounet.fr
 **/

logNOTI = (...args) => { /* do nothing */ }

Module.register("MMM-Volume", {
  defaults: {
    debug: true,
    volumePreset: "PULSE",
    myScript: null
  },

  start: function () {
    if (this.config.debug) logNOTI = (...args) => { console.log("[VOLUME]", ...args) }
    this.config.volumeText = "Volume" //this.translate("VolumeText")
  },

  getScripts: function() {
    return [ ]
  },

  getStyles: function () {
    return [
      "MMM-Volume.css",
      "https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
    ]
  },

  getDom: function() {

  },

  notificationReceived: function(noti, payload) {
    switch(noti) {
      case "DOM_OBJECTS_CREATED":
        this.sendSocketNotification("INIT", this.config)
        this.prepareVolume()
        break
      case "EXT_VOLUME_SET":
        this.sendSocketNotification("VOLUME_SET", payload)
        break
    }
  },

  socketNotificationReceived: function(noti, payload) {
    switch(noti) {
      case "VOLUME_DONE":
        this.drawVolume(payload)
        break
   
    }    
  },

  /****************************/
  /*** TelegramBot Commands ***/
  /****************************/

  getCommands: function(commander) {
    commander.add({
      command: "volume",
      description: "volume help to translate", //this.translate("VOLUME_HELP"),
      callback: "tbVolume"
    })
  },

  tbVolume: function(command, handler) {
    if (handler.args) {
      var value = Number(handler.args)
      if ((!value && value != 0) || ((value < 0) || (value > 100))) return handler.reply("TEXT", "/volume [0-100]")
      this.sendSocketNotification("VOLUME_SET", value)
      handler.reply("TEXT", "Volume " + value+"%")
    }
    else handler.reply("TEXT", "/volume [0-100]")
  },

  /** Volume display **/
  prepareVolume () {
    var volume = document.createElement("div")
    volume.id = "EXT_VOLUME"
    volume.classList.add("hidden")
    volume.className= "hidden animate__animated"
    volume.style.setProperty('--animate-duration', '1s')
    var volumeText = document.createElement("div")
    volumeText.id = "EXT_VOLUME_TEXT"
    volume.appendChild(volumeText)
    var volumeBar = document.createElement("div")
    volumeBar.id = "EXT_VOLUME_BAR"
    volume.appendChild(volumeBar)
    document.body.appendChild(volume)
    return volume
  },

  drawVolume (current) {
    var volume = document.getElementById("EXT_VOLUME")
    volume.classList.remove("hidden", "animate__zoomOut")
    volume.classList.add("animate__zoomIn")
    var volumeText = document.getElementById("EXT_VOLUME_TEXT")
    volumeText.innerHTML = this.config.volumeText + " " + current + "%"
    var volumeBar = document.getElementById("EXT_VOLUME_BAR")
    volumeBar.style.width = current + "%"
    setTimeout(()=>{
      volume.classList.remove("animate__zoomIn")
      volume.classList.add("animate__zoomOut")
      volume.addEventListener('animationend', (e) => {
        if (e.animationName == "flipOutX" && e.path[0].id == "EXT_VOLUME") {
          volume.classList.add("hidden")
        }
        e.stopPropagation()
      }, {once: true})
    }, 3000)
  }
})
