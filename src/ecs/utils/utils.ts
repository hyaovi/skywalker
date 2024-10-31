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

  const dirLightEntity = engine.manager.createEntity(dirLight);

  engine.manager.activateEntity(dirLightEntity);
  // ambient light
  const ambLight = new THREE.AmbientLight(0xffffff, 1);
  const ambLightEntity = engine.manager.createEntity(ambLight);
  engine.manager.activateEntity(ambLightEntity);

  // shadowfloor
  if (engine.viewport.settings.useShadow) {
    const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.25 });
    const planeGeo = new THREE.PlaneGeometry(200, 200);
    const plane = new THREE.Mesh(planeGeo, shadowMaterial);
    plane.rotateX(-Math.PI / 2);
    plane.position.y = -3;
    plane.receiveShadow = true;
    const floor = engine.manager.createEntity(plane);
    engine.manager.activateEntity(floor);
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
export function setupStats(engine: Engine) {
  const stats = new Stats();
  stats.showPanel(0);
  engine.subscribe(EVENT_NAMES.engineUpdate, () => {
    stats.update();
  });
  document.body.appendChild(stats.dom);
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

export function createGalaxy(starCount: number = 3000, radius: number, _color: number): THREE.Group {
  const galaxy = new THREE.Group();
  const geometry = new THREE.SphereGeometry();
  const positions = new Float32Array(starCount * 3); // x, y, z for each star
  const sizes = new Float32Array(starCount); // size for each star
  const color = new THREE.Color(_color*Math.random());
  for (let i = 0; i < starCount; i++) {
    // Random position within a sphere
    const phi = Math.random() * Math.PI * 2; // Angle around the y-axis
    const theta = Math.acos(Math.random() * 2 - 1); // Angle from the y-axis
    const x = radius * Math.sin(theta) * Math.cos(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(theta);
    
    

      geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( color, 3 ) );

      positions.set([x, y, z], i * 3);
      sizes[i] = Math.random() * 2; // Random size for variation
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.MeshStandardMaterial({
      color,
      // sizeAttenuation: true,
      // size: 1* Math.random()+0.5, // Default size for the points
  });

  const stars = new THREE.Points(geometry, material);
  galaxy.add(stars);

  return galaxy;
}