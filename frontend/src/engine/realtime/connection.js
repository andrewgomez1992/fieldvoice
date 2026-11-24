import { getRealtimeKey } from "../../components/chat/api/chatApi";

/**
 * A live speech-to-speech connection to OpenAI's Realtime API over WebRTC.
 * Audio flows directly between the phone and OpenAI; events (tool calls,
 * transcripts, errors) come through a data channel.
 */
export class RealtimeConnection {
  constructor({ onEvent = () => {}, onClose = () => {} } = {}) {
    this.onEvent = onEvent;
    this.onClose = onClose;
    this.pc = null;
    this.dc = null;
    this.mic = null;
    this.audioEl = null;
    this.closed = false;
    this.model = null;
  }

  /**
   * Open the session. Call from inside a tap so audio playback is allowed.
   * Resolves once the data channel is open.
   */
  async connect() {
    // Create the speaker element during the tap (needed on iPhone).
    const audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    audioEl.setAttribute("playsinline", "");
    this.audioEl = audioEl;

    const micPromise = navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });

    const [{ value: key, model }, mic] = await Promise.all([getRealtimeKey(), micPromise]);
    this.model = model;
    this.mic = mic;
    if (this.closed) return this.cleanup();

    const pc = new RTCPeerConnection();
    this.pc = pc;
    pc.ontrack = (e) => {
      audioEl.srcObject = e.streams[0];
      audioEl.play().catch(() => {});
    };
    pc.onconnectionstatechange = () => {
      if (["failed", "closed"].includes(pc.connectionState) && !this.closed) {
        this.close(new Error("The voice connection dropped."));
      }
    };
    pc.addTrack(mic.getTracks()[0], mic);

    const dc = pc.createDataChannel("oai-events");
    this.dc = dc;
    const opened = new Promise((resolve, reject) => {
      dc.onopen = resolve;
      setTimeout(() => reject(new Error("Timed out connecting to the voice service.")), 15000);
    });
    dc.onmessage = (e) => {
      try {
        this.onEvent(JSON.parse(e.data));
      } catch (err) {
        console.error("Bad realtime event:", err);
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const r = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      body: offer.sdp,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/sdp" },
    });
    if (!r.ok) {
      let body = {};
      try {
        body = await r.json();
      } catch {
        /* not JSON */
      }
      throw Object.assign(new Error(body.error?.message || `Voice service error ${r.status}`), {
        status: r.status,
        code: body.error?.code || body.error?.type,
      });
    }
    await pc.setRemoteDescription({ type: "answer", sdp: await r.text() });
    await opened;
  }

  send(event) {
    if (this.dc?.readyState === "open") this.dc.send(JSON.stringify(event));
  }

  /** Mute/unmute the phone's mic (e.g. while talking to the homeowner). */
  setMicEnabled(enabled) {
    this.mic?.getTracks().forEach((t) => (t.enabled = enabled));
  }

  cleanup() {
    try {
      this.dc?.close();
    } catch {
      /* already closed */
    }
    try {
      this.pc?.close();
    } catch {
      /* already closed */
    }
    this.mic?.getTracks().forEach((t) => t.stop());
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.srcObject = null;
    }
  }

  close(reason) {
    if (this.closed) return;
    this.closed = true;
    this.cleanup();
    this.onClose(reason);
  }
}
