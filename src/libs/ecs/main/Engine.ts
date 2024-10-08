import { BaseEngine, Entity, EntityManager, SystemManager } from ".";
import {
  defaultViewportSetting,
  IViewportParams,
  ViewportSystem,
} from "./ViewportSystem";
import { EVENT_NAMES } from "../base/EventManager";
import { MotionSystem } from "./MotionSystem";

interface IEngineSettings {
  viewport?: IViewportParams;
}
const defaultEngineSettings: IEngineSettings = {
  viewport: defaultViewportSetting,
};
export class Engine extends BaseEngine<Entity, EntityManager, SystemManager> {
  viewport: ViewportSystem;
  motion:MotionSystem;
  constructor(settings?: IEngineSettings) {
    super(new EntityManager(), new SystemManager());
    this.viewport = new ViewportSystem(settings?.viewport);
    this.motion = new MotionSystem();
    this.viewport.getObjects = this.entityManager.getObjects3d.bind(
      this.entityManager
    );

  }
  init(): void {
    if (this.inited) return;
    super.init();
    this.systemManager.addSystem(this.viewport);
    this.motion = new MotionSystem();
    this.systemManager.addSystem(this.motion)
    this.inited = true;
    this.broadcast(EVENT_NAMES.engineInited);
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
    const {
      scene,
      renderer,
      camera,
      mixer,
      controls: { transform, orbit },
    } = this.viewport;
    const { activateEntity } = this.entityManager;
    return {
      scene,
      renderer,
      camera,
      orbit,
      transform,
      mixer,
      activateEntity,
      ...super.context,
    };
  }
}