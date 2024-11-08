import type { AnimationAction } from "three";
import { Base } from "../base";
import type { IPrimitiveParams } from "../sharedTypes";
import type { ILightParams } from "../utils/ObjectFactory";

export interface IModelParams {
  url: string;
}
export type meshParamsMapType = {
  model: IModelParams;
  primitive: IPrimitiveParams;
  light: ILightParams;
};
export interface IMeshParams {
  type: keyof meshParamsMapType;
  params: IModelParams | IPrimitiveParams | ILightParams;
}
export interface IAnimationParam {
  name: string;
  loop: boolean;
  autoplay: boolean;
  clampWhenFinished: boolean;
}

export class Component extends Base {
  id!: string;
  entityId!: string;
  independant = false;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  data: Record<string, any>;
  readonly componentType: string;
  constructor() {
    super();
    this.data = {};
    this.componentType = this.constructor.name;
  }
  destroy() {
    this.data = {};
  }
  toJSON() {
    const { independant, data, componentType } = this;
    return JSON.stringify({ independant, data, componentType });
  }
}

export class AnimationComponent extends Component {
  name: string;
  loop: boolean;
  autoplay: boolean;
  clampWhenFinished: boolean;
  isSet = false;
  action?: AnimationAction;
  constructor(animation: IAnimationParam) {
    super();
    const { name, loop, autoplay, clampWhenFinished } = animation;
    this.name = name;
    this.autoplay = autoplay;
    this.loop = loop;
    this.clampWhenFinished = clampWhenFinished;

    this.data.animation = animation;
  }
}

export class MeshComponent extends Component {
  isSet = false;
  constructor(params: IMeshParams) {
    super();
    this.data.params = params;
  }
}

export class InteractableComponent extends Component {
  isPressed = false;
  isSelected = false;
  isHovered = false;

  // Custom events
  // onHoverEnter?: () => void;
  // onHoverExit?: () => void;
  // onSelect?: () => void;
  // onDeselect?: () => void;
  // onPress?: () => void;
  // onRelease?: () => void;
}
