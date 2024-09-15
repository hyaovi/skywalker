import { BaseComponent, System } from "../BaseEcs";
import { EVENT_NAMES } from "../BaseEcs/EventManager";
import { Entity } from ".";

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

export class ActionComponent extends BaseComponent {
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
export class EventActionSystem extends System<Entity> {
  blueprints: Map<string, IActionBlueprint>;
  constructor() {
    super([ActionComponent.name]);
    this.blueprints = new Map();

    this.loadPredefinedActions();

    this.subscribe(EVENT_NAMES.componentAddedToEntity, () => {
      this.getEntities().forEach((entity) => {
        console.log("@@ should build action");
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
          console.log(eventName,'###', entity.started)
          if (eventName === "start" && entity.started) {
            eventCallback();
          }
        }
      });
    }
  }
  init() {
    if (this.inited) return;
    super.init();
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
    entity.unsubscribe(EVENT_NAMES.engineUpdate, this.rotateObject);
    entity.subscribe(EVENT_NAMES.engineUpdate, this.rotateObject);
  },
};

export const predefinedActionsBlueprint = [
  openUrlBlueprint,
  rotatebehaviorBlueprint,
];

export function createAnchor(): HTMLAnchorElement {
  type urlType = "mail" | "tel" | undefined;
  const a = document.createElement("a");
  a.target = "_blank";
  a.rel = "no-referrer";
  return a;
}
