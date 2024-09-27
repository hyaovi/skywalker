import { EVENT_NAMES, EventManager } from "./EventManager";
import { LooperCallbackType } from "../sharedTypes";

interface ILifecycles {
  init(): void;
  start(): void;
  update(delta: number): void;
  pause(): void;
  destroy(): void;
  resume(): void;
}

const globalEventManager = new EventManager();

export abstract class Base implements ILifecycles {
  inited: boolean;
  started: boolean;
  constructor() {
    this.inited = false;
    this.started = false;
  }
  init() {
    if (this.inited) return;
    this.inited = true;
  }
  start() {
    if (this.started) return;
    this.started = true;
  }
  update(_delta: number) {}
  destroy() {}
  pause() {}
  resume() {}
  broadcast = globalEventManager.emit.bind(globalEventManager);
  subscribe = globalEventManager.on.bind(globalEventManager);
  unsubscribe = globalEventManager.off.bind(globalEventManager);
  subscribeOnce = globalEventManager.once.bind(globalEventManager);
}

export class BaseComponent extends Base {
  id!: string;
  entityId!: string;
  independant: boolean = false;
  data: { [key: string]: any };
  readonly isBehavior: boolean;
  readonly componentType: string;
  constructor() {
    super();
    this.data = {};
    this.componentType = this.constructor.name;
    this.isBehavior = false;
  }
  destroy() {
    this.data = {};
  }
}

export class BaseEntity extends EventManager implements ILifecycles {
  inited: boolean;
  started: boolean;
  id!: string;
  isActive: boolean;

  protected components: Map<string, BaseComponent>;
  constructor() {
    super();
    this.inited = false;
    this.started = false;
    this.isActive = false;

    this.components = new Map();
  }
  // lifecycles methods
  init() {
    if (this.inited) return;
    this.emit("init");
    this.loopOverComponents((component) => component.init());
    this.inited = true;
  }
  start() {
    if (this.started) return;
    this.emit("start");
    this.started = true;
  }
  update(_delta: number) {
    this.loopOverComponents((component) => component.update(_delta));
    this.emit("update");
  }
  destroy() {
    this.loopOverComponents((component) => component.destroy());
    this.components.clear();
    this.emit("destroy");
  }
  pause() {
    this.loopOverComponents((component) => component.pause());
    this.emit("pause");
  }
  resume() {
    this.loopOverComponents((component) => component.resume());
    this.emit("resume");
  }

  // global events manager
  broadcast = globalEventManager.emit.bind(globalEventManager);
  subscribe = globalEventManager.on.bind(globalEventManager);
  unsubscribe = globalEventManager.off.bind(globalEventManager);
  subscribeOnce = globalEventManager.once.bind(globalEventManager);

  // components methods
  loopOverComponents(callback: (component: BaseComponent) => void) {
    for (const component of this.components.values()) {
      callback(component);
    }
  }
  addComponent(component: BaseComponent) {
    const componentId = this.components.size.toString();
    component.id = componentId;
    component.entityId = this.id;
    this.components.set(component.componentType, component);
    component.init();

    const { componentType } = component;
    this.broadcast(EVENT_NAMES.componentAddedToEntity, {
      componentId,
      componentType,
      entityId: this.id,
    });
  }
  getComponent(componentType: BaseComponent["componentType"]) {
    return this.components.get(componentType);
  }
  removeComponent(componentType: BaseComponent["componentType"]): boolean {
    const component = this.getComponent(componentType);
    if (component) {
      const { id: componentId, componentType } = component;
      this.broadcast(EVENT_NAMES.componentRemoveFromEntity, {
        componentId,
        componentType,
        entityId: this.id,
      });
      // destroy
      component.destroy();
      this.components.delete(component.componentType);

      return true;
    }
    return false;
  }
  hasComponentType(componentType: string) {
    return this.components.has(componentType);
  }
  getComponentTypes() {
    return [...this.components.keys()];
  }
  filterComponents(cb: (component: BaseComponent) => boolean) {
    return [...this.components.values()].filter(cb);
  }
}

export class System<EntityType extends BaseEntity> extends Base {
  id!: string;
  componentTypes: BaseComponent["componentType"][];
  entities!: EntityType[];
  getEntities!: () => EntityType[];
  getEntityById!: (entityId: EntityType["id"]) => EntityType | undefined;
  readonly systemType: string;

