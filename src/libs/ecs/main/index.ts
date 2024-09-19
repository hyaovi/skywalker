import * as THREE from "three";
import {
  BaseComponent,
  BaseEngine,
  BaseEntity,
  BaseEntityManager,
  BaseSystemManager,
} from "../base";
import { EVENT_NAMES } from "../base/EventManager";
import { createPrimitiveMesh } from "./ObjectFactory";
import { Object3DType, ObjectHelperType } from "../sharedTypes";
import { pointerEvents } from "./ViewportSystem";

export class Entity extends BaseEntity {
  isInteractive: boolean;
  object3d: Object3DType;
  helper!: ObjectHelperType;
  isOnScene: boolean;
  constructor(object3d?: Object3DType) {
    super();
    this.isInteractive = true;
    this.isOnScene = false;
    this.object3d = object3d || createPrimitiveMesh({ type: "box" });
    // this.makeHelper();
  }
  // 3d object methods
  setObject3D(object: THREE.Object3D) {
    this.object3d = object;
  }
}

export abstract class Behavior extends BaseComponent {
  static isBehavior: boolean = true;
  onClick() {
    throw new Error(`onClick method is not implmented`);
  }
  onPointerDown() {
    throw new Error(`onPointerDown method is not implmented`);
  }
  onPointerUp() {
    throw new Error(`onPointerUp method is not implmented`);
  }
  onPointerOver() {
    throw new Error(`onPointerOver method is not implmented`);
  }
}

export class SystemManager extends BaseSystemManager<Entity> {}
export class EntityManager extends BaseEntityManager<Entity> {
  createEntity(object?: Object3DType): Entity {
    const entity = new Entity(object);
    return this.addEntity(entity);
  }
  init(): void {
    if (this.inited) return;
    pointerEvents.forEach((pointerEventName) => {
      this.subscribe(
        `entity-${pointerEventName}`,
        (data: { entityId: string }) => {
          const { entityId } = data;
          const entity = this.getEntityById(entityId);
          entity?.emit(pointerEventName);
        }
      );
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
