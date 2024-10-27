import { Base } from "../base";
import { Component } from "../components";
import { Entity } from "../entities";
import { manager } from "../managers";

type componentTypeType = Component['componentType']
export class System extends Base {
  id!: string;
  entities!: Entity[];
  getEntityById = manager.getEntityById.bind(manager);
  needsUpdateCalls:boolean = false
  readonly systemType: string;
  query = manager.getQuery();

  constructor(componentTypes: componentTypeType[]) {
    super();
    this.systemType = this.constructor.name;
    this.componentTypes = componentTypes || [];
  }

  start() {
    if (this.inited) return;
    this.entities = this.query.execute();
    super.init();
    this.inited = true;
  }

  get componentsTypes() {
    return this.query.componentTypes
  }
  set componentTypes(componentTypes: componentTypeType[]) {
    this.query.setFilter(componentTypes)
  }

}