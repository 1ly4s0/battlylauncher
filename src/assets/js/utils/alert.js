"use strict";

class Alert {
  constructor(defaultOptions = {}) {
    this.defaults = {
      effect: "slide",
      speed: 300,
      showIcon: true,
      showCloseButton: false,
      autoclose: true,
      autotimeout: 5000,
      notificationsGap: null,
      notificationsPadding: null,
      type: "outline",
      position: "x-center",
      customClass: "",
      customIcon: "",
      customWrapper: "",
      soundSrc: "./assets/audios/alert.mp3",
      soundVolume: 0.8
    };

    this.defaults = { ...this.defaults, ...defaultOptions };
  }

  async ShowAlert(info = {}) {
    if (!window.Notify) {
      console.error("[Alert] Simple Notify no está disponible. Asegúrate de cargar la librería antes de usar Alert.");
      return;
    }

    const status = this.#normalizeStatus(info.icon);

    const payload = {
      status,
      title: info.title ?? "",
      text: info.text ?? "",
      effect: info.effect ?? this.defaults.effect,
      speed: info.speed ?? this.defaults.speed,
      customClass: info.customClass ?? this.defaults.customClass,
      customIcon: info.customIcon ?? this.defaults.customIcon,
      showIcon: typeof info.showIcon === "boolean" ? info.showIcon : this.defaults.showIcon,
      showCloseButton: typeof info.showCloseButton === "boolean" ? info.showCloseButton : this.defaults.showCloseButton,
      autoclose: typeof info.autoclose === "boolean" ? info.autoclose : this.defaults.autoclose,
      autotimeout: typeof info.autotimeout === "number" ? info.autotimeout : this.defaults.autotimeout,
      notificationsGap: info.notificationsGap ?? this.defaults.notificationsGap,
      notificationsPadding: info.notificationsPadding ?? this.defaults.notificationsPadding,
      type: info.type ?? this.defaults.type,
      position: info.position ?? this.defaults.position,
      customWrapper: info.customWrapper ?? this.defaults.customWrapper
    };

    const soundSrc = typeof info.soundSrc === "string" ? info.soundSrc : this.defaults.soundSrc;
    if (soundSrc) {
      try {
        const audio = new Audio(soundSrc);
        audio.volume = typeof info.soundVolume === "number" ? info.soundVolume : this.defaults.soundVolume;
        audio.play().catch(() => { });
      } catch { }
    }

    new Notify(payload);
  }

  #normalizeStatus(icon) {
    switch ((icon || "info").toLowerCase()) {
      case "success": return "success";
      case "error": return "error";
      case "warning": return "warning";
      case "info":
      default: return "info";
    }
  }
}

export { Alert };
