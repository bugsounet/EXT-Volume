"use strict"

var NodeHelper = require("node_helper")
const exec = require("child_process").exec
var log = (...args) => { /* do nothing */ }

module.exports = NodeHelper.create({
  start: function () {
    this.volumeScript= {
      "OSX": "osascript -e 'set volume output volume #VOLUME#'",
      "ALSA": "amixer sset -M 'PCM' #VOLUME#%",
      "ALSA_HEADPHONE": "amixer sset -M 'Headphone' #VOLUME#%",
      "ALSA_HDMI": "amixer sset -M 'HDMI' #VOLUME#%",
      "HIFIBERRY-DAC": "amixer sset -M 'Digital' #VOLUME#%",
      "PULSE": "amixer set Master #VOLUME#% -q",
      "RESPEAKER_SPEAKER": "amixer -M sset Speaker #VOLUME#%",
      "RESPEAKER_PLAYBACK": "amixer -M sset Playback #VOLUME#%"
    }
  },

  socketNotificationReceived: function (noti, payload) {
    switch (noti) {
      case "INIT":
        console.log("[VOLUME] EXT-Volume Version:", require('./package.json').version, "rev:", require('./package.json').rev)
        this.initialize(payload)
      break
      case "VOLUME_SET":
        this.setVolume(payload)
        break
    }
  },

  initialize: async function (config) {
    this.config = config
    if (this.config.debug) log = (...args) => { console.log("[VOLUME]", ...args) }
    log(config)
    let exists = (data) => {
      return data !== null && data !== undefined
    }
    if (!exists(this.volumeScript[this.config.volumePreset])) {
      console.log("[VOLUME] VolumePresetError")
      return //this.DisplayError("VolumePreset error", {message: "VolumePresetError"})
    }
  },

  /** Volume control **/
  setVolume: function(level) {
    var volumeScript= this.config.myScript ? this.config.myScript : this.volumeScript[this.config.volumePreset]
    var script = volumeScript.replace("#VOLUME#", level)
    exec (script, (err, stdout, stderr)=> {
      if (err) {
        console.log("[VOLUME] Set Volume Error:", err.toString())
        this.sendSocketNotification("WARNING" , { message: "VolumePresetError" })
      }
      else {
        log("Set Volume To:", level)
        this.sendSocketNotification("VOLUME_DONE", level)
        this.sendSocketNotification("INFORMATION" , { message: "Volume", values: level + "%" })
      }
    })
  },

})
