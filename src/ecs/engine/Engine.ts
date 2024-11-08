import { Base, Loop } from "../base";
import { EVENT_NAMES, globalEventManager } from "../base/EventManager";
import { manager } from "../managers";
import type { ILifecycles } from "../sharedTypes";
import {
  type IViewportParams,
  InteractableSystem,
  ViewportSystem,
  defaultViewportSetting,
} from "../systems";

interface IEngineSettings {
  viewport?: IViewportParams;
}
const defaultEngineSettings: IEngineSettings = {
  viewport: defaultViewportSetting,
};
export class Engine extends Base implements ILifecycles {
  manager = manager;
  viewport!: ViewportSystem;
  loop: Loop = new Loop();
  readonly settings: IEngineSettings;
  constructor(settings?: IEngineSettings) {
    super();
    this.settings = settings || defaultEngineSettings;
  }
  init(): void {
    if (this.inited) return;
    this.manager.init();

    this.viewport = this.manager.addSystem(new ViewportSystem());
    const { scene, camera, renderer } = this.viewport;
    this.manager.addSystem(new InteractableSystem({ scene, renderer, camera }));

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    (window as any).ii = this.manager.getSystem(InteractableSystem);

    this.inited = true;
    this.broadcast(EVENT_NAMES.engineInited);
  }
  start(): void {
    if (this.started) return;
    this.manager.start();
    this.loop.start((delta: number, time:number) => this.update(delta, time));

    this.started = true;
    this.broadcast(EVENT_NAMES.engineStarted);
  }
  update(delta: number, time:number): void {
    this.manager.update(delta, time);
    this.broadcast(EVENT_NAMES.engineUpdate, {delta,time});
  }
  destroy(): void {
    this.loop.stop();
  }
  run(): void {
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
    const { activateEntity, getEntityById, createEntity } = this.manager;

    return {
      scene,
      renderer,
      camera,
      orbit,
      transform,
      mixer,
      activateEntity,
      getEntityById,
      createEntity,
    };
  }
  get events() {
    return globalEventManager.events;
  }
}