  constructor(componentsTypes?: string[]) {
    super();
    this.componentTypes = componentsTypes || [];
    this.systemType = this.constructor.name;
  }
  start() {
    if (this.inited) return;
    this.entities = this.getEntities();
    super.init();
    this.inited = true;
  }
}
export class BaseEntityManager<
  EntityType extends BaseEntity = BaseEntity
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
export class BaseSystemManager<EntityType extends BaseEntity> extends Base {
  systems: Map<string, System<EntityType>>;
  getEntityById!: (entityId: string) => EntityType | undefined;
  getEntitiesByComponentType!: (componentTypes: string[]) => EntityType[];
  constructor() {
    super();
    this.systems = new Map();
    this.resetSystems = this.resetSystems.bind(this);
    this.updateSystemsByComponentTypes =
      this.updateSystemsByComponentTypes.bind(this);
  }
  //   lifeclycles
  init(): void {
    if (this.inited) return;
    this.loopOverSystems((system) => system.init());

    // subscribe to events
    this.subscribe(EVENT_NAMES.entityAdded, this.resetSystems);
    this.subscribe(EVENT_NAMES.entityRemoved, this.resetSystems);
    this.subscribe(EVENT_NAMES.componentAddedToEntity, this.resetSystems);
    this.subscribe(EVENT_NAMES.componentRemoveFromEntity, this.resetSystems);

    this.inited = true;
  }
  start(): void {
    if (this.started) return;
    this.loopOverSystems((system) => system.start());
    this.started = true;
  }
  update(delta: number): void {
    this.loopOverSystems((system) => system.update(delta));
  }
  destroy(): void {
    this.loopOverSystems((system) => system.destroy());
    this.systems.clear();

    // unsubscribe to events
    this.unsubscribe(EVENT_NAMES.entityAdded, this.resetSystems);
    this.unsubscribe(EVENT_NAMES.entityRemoved, this.resetSystems);
    this.unsubscribe(EVENT_NAMES.componentAddedToEntity, this.resetSystems);
    this.unsubscribe(EVENT_NAMES.componentRemoveFromEntity, this.resetSystems);
  }
  pause(): void {
    this.loopOverSystems((system) => system.pause());
  }
  resume(): void {
    this.loopOverSystems((system) => system.resume());
  }
  // systems related methods
  loopOverSystems(callback: (system: System<EntityType>) => void) {
    for (const system of this.systems.values()) {
      callback(system);
    }
  }

  addSystem(system: System<EntityType>) {
    if (this.systems.has(system.systemType)) return;
    const { systemType, componentTypes } = system;
    const eventData = { systemType, componentTypes, systemId: "" };
    this.broadcast(EVENT_NAMES.systemAdding, eventData);
    const systemId = this.systems.size.toString();
    eventData.systemId = systemId;
    system.id = systemId;
    system.init();
    this.systems.set(system.systemType, system);
    this.broadcast(EVENT_NAMES.systemAdded, eventData);
    this.resetSystem(system);
    system.start();
  }
  getSystem(systemType: string) {
    return this.systems.get(systemType);
  }
  removeSystem(systemType: string) {
    const system = this.getSystem(systemType);
    if (system) {
      const { systemType, id: systemId, componentTypes } = system;
      const eventData = { systemType, componentTypes, systemId };
      this.broadcast(EVENT_NAMES.systemRemoving, eventData);
      system.destroy();
      this.systems.delete(system.systemType);
      this.broadcast(EVENT_NAMES.systemRemoved, eventData);
    }
  }
  resetSystem(system: System<EntityType>) {
    if (!system.getEntities) {
      system.getEntities = () =>
        this.getEntitiesByComponentType(system.componentTypes);
    }
    if (!system.getEntityById) {
      system.getEntityById = this.getEntityById;
    }
    system.entities = system.getEntities();
    this.broadcast(EVENT_NAMES.systemsUpdated);
  }
  resetSystems() {
    this.loopOverSystems((system) => this.resetSystem(system));
    this.broadcast(EVENT_NAMES.systemsUpdated);
  }
  updateSystemsByComponentTypes(componentTypes: string[]) {
    this.loopOverSystems((system) => {
      const hasComponentType = componentTypes.some((componentType) =>
        system.componentTypes.includes(componentType)
      );
      if (hasComponentType) {
        this.resetSystem(system);
      }
    });
  }

  // setup listeners
}
export class Looper {
  delta: number = 0;
  now: number = performance.now();
  time: number = 0;
  loopCallback!: LooperCallbackType;
  rfId?: number = 0;

  constructor() {
    this.delta = 0;
    this.now = performance.now();
    this.time = 0;
    this.rfId = undefined;

    this.loop = this.loop.bind(this);
  }
  startLoop(arrowCallback: LooperCallbackType) {
    this.loopCallback = arrowCallback;
    this.rfId = requestAnimationFrame(this.loop);
  }
  loop() {
    const now = performance.now();
    this.delta = now - this.now;
    this.loopCallback?.(this.delta);
    this.time += this.delta;
    this.now = now;
    this.rfId = requestAnimationFrame(this.loop);
  }
  stopLoop() {
    if (this.rfId) {
      cancelAnimationFrame(this.rfId);
      this.rfId = undefined;
    }
  }
}
export class BaseEngine<
    EntityType extends BaseEntity = BaseEntity,
    EntityManagertype extends BaseEntityManager<EntityType> = BaseEntityManager<EntityType>,
    SystemManagerType extends BaseSystemManager<EntityType> = BaseSystemManager<EntityType>
  >
  extends Base
  implements ILifecycles
{
  systemManager: SystemManagerType;
  entityManager: EntityManagertype;
  looper: Looper = new Looper();
  constructor(
    entityManager: EntityManagertype,
    systemManager: SystemManagerType
  ) {
    super();
    this.systemManager = systemManager;
    this.entityManager = entityManager;
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
    this.broadcast(EVENT_NAMES.engineInited);
  }
  start() {
    if (this.started) return;
    this.entityManager.start();
    this.systemManager.start();
    this.looper.startLoop((delta: number) => this.update(delta));
    this.broadcast(EVENT_NAMES.engineStarted);

    this.started = true;
  }
  update(delta: number): void {
    this.entityManager.update(delta);
    this.systemManager.update(delta);
    this.broadcast(EVENT_NAMES.engineUpdate, delta);
  }
  destroy(): void {
    this.looper.stopLoop();
  }
  get events() {
    return globalEventManager.events;
  }
  get context() {
    const { getEntityById, createEntity } = this.entityManager;
    return {
      getEntityById,
      createEntity,
    };
  }
}