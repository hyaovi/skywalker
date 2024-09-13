import * as THREE from "three";
import { EventManager, EVENT_NAMES } from "./EventManager";
import { createPrimitiveMesh } from "./ObjectFactory";
import { OrbitControls, TransformControls } from "three/examples/jsm/Addons.js";
import { createAnchor } from "./utils";

type EntityMapType = Map<string, Entity>;
type SystemMapType = Map<string, System>;
type ComponentMapType = Map<string, BaseComponent>;
type ObjectType = THREE.Mesh | THREE.Light | THREE.Object3D;

let eventManager = new EventManager();

abstract class Base {
  protected eventManager = eventManager;

  constructor() {}
  init() {}
  start() {}
  update(_delta: number) {}
  destroy() {}
  pause() {}
  resume() {}
}
export class BaseComponent extends Base {
  readonly componentType: string;
  id!: string;
  entityId!: Entity["id"];
  inited: boolean;
  independant: boolean = false;
  data: { [key: string]: any };
  constructor() {
    super();
    this.data = {};
    this.inited = false;
    this.componentType = this.constructor.name;
  }

  init() {
    if (this.inited) return;
    this.inited = true;
  }
  destroy() {
    this.data = {};
  }
}

abstract class AbstractBaseEntity extends EventManager {
  id!: string;
  eventManager = eventManager;
  inited: boolean;
  started: boolean;
  protected componentsMap: ComponentMapType;
  constructor() {
    super();
    this.inited = false;
    this.started = false;
    this.componentsMap = new Map();
  }

  // lifecycles methods
  init() {
    if (this.inited) return;
    this.inited = true;
    this.loopOverComponents((component) => {
      component.init();
    });

    this.emit("init");
  }
  start() {
    if (this.started) return;
    this.started = true;

    this.loopOverComponents((component) => {
      component.start();
    });

    this.emit("start");
  }
  update(_delta: number) {}
  destroy() {
    this.loopOverComponents((component) => {
      component.destroy();
    });
    this.componentsMap.clear();

    this.emit("destroy");
  }
  pause() {
    this.emit("pause");
  }
  resume() {
    this.emit("resume");
  }
  // components functionality
  addComponent(component: BaseComponent) {
    const componentId = this.componentsMap.size.toString();
    component.id = componentId;
    component.entityId = this.id;
    this.componentsMap.set(component.componentType, component);
    component.init();

    const { componentType } = component;
    this.notify(EVENT_NAMES.componentAddedToEntity, {
      componentId,
      componentType,
    });
  }
  getComponent(componentType: BaseComponent["componentType"]) {
    return this.componentsMap.get(componentType);
  }
  removeComponent(componentType: BaseComponent["componentType"]): boolean {
    const component = this.getComponent(componentType);
    if (component) {
      const { id: componentId, componentType } = component;
      // notify
      this.notify(EVENT_NAMES.componentRemoveFromEntity, {
        componentId,
        componentType,
      });
      // destroy
      component.destroy();
      this.componentsMap.delete(component.componentType);

      return true;
    }
    return false;
  }
  // utils
  protected notify(eventType: string, data = {}) {
    const entityId = this.id;
    data = { ...data, entityId };
    this.eventManager.emit(eventType, data);
  }
  loopOverComponents(callback: (component: BaseComponent) => void) {
    for (const component of this.componentsMap.values()) {
      callback(component);
    }
  }
}

export class Entity extends AbstractBaseEntity {
  object3d!: ObjectType;
  helper!: THREE.Object3D;
  isInteractive = true;
  isOnScene = false;

  constructor(object3d?: ObjectType) {
    super();
    this.object3d = object3d || createPrimitiveMesh({ type: "box" });
  }
  setObject3d(object: ObjectType) {
    this.object3d = object;
  }

  protected getOrCreateActionComponent(): ActionComponent {
    if (!this.componentsMap.has(ActionComponent.name)) {
      const actionComponent = new ActionComponent();
      this.addComponent(actionComponent);
    }
    return this.getComponent(ActionComponent.name) as ActionComponent;
  }

  addEventAction(action: ActionData) {
    const actionComponent = this.getOrCreateActionComponent();
    actionComponent?.data.actions.push(action);
    this.notify(EVENT_NAMES.componentAddedToEntity, { entityId: this.id });
  }
}

