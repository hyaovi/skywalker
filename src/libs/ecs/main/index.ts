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
import { pointerEvents, pointerEventsType } from "./ViewportSystem";

export class Behavior extends BaseComponent {
  readonly isBehavior: boolean;
  eventType?: pointerEventsType;
  _action!: <T>(args: T) => void;
  constructor(eventType?: pointerEventsType, action?: Behavior["_action"]) {
    super();
    this.isBehavior = true;
    if (eventType) this.eventType = eventType;
    if (action) this._action = action;
    this.action = this.action.bind(this);
  }

  action(args: any) {
    if (this._action) {
      this._action(args);
      return;
    }
    throw new Error(`The "action" method is not implemented!`);
  }
}

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

  addComponent(component: BaseComponent | Behavior) {
    super.addComponent(component);
    if (component.isBehavior) {
      const { eventType, action } = component as Behavior;
      if (eventType) {
        this.on(eventType, action);
      }
    }
  }
  addBehavior(event: pointerEventsType, action: Behavior["_action"]) {
    const behavior = new Behavior(event, action);
    this.addComponent(behavior);
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
        (data: { entityId: string; event: PointerEvent | MouseEvent }) => {
          const { entityId, event } = data;
          const entity = this.getEntityById(entityId);
          entity?.emit(pointerEventName, { event });
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
