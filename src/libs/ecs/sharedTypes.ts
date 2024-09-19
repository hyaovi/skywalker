import * as THREE from "three";

type _Object3DType = THREE.Mesh | THREE.Light | THREE.Object3D;
export type Object3DType = _Object3DType & {
  entityId?: string;
};
export type ObjectHelperType = THREE.CameraHelper|THREE.PointLightHelper|THREE.DirectionalLightHelper|THREE.SpotLightHelper|THREE.HemisphereLightHelper|THREE.SkeletonHelper|THREE.BoxHelper|undefined;
export type LooperCallbackType = (delta: number) => void;
