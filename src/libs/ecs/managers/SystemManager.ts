import { Base } from "../base";
import { EVENT_NAMES } from "../base/EventManager";
import { BaseEntity, Entity } from "../entities";
import { System } from  "../systems";

export class BaseSystemManager<EntityType extends BaseEntity = Entity> extends Base {
    systems: Map<string, System>;
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
    loopOverSystems(callback: (system: System) => void) {
      for (const system of this.systems.values()) {
        callback(system);
      }
    }
  
    addSystem(system: System) {
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
    resetSystem(system: System) {
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

export class SystemManager extends BaseSystemManager {}
