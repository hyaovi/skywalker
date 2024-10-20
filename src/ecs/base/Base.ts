import { globalEventManager } from "./EventManager";
import { ILifecycles } from "../sharedTypes";

export abstract class Base implements ILifecycles {
    inited: boolean;
    started: boolean;
    constructor() {
      this.inited = false;
      this.started = false;
    }
    init() {
      if (this.inited) return;
      this.inited = true;
    }
    start() {
      if (this.started) return;
      this.started = true;
    }
    update(_delta: number) {}
    destroy() {}
    pause() {}
    resume() {}
    broadcast = globalEventManager.emit.bind(globalEventManager);
    subscribe = globalEventManager.on.bind(globalEventManager);
    unsubscribe = globalEventManager.off.bind(globalEventManager);
    subscribeOnce = globalEventManager.once.bind(globalEventManager);
  }