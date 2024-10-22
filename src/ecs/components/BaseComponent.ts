import { Base } from "../base";

export class BaseComponent extends Base {
  id!: string;
  entityId!: string;
  independant: boolean = false;
  data: Record<string, any>;
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