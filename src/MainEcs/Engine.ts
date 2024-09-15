import { EventActionSystem } from "./EventActionSystem";
import { BaseEngine, Entity, EntityManager, SystemManager } from ".";
import { ViewportSystem } from "./ViewportSystem";

export class Engine extends BaseEngine<Entity, EntityManager, SystemManager> {
  viewport: ViewportSystem;
  constructor() {
    super(new EntityManager(), new SystemManager());
    this.viewport = new ViewportSystem();

    this.viewport.getObjects = this.entityManager.getObjects3d.bind(
      this.entityManager
    );
  }
  init(): void {
    if (this.inited) return;
    super.init();
    this.systemManager.addSystem(this.viewport);

    const actionSystem = new EventActionSystem();
    this.systemManager.addSystem(actionSystem);
    this.inited = true;
  }
}
