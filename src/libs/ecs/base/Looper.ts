import { LooperCallbackType } from "../sharedTypes";

export class Looper {
    delta: number = 0;
    now: number = performance.now();
    time: number = 0;
    loopCallback!: LooperCallbackType;
    rfId?: number = 0;
  
    constructor() {
      this.delta = 0;
      this.now = performance.now();
      this.time = 0;
      this.rfId = undefined;
  
      this.loop = this.loop.bind(this);
    }
    startLoop(arrowCallback: LooperCallbackType) {
      this.loopCallback = arrowCallback;
      this.rfId = requestAnimationFrame(this.loop);
    }
    loop() {
      const now = performance.now();
      this.delta = now - this.now;
      this.loopCallback?.(this.delta);
      this.time += this.delta;
      this.now = now;
      this.rfId = requestAnimationFrame(this.loop);
    }
    stopLoop() {
      if (this.rfId) {
        cancelAnimationFrame(this.rfId);
        this.rfId = undefined;
      }
    }
  }