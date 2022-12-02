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
      "RESPEAKER_PLAYBACK": "amixer -M sset Playback #VOLUME#%",
      "UBUNTU": "amixer -D pulse -M sset Master #VOLUME#%"
    }
    this.volumeDisabled = true
    this.lastLevel = 100
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
      case "VOLUME_UP":
        this.upVolume()
        break
      case "VOLUME_DOWN":
        this.downVolume()
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
      console.error("[VOLUME] VolumePresetError")
      this.sendSocketNotification("WARNING", "VolumePresetError")
      return
    }
    this.volumeDisabled= false
  },

  /** Volume control **/
  setVolume: function(level) {
    if (this.volumeDisabled) return this.sendSocketNotification("WARNING" , "VolumeDisabled")
    var volumeScript= this.config.myScript ? this.config.myScript : this.volumeScript[this.config.volumePreset]
    var script = volumeScript.replace("#VOLUME#", level)
    exec (script, (err, stdout, stderr)=> {
      if (err) {
        console.error("[VOLUME] Set Volume Error:", err.toString())
        this.sendSocketNotification("WARNING" , "VolumePresetError")
      }
      else {
        log("Set Volume To:", level)
        this.sendSocketNotification("VOLUME_DONE", level)
        this.lastLevel = level
      }
    })
  },

  upVolume: function() {
    var level = this.lastLevel + 5
    if (level >= 100) level = 100
    this.setVolume(level)
  },

  downVolume: function () {
    var level = this.lastLevel - 5
    if (level <= 0) level = 0
    this.setVolume(level)
  }
})
