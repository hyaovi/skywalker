import * as THREE from "three";

type PrimitiveType = "box" | "sphere" | "cylinder" | "plane";
type LightType = "ambient" | "directional" | "hemisphere" | "point" | "spot";

interface PrimitiveParams {
  type: PrimitiveType;
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  radiusTop?: number;
  radiusBottom?: number;
  widthSegments?: number;
  heightSegments?: number;
  depthSegments?: number;
  openEnded?: boolean;
  color?: number;
}
interface LightParams {
  type: LightType;
}

export function createPrimitiveMesh(params: PrimitiveParams) {
  const material = new THREE.MeshStandardMaterial({
    color: params.color || 0xcccccc * Math.random(),
  });
  let geometry = new THREE.BufferGeometry();
  switch (params.type) {
    case "box":
      geometry = new THREE.BoxGeometry();
      break;

    case "sphere":
      geometry = new THREE.SphereGeometry();
      break;
    case "cylinder":
      geometry = new THREE.CylinderGeometry();
      break;
    default:
      console.error(`Unsupported primitive type: ${params.type}`);
  }
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
}

export function createLight(params: LightParams) {
  const color = 0xffffff;
  const intensity = 0.5;
  let light;
  switch (params.type) {
    case "ambient":
      light = new THREE.AmbientLight(color, intensity);
      break;
    case "directional":
      light = new THREE.DirectionalLight(color, intensity);
      break;
    case "hemisphere":
      light = new THREE.HemisphereLight();
      break;
    case "point":
      light = new THREE.PointLight();
      break;
    case "spot":
      light = new THREE.SpotLight();
      break;

    default:
      light = new THREE.AmbientLight(color, intensity);
      break;
  }

  return light;
}
export function makeHelper(
  object:
    | THREE.Object3D
    | THREE.Camera
    | THREE.DirectionalLight
    | THREE.PointLight
    | THREE.SpotLight
    | THREE.HemisphereLight
    | THREE.SkinnedMesh
    | THREE.Bone
) {
  let helper;
  const color = 0xd3d3d3;

  if (helper === undefined) {
    if (object instanceof THREE.Camera) {
      helper = new THREE.CameraHelper(object);
    } else if (object instanceof THREE.PointLight) {
      helper = new THREE.PointLightHelper(object, 1);
    } else if (object instanceof THREE.DirectionalLight) {
      helper = new THREE.DirectionalLightHelper(object, 1);
    } else if (object instanceof THREE.SpotLight) {
      helper = new THREE.SpotLightHelper(object);
    } else if (object instanceof THREE.HemisphereLight) {
      helper = new THREE.HemisphereLightHelper(object, 1);
    } else if (object instanceof THREE.SkinnedMesh) {
      helper = new THREE.SkeletonHelper(object.skeleton.bones[0]);
    } else if (
      object instanceof THREE.Bone &&
      object.parent &&
      !(object.parent instanceof THREE.Bone)
    ) {
      helper = new THREE.SkeletonHelper(object);
    } else if (object instanceof THREE.Mesh) {
      helper = new THREE.BoxHelper(object, color);
    } else {
      // no helper for this object type
      return undefined;
    }

    return helper;
  }

  return helper;
}

export function createCustomGrid(size = 60) {
  const GRID_COLORS_LIGHT = [0x999999, 0x777777];
  const GRID_COLORS_DARK = [0x555555, 0x888888];


  const grid = new THREE.GridHelper(size, size);
  grid.material.color.setHex(GRID_COLORS_LIGHT[0]);
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  grid.material.vertexColors = false;
  return grid;
}

export function makeGround(size: number = 1000) {
  const geometry = new THREE.PlaneGeometry(size, size);
  const material = new THREE.MeshPhongMaterial({
    color: 0x999999,
    shininess: 0,
    specular: 0x111111,
  });
  const ground = new THREE.Mesh(geometry, material);
  ground.castShadow = true;
  ground.receiveShadow = true;
  return ground;
}
