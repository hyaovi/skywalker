import { Object3D } from "three";

import { EventManager, EVENT_NAMES, globalEventManager } from "../base/EventManager";
import { ILifecycles, Object3DType, ObjectHelperType } from "../sharedTypes";
import { loopThroughMapValues } from "../utils";
import { Component, } from "../components";


export class BaseEntity extends EventManager implements ILifecycles {
  inited: boolean;
  started: boolean;
  id!: string;
  isActive: boolean;
  isOnScene: boolean;
  sceneObject: Object3DType;
  helper!: ObjectHelperType;
  needsUpdateCalls: boolean = false;

  protected components: Map<string, Component>;
  constructor(object3d?: Object3DType) {
    super();
    this.inited = false;
    this.started = false;
    this.isActive = false;
    this.isOnScene = false;
    this.components = new Map();
    this.sceneObject = object3d || new Object3D();
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
    this.loopOverComponents((component) => component.start());
    this.started = true;
  }
  update(_delta: number) {
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
  loopOverComponents(callback: (component: Component) => void) {
    loopThroughMapValues(this.components, callback);
  }
  // 3d object methods
  setObject3D(object: Object3DType) {
    this.sceneObject = object;
  }
  addComponent<ComponentType extends Component>(component: ComponentType): ComponentType {
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
    return component
  }
  getComponent(componentType: Component["componentType"]) {
    return this.components.get(componentType);
  }
  removeComponent(componentType: Component["componentType"]): boolean {
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
  filterComponents(cb: (component: Component) => boolean) {
    return [...this.components.values()].filter(cb);
  }
  toJSON() {
    const componentsData: any[] = [];
    this.loopOverComponents((component) => componentsData.push(JSON.parse(component.toJSON())))
    return { type: this.constructor.name, components: componentsData }
  }
}
export class Entity extends BaseEntity {
  constructor(object3D?: Object3DType) {
    super(object3D);
  }
}