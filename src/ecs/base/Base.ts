import type { ILifecycles } from "../sharedTypes";
import { globalEventManager } from "./EventManager";

export abstract class Base implements ILifecycles {
  inited: boolean;
  started: boolean;
  needsUpdateCalls: boolean;
  constructor() {
    this.inited = false;
    this.started = false;
    this.needsUpdateCalls = false;
  }
  init() {}
  start() {}
  update(_delta: number) {}
  destroy() {}
  pause() {}
  resume() {}
  broadcast = globalEventManager.emit.bind(globalEventManager);
  subscribe = globalEventManager.on.bind(globalEventManager);
  unsubscribe = globalEventManager.off.bind(globalEventManager);
  subscribeOnce = globalEventManager.once.bind(globalEventManager);
}
