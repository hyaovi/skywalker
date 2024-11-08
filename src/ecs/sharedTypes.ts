import type * as THREE from "three";
import type {
  ColorType,
  MaterialType,
  PrimitiveType,
} from "./utils/ObjectFactory";

type _Object3DType = THREE.Mesh | THREE.Light | THREE.Object3D;
export type Object3DType = _Object3DType & {
  entityId?: string;
};
export type ObjectHelperType =
  | THREE.CameraHelper
  | THREE.PointLightHelper
  | THREE.DirectionalLightHelper
  | THREE.SpotLightHelper
  | THREE.HemisphereLightHelper
  | THREE.SkeletonHelper
  | THREE.BoxHelper
  | undefined;
export type LooperCallbackType = (delta: number, time:number) => void;

export interface ILifecycles {
  init(): void;
  start(): void;
  update(delta: number, time:number): void;
  pause(): void;
  destroy(): void;
  resume(): void;
}
export interface IPrimitiveParams {
  type: PrimitiveType;
  color: ColorType;
  material?: MaterialType;
}
