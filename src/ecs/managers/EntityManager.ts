import { EVENT_NAMES } from "../base/EventManager";
import { Object3DType } from "../sharedTypes";
import { BaseEntity, Entity } from "../entities";
import { pointerEvents } from "../systems/ViewportSystem";
import { Base } from "../base";

export class BaseEntityManager<
  EntityType extends BaseEntity = Entity
> extends Base {
  entities: Map<string, EntityType>;
  constructor() {
    super();
    this.entities = new Map();

    this.getEntitiesByComponentType =
      this.getEntitiesByComponentType.bind(this);
    this.getEntityById = this.getEntityById.bind(this);
    this.createEntity = this.createEntity.bind(this);
    this.addEntity = this.addEntity.bind(this);
  }
  //   lifeclycles
  init(): void {
    if (this.inited) return;
    this.loopOverEntities((entity) => entity.init());
    this.inited = true;
  }
  start(): void {
    if (this.started) return;
    this.loopOverEntities((entity) => entity.start());
    this.started = true;
  }
  update(delta: number): void {
    this.loopOverEntities((entity) => entity.update(delta));
  }
  destroy(): void {
    this.loopOverEntities((entity) => entity.destroy());
    this.entities.clear();
  }
  pause(): void {
    this.loopOverEntities((entity) => entity.pause());
  }
  resume(): void {
    this.loopOverEntities((entity) => entity.resume());
  }
  //   entity related methods
  createEntity(): EntityType {
    throw new Error(`Method "createEntity" must be implmented by super class`);
  }
  addEntity(entity: EntityType): EntityType {
    if (entity.id && this.entities.has(entity.id)) return entity;
    const entityId = this.entities.size.toString();
    entity.init();
    this.broadcast(EVENT_NAMES.entityAdding, { entityId, entity });
    entity.id = entityId;
    this.entities.set(entity.id, entity);
    const componentsTypes = entity.getComponentTypes();
    this.broadcast(EVENT_NAMES.entityAdded, {
      entityId,
      componentsTypes,
    });
    entity.start();
    return entity;
  }
  protected removeEntity(entity: EntityType) {
    const entityId = entity.id;
    if (!this.entities.has(entityId)) return;
    this.broadcast(EVENT_NAMES.entityRemoving, { entityId });
    entity.destroy();
    entity.id = "";
    this.entities.delete(entityId);
    this.broadcast(EVENT_NAMES.entityRemoved, { entityId });
  }
  getEntityById(entityId: EntityType["id"]) {
    return this.entities.get(entityId);
  }
  loopOverEntities(callback: (entity: EntityType) => void) {
    for (const entity of this.entities.values()) {
      callback(entity);
    }
  }
  getEntitiesByComponentType(componentTypes: string[]): EntityType[] {
    const entities: EntityType[] = [];
    this.loopOverEntities((entity) => {
      componentTypes.forEach((componentType) => {
        if (entity.hasComponentType(componentType) || componentType === "*") {
          entities.push(entity);
        }
      });
    });
    return entities;
  }
  filterEntities(cb: (entity: EntityType) => boolean) {
    return [...this.entities.values()].filter(cb);
  }
}

export class EntityManager extends BaseEntityManager {
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
        return entity.isInteractive && entity.sceneObject !== undefined;
      }).map((entity) => entity.sceneObject);
    }
    protected removeEntity(_entity: Entity): void {
      const entity = this.getEntityById(_entity.id);
      if (entity?.isOnScene) {
        this.broadcast("viewport-remove-entity", { entityId: entity.id });
      }
      super.removeEntity(_entity);
    }
  }