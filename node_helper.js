"use strict"

var NodeHelper = require("node_helper")
const exec = require("child_process").exec
var log = (...args) => { /* do nothing */ }

module.exports = NodeHelper.create({
  start: function () {
    this.volumeSpeakerScript=  "amixer -D pulse -M sset Master #VOLUME#% -q"
    this.volumeRecorderScript = "amixer -D pulse -M sset Capture #VOLUME#% -q"
    this.level = {
      Speaker: 100,
      SpeakerIsMuted: false,
      Recorder: 50
    }
  },

  socketNotificationReceived: function (noti, payload) {
    switch (noti) {
      case "INIT":
        console.log("[VOLUME] EXT-Volume Version:", require('./package.json').version, "rev:", require('./package.json').rev)
        this.initialize(payload)
      break
      case "INITIAL_VOLUME":
        this.setVolumeRecorder(this.config.startRecorderVolume)
        this.setVolumeSpeaker("unmute")
        this.setVolumeSpeaker(this.config.startSpeakerVolume)
        break
      case "VOLUME_GET":
        this.sendSocketNotification("VOLUMESPEAKER_LEVEL", this.level)
        break
      case "VOLUMESPEAKER_SET":
        this.setVolumeSpeaker(payload)
        break
      case "VOLUMESPEAKER_UP":
        this.upVolumeSpeaker()
        break
      case "VOLUMESPEAKER_DOWN":
        this.downVolumeSpeaker()
        break
      case "VOLUMERECORDER_SET":
        this.setVolumeRecorder(payload)
        break
      case "VOLUMERECORDER_UP":
        this.upVolumeRecorder()
        break
      case "VOLUMERECORDER_DOWN":
        this.downVolumeRecorder()
        break
    }
  },

  initialize: async function (config) {
    this.config = config
    if (this.config.debug) log = (...args) => { console.log("[VOLUME]", ...args) }
    this.lastSpeakerLevel = this.config.startSpeakerVolume
    this.lastRecorderLevel = this.config.startRecorderVolume
  },

  /** Volume control **/
  setVolumeSpeaker: function(level) {
    var volumeScript= this.config.myScript ? this.config.myScript : this.volumeSpeakerScript
    var script
    if (level == "mute" || level == "unmute") script = volumeScript.replace("#VOLUME#%", level)
    else script = volumeScript.replace("#VOLUME#", level)
    exec (script, (err, stdout, stderr)=> {
      if (err) {
        console.error("[VOLUME] Set Volume Error:", err.toString())
        this.sendSocketNotification("WARNING" , "VolumePresetError")
      }
      else {
        log("Set Speaker Volume To:", level)
        if (level == "mute" || level == "unmute") {
          this.sendSocketNotification("VOLUMESPEAKER_MUTE", (level == "mute") ? true : false)
          this.level.SpeakerIsMuted = (level == "mute") ? true : false
        } else {
          this.sendSocketNotification("VOLUMESPEAKER_DONE", level)
          this.level.Speaker = level
        }
        this.sendSocketNotification("VOLUMESPEAKER_LEVEL", this.level)
        log("Speaker is now", this.level)
      }
    })
  },

  upVolumeSpeaker: function() {
    var level = this.level.Speaker + 5
    if (level >= 100) level = 100
    this.setVolumeSpeaker(level)
  },

  downVolumeSpeaker: function () {
    var level = this.level.Speaker - 5
    if (level <= 0) level = 0
    this.setVolumeSpeaker(level)
  },
  
  setVolumeRecorder: function(level) {
    var volumeRecordScript= this.config.myRecorderScript ? this.config.myRecorderScript : this.volumeRecorderScript
    var script = volumeRecordScript.replace("#VOLUME#", level)
    exec (script, (err, stdout, stderr)=> {
      if (err) {
        console.error("[VOLUME] Set Record Volume Error:", err.toString())
        this.sendSocketNotification("WARNING" , "VolumeRecordPresetError")
      }
      else {
        log("Set Recorder Volume To:", level)
        this.sendSocketNotification("VOLUMERECORDER_DONE", level)
        this.level.Recorder = level
        this.sendSocketNotification("VOLUMESPEAKER_LEVEL", this.level)
      }
    })
  },

  upVolumeRecorder: function() {
    var level = this.level.Recorder + 5
    if (level >= 100) level = 100
    this.setVolumeRecorder(level)
  },

  downVolumeRecorder: function () {
    var level = this.level.Recorder - 5
    if (level <= 0) level = 0
    this.setVolumeRecorder(level)
  }
})
