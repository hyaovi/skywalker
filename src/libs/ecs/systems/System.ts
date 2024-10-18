import { Base } from "../base";
import { BaseComponent } from "../components";
import { BaseEntity, Entity } from "../entities/Entity";

export class System<EntityType extends BaseEntity = Entity> extends Base {
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