abstract class BaseSystem extends Base {
  inited: boolean;
  componentTypes: BaseComponent["componentType"][];
  entities!: Entity[];
  getEntities!: () => Entity[];
  getEntityById!: (entityId: Entity["id"]) => Entity | undefined;
  id!: string;
  readonly systemType: string;
  constructor(componentsTypes?: string[]) {
    super();
    this.componentTypes = componentsTypes || [];
    this.inited = false;
    this.systemType = this.constructor.name;
  }
  init() {
    if (this.inited) return;
    this.inited = true;
  }
  start() {}
}
export class System extends BaseSystem {}
abstract class BaseEntityManager extends Base {
  entities: EntityMapType;
  constructor(entities: EntityMapType) {
    super();
    // bindings
    this.getEntityObject3d = this.getEntityObject3d.bind(this);

    this.entities = entities;
  }
  getEntitiesComponentByType(types: string[]): Entity[] {
    const entities: Entity[] = [];
    for (const entity of this.entities.values()) {
      types.forEach((componentType) => {
        const component = entity.getComponent(componentType);
        if (component) {
          entities.push(entity);
        }
      });
    }
    return entities;
  }
  createEntity() {
    const entity = new Entity();
    return entity;
  }
  addEntity(entity: Entity) {
    if (entity.id && this.entities.has(entity.id)) return;
    const entityId = this.entities.size.toString();
    this.notify(EVENT_NAMES.entityAdding, { entityId, entity });
    entity.id = entityId;

    this.entities.set(entity.id, entity);
    this.notify(EVENT_NAMES.entityAdded, { entityId });

    return entity;
  }
  getEntity(entityId: Entity["id"]) {
    return this.entities.get(entityId);
  }
  removeEntity(entityId: Entity["id"]) {
    const entity = this.getEntity(entityId);
    if (entity) {
      this._removeEntity(entity);
    }
  }
  protected _removeEntity(entity: Entity) {
    if (entity) {
      const entityId = entity.id;
      this.notify(EVENT_NAMES.entityRemoved, { entityId });
      this.entities.delete(entityId);
      entity.destroy();
      entity.id = "";
    }
  }
  protected notify(eventName: string, data = {}) {
    this.eventManager.emit(eventName, { ...data });
  }
  init() {
    this.loopOverEntities((entity) => entity.init());
  }
  start() {}
  update(_delta: number) {}
  destroy() {
    this.loopOverEntities((entity) => {
      entity.destroy();
    });
  }
  getEntityObject3d() {
    const objects: THREE.Object3D[] = [];
    this.loopOverEntities((entity) => {
      if (entity.isInteractive) {
        objects.push(entity.object3d);
      }
    });
    return objects;
  }
  loopOverEntities(cb: (entity: Entity) => void) {
    for (const entity of this.entities.values()) {
      cb(entity);
    }
  }
}
export class EntityManager extends BaseEntityManager {
  viewport: ViewportSystem;
  constructor(entities: EntityMapType, viewport: ViewportSystem) {
    super(entities);
    this.viewport = viewport;
    this.viewport.getObjects = this.getEntityObject3d;
  }
  init(): void {
    super.init();
    this.eventManager.on(
      EVENT_NAMES.entityClicked,
      (data: { entityId: Entity["id"] }) => {
        const { entityId } = data;
        const entity = this.getEntity(entityId);
        entity?.emit(EVENT_NAMES.click);
      }
    );
  }
  destroy(): void {
    super.destroy();
    this.viewport.destroy();
  }
  update(_delta: number): void {
    super.update(_delta);
  }
  removeEntity(entityId: Entity["id"]): void {
    const entity = this.getEntity(entityId);
    if (entity) {
      this.notify(EVENT_NAMES.entityRemoving, entityId);
      this.viewport.removeEntityFromScene(entity);
      super.removeEntity(entity.id);
    }
  }
  addEntity(entity: Entity): Entity | undefined {
    const addedEntity = super.addEntity(entity);
    if (addedEntity) {
      this.viewport.addEntityToScene(addedEntity);
      entity.start();
      return entity;
    }
  }
}
export class SystemManager extends Base {
  systems: SystemMapType;
  getEntitiesByComponentType!: (
    componentTypes: BaseComponent["componentType"][]
  ) => Entity[];
  getEntityById!: EntityManager["getEntity"];
  eventManager: EventManager = eventManager;
  constructor(systemMap: SystemMapType) {
    super();
    this.systems = systemMap || new Map();
  }
  //   systems
  addSystem(system: System) {
    system.id = this.systems.size.toString();

    const { systemType, id: systemId, componentTypes } = system;
    this.notify(EVENT_NAMES.systemAdded, {
      systemType,
      componentTypes,
      systemId,
    });

    this.systems.set(system.systemType, system);
    system.getEntities = () =>
      this.getEntitiesByComponentType?.(system.componentTypes);
    system.entities = this.getEntitiesByComponentType?.(system.componentTypes);
    system.getEntityById = this.getEntityById;
    system.init();
  }
  getSystem(systemType: string) {
    return this.systems.get(systemType);
  }
  removeSystem(systemType: string) {
    const system = this.getSystem(systemType);
    if (system) {
      const { systemType, id: systemId, componentTypes } = system;
      this.notify(EVENT_NAMES.systemRemoved, {
        systemType,
        componentTypes,
        systemId,
      });

      system.destroy();
      this.systems.delete(system.systemType);
    }
  }
  protected notify(eventName: string, data: {}) {
    this.eventManager.emit(eventName, { ...data });
  }
  //   lifecycles
  init() {
    for (const system of this.systems.values()) {
      system.init();
    }

    // listens to events thst requires
    const {
      componentAddedToEntity,
      componentRemoveFromEntity,
      entityAdded,
      entityRemoved,
    } = EVENT_NAMES;
    [
      entityAdded,
      entityRemoved,
      componentAddedToEntity,
      componentRemoveFromEntity,
    ].forEach((eventName) => {
      this.eventManager.on(eventName, () => {
        // reset  systems
        this.resetSystemEntities();
      });
    });
  }
  start() {
    for (const system of this.systems.values()) {
      system.start();
    }
  }
  update(delta: number) {
    for (const system of this.systems.values()) {
      system.update(delta);
    }
  }
  destroy() {
    for (const system of this.systems.values()) {
      system.destroy();
    }
    this.systems.clear();
  }
  resetSystemEntities() {
    this.iterateSystems((system) => {
      system.entities = this.getEntitiesByComponentType(system.componentTypes);
      if (!system.getEntities) {
        system.getEntities = () =>
          this.getEntitiesByComponentType(system.componentTypes);
      }
    });
    this.notify(EVENT_NAMES.systemsUpdated, "");
  }
  iterateSystems(cb: (system: System) => void) {
    for (const system of this.systems.values()) {
      cb(system);
    }
  }
}

