import * as THREE from "three";
import { Engine } from "./ecs";

import { Loader } from "./ecs/loaders";
import { MotionComponent } from "./ecs/components";
import { _setupWorld } from "./ecs/utils";

const modelUrl = `https://threejs.org/examples/models/gltf/Soldier.glb`;
// const modelUrl = `https://threejs.org/examples/models/gltf/SheenChair.glb`;
// const modelUrl = `https://threejs.org/examples/models/gltf/AVIFTest/forest_house.glb`;
const loader = new Loader();

const engine = new Engine({
  viewport: {
    useShadow: false,
    useTransformControls: false,
    useHelper: false,
  },
});

engine.subscribeOnce("engine-started", () => {
  _setupWorld(engine);
  window.addEventListener("resize", () => {
    viewportSystem.resize();
  });
});
engine.run();
const viewportSystem = engine.viewport;

document.querySelector("#app")?.appendChild(engine.viewport.domElement);

const data = await loader.load(modelUrl);
console.log("data", data);
data.scene.traverse((object) => {
  if (object instanceof THREE.Mesh) object.castShadow = true;
});
const entity = engine.entityManager.createEntity(data.scene);
const angularSpeedX = 0.01 * Math.random();
const angularSpeedY = 0.02 * Math.random();
entity.addComponent(new MotionComponent())
// engine.subscribe("engine-update", () => {
//   entity.object3d.rotation.x += angularSpeedX;
//   entity.object3d.rotation.y += angularSpeedY;
// });
engine.entityManager.activateEntity(entity);
// engine.subscribe('engine-started', ()=>{
const action = viewportSystem.mixer.clipAction(data.animations[3], data.scene);
action.play();
console.log("@@ start");

// })

Array(10)
  .fill(null)
  .map((_, index) => {
    const entity = engine.entityManager.createEntity();
    // entity.object3d.position.fromArray(
    //   [1, 0, 1].map((i) => i*(index + 10) * Math.random() - 10)
    // );
    entity.object3d.position.x = (index + 10) * Math.random() - 10;
    entity.object3d.position.z = (index + 10) * Math.random() - 10;
    entity.object3d.position.y = 0.5;
    entity.object3d.castShadow = engine.viewport.settings.useShadow;
    entity.object3d.receiveShadow = entity.object3d.castShadow;
    // const angularSpeedX = 0.01 * Math.random();
    // const angularSpeedY = 0.02 * Math.random();
    // engine.subscribe("engine-update", () => {
    //   entity.object3d.rotation.x += angularSpeedX;
    //   entity.object3d.rotation.y += angularSpeedY;
    // });
    entity.on("click", function (data:any) {
      console.log("@@ clicked", data);
    });

    engine.entityManager.activateEntity(entity);

    return entity;
  });

(window as any).nn = engine;
(window as any).vv = viewportSystem;
