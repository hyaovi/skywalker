import * as THREE from "three";
import {
  BaseComponent,
  BaseEngine,
  BaseEntity,
  BaseEntityManager,
  BaseSystemManager,
  System,
} from "../BaseEcs";
import { EVENT_NAMES } from "../BaseEcs/EventManager";
import { createPrimitiveMesh, makeHelper } from "./ObjectFactory";
import { Object3DType } from "../sharedTypes";

export class Entity extends BaseEntity {
  isInteractive: boolean;
  object3d: Object3DType;
  helper!: THREE.BoxHelper;
  isOnScene: boolean;
  constructor() {
    super();
    this.isInteractive = true;
    this.isOnScene = false;
    this.object3d = createPrimitiveMesh({ type: "box" });
    // this.helper = makeHelper(this.object3d);
  }
  // 3d object methods
  setObject3D(object: THREE.Object3D) {
    this.object3d = object;
  }
}

export class SystemManager extends BaseSystemManager<Entity> {}
export class EntityManager extends BaseEntityManager<Entity> {
  createEntity(): Entity {
    const entity = new Entity();
    return this.addEntity(entity);
  }
  init(): void {
    if (this.inited) return;
    this.subscribe(EVENT_NAMES.entityClicked, (data: { entityId: string }) => {
      const { entityId } = data;
      const entity = this.getEntityById(entityId);
      entity?.emit(EVENT_NAMES.click);
    });
    super.init();
  }
  activateEntity(_entity: Entity) {
    const entity = this.getEntityById(_entity.id);
    if (entity) {
      this.broadcast(EVENT_NAMES.entityActivate, { entityId: entity.id });
      entity.isActive = true;
      entity.start();
    }
  }
  getObjects3d() {
    return this.filterEntities((entity) => {
      return entity.isInteractive && entity.object3d !== undefined;
    }).map((entity) => entity.object3d);
  }
  protected removeEntity(_entity: Entity): void {
    const entity = this.getEntityById(_entity.id);
    if (entity?.isOnScene) {
      this.broadcast("viewport-remove-entity", { entityId: entity.id });
    }
    super.removeEntity(_entity);
  }
}

export { BaseEngine };