type LooperCallbackType = (delta: number) => void;
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
export class ViewportSystem extends System {
  scene: THREE.Scene = new THREE.Scene();
  bgScene: THREE.Scene = new THREE.Scene();
  renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true });
  camera = new THREE.PerspectiveCamera(50, 1, 0.01, 1000);
  // controls
  controls: Controls = new Controls(this.camera, this.domElement);
  useRenderOnDemand: boolean = false;
  eventManager: EventManager = eventManager;
  inited: boolean = false;
  raycaster: THREE.Raycaster = new THREE.Raycaster();
  pointer: THREE.Vector2 = new THREE.Vector2();
  getObjects!: () => THREE.Object3D[];
  intersected?: {
    entityId: Entity["id"];
    object: THREE.Object3D;
  };
  params: { [key: string]: any };
  constructor() {
    super([]);
    this.params = {
      scene: {
        bg: "0x333333",
      },
    };
  }
  get domElement() {
    return this.renderer.domElement;
  }
  init() {
    if (this.inited) return;
    this.camera.position.set(0, 45, 50);
    this.camera.lookAt(new THREE.Vector3());

    this.renderer.setClearColor(0x333333);

    this.renderer.setPixelRatio(Math.max(1.5, window.devicePixelRatio));
    this.resize();
    if (this.controls) {
      this.scene.add(this.controls.transform);
    }

    this.initiatePointerDown();

    // test
    const capsule = new THREE.Mesh(
      new THREE.CapsuleGeometry(),
      new THREE.MeshNormalMaterial()
    );
    capsule.position.x -= 5;
    this.bgScene.add(capsule);

    this.inited = true;
  }
  update(): void {
    this.render();
  }
  destroy() {
    // destroy viewport elements
  }
  addEntityToScene(entity: Entity) {
    if (!entity.object3d.userData.entityId) {
      this.scene.add(entity.object3d);
      entity.object3d.userData.entityId = entity.id;
      entity.isOnScene = true;
    }
  }
  removeEntityFromScene(entity: Entity) {
    if (this.controls.transform?.object?.uuid == entity.object3d.uuid) {
      this.controls.transform.detach();
    }
    this.scene.remove(entity.object3d);
    entity.isOnScene = false;
  }
  render() {
    this.renderer.autoClear = false;
    this.renderer.render(this.bgScene, this.camera);
    this.renderer.render(this.scene, this.camera);
    this.renderer.autoClear = true;
  }
  resize(width?: number, height?: number) {
    const innerWidth = width || window.innerWidth;
    const innerHeight = height || window.innerHeight;

    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
  }
  intersect(event: PointerEvent | MouseEvent) {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const objects = this.getObjects();
    const intersects = this.raycaster.intersectObjects(objects, true);
    if (intersects.length) {
      const object = intersects[0].object;
      const { entityId } = object.userData;
      this.intersected = {
        entityId,
        object,
      };
      if (this.controls.transform.object?.uuid !== object.uuid) {
        this.controls.transform.attach(object);
      }
      return this.intersected;
    }
    this.controls.deselect();
    return undefined;
  }

  // events
  // initiate domEvents
  initiatePointerDown() {
    this.domElement.addEventListener("click", (event) => {
      const selected = this.intersect(event);
      if (selected) {
        this.eventManager.emit(EVENT_NAMES.entityClicked, {
          entityId: selected.entityId,
        });
      }
    });
  }
}

