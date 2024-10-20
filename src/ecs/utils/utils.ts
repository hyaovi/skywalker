import * as THREE from "three";
import Stats from "stats.js";
import { EVENT_NAMES } from "../base";
import { Engine } from "../engine";


export function _setupWorld(engine: Engine) {
  // engine.context.renderer.shadowMap.enabled = true;
  const dirLight = new THREE.DirectionalLight(0xffffff, 3);
  if (engine.viewport.settings.useShadow) {
    dirLight.castShadow = true;
    dirLight.position.set(0, 30, 10);
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    const d = 100;

    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.near = 1;

    dirLight.shadow.camera.far = 1000;
    dirLight.shadow.bias = 0.0001;
    dirLight.shadow.blurSamples = 2;
    dirLight.shadow.radius = 0.2;
  }

  const dirLightEntity = engine.entityManager.createEntity(dirLight);

  engine.entityManager.activateEntity(dirLightEntity);
  // ambient light
  const ambLight = new THREE.AmbientLight(0xffffff, 1);
  const ambLightEntity = engine.entityManager.createEntity(ambLight);
  engine.entityManager.activateEntity(ambLightEntity);

  // shadowfloor
  if (engine.viewport.settings.useShadow) {
    const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.25 });
    const planeGeo = new THREE.PlaneGeometry(200, 200);
    const plane = new THREE.Mesh(planeGeo, shadowMaterial);
    plane.rotateX(-Math.PI / 2);
    plane.position.y = -3;
    plane.receiveShadow = true;
    const floor = engine.entityManager.createEntity(plane);
    floor.isInteractive = false;
    engine.entityManager.activateEntity(floor);
  }
  // setup stats
  const stats = createStats();
  engine.subscribe(EVENT_NAMES.engineUpdate, () => {
    stats.update();
  });
  document.body.appendChild(stats.dom);
}

function createStats() {
  const stats = new Stats();
  stats.showPanel(0);
  return stats;
}

export const sleep = async (time = 1000) =>
  new Promise<void>((resolve) => setTimeout(resolve, time));

export function loopThroughMapValues<MapItemtype>(
  map: Map<string, MapItemtype>,
  cb: (item: MapItemtype) => void
) {
  for (const item of map.values()) {
    cb(item);
  }
}

