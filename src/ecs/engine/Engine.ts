import {
  defaultViewportSetting,
  IViewportParams,
  ViewportSystem,
} from "../systems";
import { EVENT_NAMES, globalEventManager } from "../base/EventManager";
import { Base, Loop } from "../base";
import { ILifecycles } from "../sharedTypes";
import { EntityManager, SystemManager } from "../managers";

interface IEngineSettings {
  viewport?: IViewportParams;
}
const defaultEngineSettings: IEngineSettings = {
  viewport: defaultViewportSetting,
};
export class Engine extends Base implements ILifecycles {
  viewport: ViewportSystem;
  systemManager: SystemManager;
  entityManager: EntityManager;
  loop: Loop = new Loop();
  readonly settings: IEngineSettings;
  constructor(settings?: IEngineSettings) {
    super();
    this.systemManager = new SystemManager();
    this.entityManager = new EntityManager();
    this.settings = settings || defaultEngineSettings;

    this.viewport = new ViewportSystem(this.settings.viewport);
    this.viewport.getObjects = this.entityManager.getObjects3d.bind(
      this.entityManager
    );
  }
  init(): void {
    if (this.inited) return;
    this.systemManager.getEntityById = (entityId: string) =>
      this.entityManager.getEntityById(entityId);

    this.systemManager.getEntitiesByComponentType = (
      componentTypes: string[]
    ) => this.entityManager.getEntitiesByComponentType(componentTypes);

    this.entityManager.init();
    this.systemManager.init();

    this.systemManager.addSystem(this.viewport);

    this.inited = true;
    this.broadcast(EVENT_NAMES.engineInited);
  }
  start(): void {
    if (this.started) return;
    this.entityManager.start();
    this.systemManager.start();
    this.loop.start((delta: number) => this.update(delta));

    this.started = true;
    this.broadcast(EVENT_NAMES.engineStarted);
  }
  update(delta: number): void {
    this.entityManager.update(delta);
    this.systemManager.update(delta);
    this.broadcast(EVENT_NAMES.engineUpdate, delta);
  }
  destroy(): void {
    this.loop.stop();
  }
  run():void{
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
    const { activateEntity, getEntityById, createEntity } = this.entityManager;

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
  get events(){
    return globalEventManager.events
  }
}
