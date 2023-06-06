/**
 ** Module : EXT-Volume
 ** @bugsounet
 ** ©04-2023
 ** support: https://forum.bugsounet.fr
 **/

Module.register("EXT-Volume", {
  defaults: {
    debug: false,
    startSpeakerVolume: 100,
    startRecorderVolume: 50,
    syncVolume: false
  },

  start: function () {
    if (this.config.startSpeakerVolume > 100) this.config.startSpeakerVolume = 100
    if (this.config.startSpeakerVolume < 0) this.config.startSpeakerVolume = 0
    if (this.config.startRecorderVolume > 100) this.config.startRecorderVolume = 100
    if (this.config.startRecorderVolume < 0) this.config.startRecorderVolume = 0
    this.currentLevel = {}
    this.oldLevel = {}
    this.ready = false
    this.VolumeDiplayer = new VolumeDisplayer(this.translate("VolumeText"))
  },

  getScripts: function() {
    return [ "/modules/EXT-Volume/components/VolumeDisplayer.js" ]
  },

  getStyles: function () {
    return [
      "EXT-Volume.css",
      "https://cdn.materialdesignicons.com/5.2.45/css/materialdesignicons.min.css"
    ]
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

  getDom: function() {
    var dom = document.createElement("div")
    dom.style.display = 'none'
    return dom
  },

  notificationReceived: function(noti, payload, sender) {
    if (noti == "GW_READY") {
      if (sender.name == "Gateway") {
        this.sendSocketNotification("INIT", this.config)
        this.VolumeDiplayer.prepare()
        this.ready = true
        this.sendNotification("EXT_HELLO", this.name)
        this.sendSocketNotification("INITIAL_VOLUME")
      }
    }
    if (!this.ready) return
    switch(noti) {
      case "EXT_VOLUME-SPEAKER_SET":
        let valueSPK = Number(payload)
        if ((!valueSPK && valueSPK != 0) || ((valueSPK < 0) || (valueSPK > 100))) return
        this.sendSocketNotification("VOLUMESPEAKER_SET", valueSPK)
        break
      case "EXT_VOLUME-SPEAKER_UP":
        this.sendSocketNotification("VOLUMESPEAKER_UP")
        break
      case "EXT_VOLUME-SPEAKER_DOWN":
        this.sendSocketNotification("VOLUMESPEAKER_DOWN")
        break
      case "EXT_VOLUME-SPEAKER_MUTE":
        if (payload) this.sendSocketNotification("VOLUMESPEAKER_SET", "mute")
        else this.sendSocketNotification("VOLUMESPEAKER_SET", "unmute")
        break
      case "EXT_VOLUME-RECORDER_SET":
        let valueREC = Number(payload)
        if ((!valueREC && valueREC != 0) || ((valueREC < 0) || (valueREC > 100))) return
        this.sendSocketNotification("VOLUMERECORDER_SET", valueREC)
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
        this.VolumeDiplayer.drawVolumeSpeaker(payload)
        break
      case "VOLUMERECORDER_DONE":
        this.VolumeDiplayer.drawVolumeRecorder(payload)
        break
      case "VOLUMESPEAKER_LEVEL":
        this.sendNotification("EXT_VOLUME_GET", payload)
        this.currentLevel = payload
        if (this.currentLevel.SpeakerIsMuted == true) {
          this.VolumeDiplayer.drawVolumeMuted()
        }
        if ((this.currentLevel.SpeakerIsMuted == false) && this.oldLevel.SpeakerIsMuted == true) {
          this.VolumeDiplayer.drawVolumeSpeaker(this.currentLevel.Speaker)
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

  EXT_TELBOTCommands: function(commander) {
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
  }
})
