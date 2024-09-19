import { BaseEngine, Entity, EntityManager, SystemManager } from ".";
import { ViewportSystem } from "./ViewportSystem";
import { EVENT_NAMES } from "../base/EventManager";

export class Engine extends BaseEngine<Entity, EntityManager, SystemManager> {
  viewport: ViewportSystem;
  constructor() {
    super(new EntityManager(), new SystemManager());
    this.viewport = new ViewportSystem({
      useShadow: false,
      useTransformControls: false,
      useHelper: false,
    });

    this.viewport.getObjects = this.entityManager.getObjects3d.bind(
      this.entityManager
    );
  }
  init(): void {
    if (this.inited) return;
    super.init();
    this.systemManager.addSystem(this.viewport);
    this.inited = true;
    this.broadcast(EVENT_NAMES.engineInited)
  }
  start(): void {
    if (this.started) return;
    super.start();
    this.started = true;
    this.broadcast(EVENT_NAMES.engineStarted);
  }
  run() {
    this.init();
    this.start();
  }
  get context() {
    const superContext = super.context;
    const {
      scene,
      renderer,
      camera,
      controls: { transform, orbit },
    } = this.viewport;
    return {
      scene,
      renderer,
      camera,
      orbit,
      transform,
      ...superContext,
    };
  }
}