class Controls extends Base {
  orbit!: OrbitControls;
  transform!: TransformControls;

  constructor(camera: THREE.Camera, domElement: HTMLCanvasElement) {
    super();
    this.orbit = new OrbitControls(camera, domElement);
    this.transform = new TransformControls(camera, domElement);
    this.init();
  }
  init() {
    this.transform.addEventListener("dragging-changed", (event) => {
      this.orbit.enabled = !event.value;
    });
  }
  select(entity: Entity) {
    this.deselect();
    this.transform.attach(entity.object3d);
  }
  deselect() {
    if (this.transform.dragging) return;
    this.transform.detach();
  }
  update(_delta: number): void {}
  render(delta: number) {
    this.orbit.update(delta);
  }
}
export class BaseEngine {
  systemManager: SystemManager;
  entityManager: EntityManager;
  eventManager: EventManager = eventManager;
  eventBasedActionSystem: EventActionSystem;
  private _systemsMap: SystemMapType = new Map();
  private _entitiesMap: EntityMapType = new Map();
  looper: Looper = new Looper();

  // the idea here is to proxy map object, pass it to the managers and watch for changes
  _observableSytemsMap!: SystemMapType;
  _observableEntitiesMap!: EntityMapType;
  constructor() {
    const viewportSystem = new ViewportSystem();
    this.eventBasedActionSystem = new EventActionSystem();
    this.entityManager = new EntityManager(this._entitiesMap, viewportSystem);
    this.systemManager = new SystemManager(this._systemsMap);
    this.systemManager.addSystem(this.eventBasedActionSystem);
    this.systemManager.addSystem(viewportSystem);
  }

  get viewport() {
    return this.entityManager.viewport;
  }

  init() {
    this.systemManager.getEntitiesByComponentType = (
      componentTypes: BaseComponent["componentType"][]
    ) => this.entityManager.getEntitiesComponentByType(componentTypes);
    this.systemManager.getEntityById = (entityId: Entity["id"]) =>
      this.entityManager.getEntity(entityId);

    // init managers
    this.entityManager.init();
    this.systemManager.init();
    this.eventManager.emit("engine:init");
  }
  start() {
    this.systemManager.start();
    this.entityManager.start();
    this.looper.startLoop((delta) => this.update(delta));
    this.eventManager.emit("engine:start");
  }
  update(delta: number) {
    this.entityManager.update(delta);
    this.systemManager.update(delta);
    this.eventManager.emit(EVENT_NAMES.engineUpdate, delta);
  }
  createEntity(): Entity {
    return this.entityManager.createEntity();
  }
}

