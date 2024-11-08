import type { LooperCallbackType } from "../sharedTypes";

export class Loop {
  delta = 0;
  now: number = performance.now();
  time = 0;
  loopCallback!: LooperCallbackType;
  rfId?: number = 0;

  constructor() {
    this.delta = 0;
    this.now = performance.now();
    this.time = 0;
    this.rfId = undefined;

    this.loop = this.loop.bind(this);
  }
  start(arrowCallback: LooperCallbackType) {
    this.loopCallback = arrowCallback;
    this.rfId = requestAnimationFrame(this.loop);
  }
  private loop() {
    const now = performance.now();
    this.delta = now - this.now;
    this.loopCallback?.(this.delta);
    this.time += this.delta;
    this.now = now;
    this.rfId = requestAnimationFrame(this.loop);
  }
  stop() {
    if (this.rfId) {
      cancelAnimationFrame(this.rfId);
      this.rfId = undefined;
    }
  }
}
