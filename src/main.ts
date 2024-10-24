import * as THREE from "three";
import { Engine } from "./ecs";

import { Loader } from "./ecs/loaders";
import { MotionComponent } from "./ecs/components";
import { _setupWorld } from "./ecs/utils";
import { createPrimitiveMesh } from "./ecs/utils/ObjectFactory";

const modelUrl = `https://threejs.org/examples/models/gltf/Soldier.glb`;
// const modelUrl = `https://threejs.org/examples/models/gltf/SheenChair.glb`;
// const modelUrl = `https://threejs.org/examples/models/gltf/AVIFTest/forest_house.glb`;
const loader = new Loader();

const engine = new Engine({
  viewport: {
    useShadow: false,
    useTransformControls: !false,
    useHelper: false,
    useRenderOnDemand: !true,
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

const data = await loader.loadGLTF(modelUrl);
console.log("data", data);
data.scene.traverse((object) => {
  if (object instanceof THREE.Mesh) object.castShadow = true;
});
const entity = engine.entityManager.createEntity(data.scene);
// const entity = engine.entityManager.createEntity();
// const data = await entity.initSceneObject("model", { url: modelUrl }) as GLTF;

const angularSpeedX = 0.01 * Math.random();
const angularSpeedY = 0.02 * Math.random();
entity.addComponent(new MotionComponent());
// engine.subscribe("engine-update", () => {
//   entity.sceneObject.rotation.x += angularSpeedX;
//   entity.sceneObject.rotation.y += angularSpeedY;
// });
engine.entityManager.activateEntity(entity);
// engine.subscribe('engine-started', ()=>{
const action = viewportSystem.mixer.clipAction(data.animations[3], data.scene);
action.play();

// })

Array(10)
  .fill(null)
  .map((_, index) => {
    const entity = engine.entityManager.createEntity(createPrimitiveMesh({type:'sphere'}));

    // entity.sceneObject.position.fromArray(
    //   [1, 0, 1].map((i) => i*(index + 10) * Math.random() - 10)
    // );
    entity.sceneObject.position.x = (index + 10) * Math.random() - 10;
    entity.sceneObject.position.z = (index + 10) * Math.random() - 10;
    entity.sceneObject.position.y = 0.5;
    entity.sceneObject.castShadow = engine.viewport.settings.useShadow;
    entity.sceneObject.receiveShadow = entity.sceneObject.castShadow;
    const angularSpeedX = 0.01 * Math.random();
    const angularSpeedY = 0.02 * Math.random();
    engine.subscribe("engine-update", () => {
      entity.sceneObject.rotation.x += angularSpeedX;
      entity.sceneObject.rotation.y += angularSpeedY;
    });
    entity.on("click", function (data: any) {
      console.log("@@ clicked", data);
    });
    entity.on("pointermove", function (data: any) {
      console.log("@@ moveover", data);
    });

    engine.entityManager.activateEntity(entity);

    return entity;
  });

(window as any).nn = engine;
(window as any).vv = viewportSystem;