export class Engine extends BaseEngine {}

type ActionExcecuteFunctionType = (entity: Entity) => void;
type ActionUpdateFunctionType = (delta: string) => void;
type ActionSetupFunctionType = (
  entity: Entity,
  params: { [key: string]: any }
) => void;

interface IActionBlueprint {
  deps?: string[];
  isTimeless?: boolean;
  setup: ActionSetupFunctionType;
  execute: ActionExcecuteFunctionType;
  update?: ActionUpdateFunctionType;
  name: string;

  [key: string]: any;
}
interface ActionData {
  actionName: string;
  eventName: string;
  isSet?: boolean;
  data: {};
  registered?: boolean;
}
interface ActionInstance extends IActionBlueprint {
  isProcessed?: boolean;
  isSet: boolean;
  eventName: string;
}

class ActionComponent extends BaseComponent {
  declare data: {
    actions: ActionData[];
    [key: string]: any;
  };
  constructor() {
    super();
    this.data.actions = [];
  }
  addBehavior() {}
}

export class EventActionSystem extends System {
  blueprints: Map<string, IActionBlueprint>;
  constructor() {
    super([ActionComponent.name]);
    this.blueprints = new Map();

    this.loadPredefinedActions();

    this.eventManager.on(EVENT_NAMES.systemsUpdated, () => {
      this.getEntities().forEach((entity) => {
        this.buildEntityActions(entity);
      });
    });
  }
  registerBlueprint(blueprint: IActionBlueprint) {
    const id = this.blueprints.size;
    blueprint.id = id;
    this.blueprints.set(blueprint.name, blueprint);
  }
  getBlueprint(blueprintName: IActionBlueprint["name"]) {
    return this.blueprints.get(blueprintName);
  }
  buildEntityActions(entity: Entity) {
    // build actions from action data
    const actionComponent = entity.getComponent(
      ActionComponent.name
    ) as ActionComponent;
    if (actionComponent) {
      actionComponent.data.actions.forEach((actionData: ActionData) => {
        if (actionData.isSet) return;
        const blueprint = this.getBlueprint(actionData.actionName);
        if (blueprint) {
          const instance = Object.assign({}, blueprint) as ActionInstance;
          instance.setup(entity, actionData.data);
          const eventName = actionData.eventName;
          const eventCallback = () => {
            instance.execute(entity);
          };
          instance.eventCallback = eventCallback;
          entity.on(eventName, eventCallback);

          actionData.isSet = true;
        }
      });
    }
  }
  init() {
    if (this.inited) return;
    this.inited = true;
  }
  loadPredefinedActions() {
    predefinedActionsBlueprint.forEach((blueprint) => {
      this.registerBlueprint(blueprint);
    });
  }
}

// actions blueprint
const openUrlBlueprint: IActionBlueprint = {
  name: "openUrl",
  a: undefined,
  setup(_entity: Entity, data = {}) {
    this.a = createAnchor();
    this.a.href = data.url;
  },
  execute: function (_entity: Entity): void {
    this.a.click();
  },
  eventName: "click",
};

const rotatebehaviorBlueprint: IActionBlueprint = {
  name: "rotateObject",
  isTimeless: true,
  isRotation: false,
  setup(entity, { rotX, rotY, rotZ }) {
    this.shouldRotate = false;
    this.rotateObject = () => {
      if (!this.shouldRotate) return;
      entity.object3d.rotation.x += rotX || 0.005;
      entity.object3d.rotation.y += rotY || 0.005;
      entity.object3d.rotation.z += rotZ || 0.001;
    };
  },
  execute(entity) {
    this.shouldRotate = !this.shouldRotate;
    entity.eventManager.off(EVENT_NAMES.engineUpdate, this.rotateObject);
    entity.eventManager.on(EVENT_NAMES.engineUpdate, this.rotateObject);
  },
};

export const predefinedActionsBlueprint = [
  openUrlBlueprint,
  rotatebehaviorBlueprint,
];
