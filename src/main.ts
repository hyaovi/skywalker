import * as THREE from "three";
import { AnimationComponent, Engine, InteractableComponent } from "./ecs";

import { globalLoader } from "./ecs/loaders";
import { setupStats } from "./ecs/utils/utils";

const modelUrl = `https://threejs.org/examples/models/gltf/Soldier.glb`;

const engine = new Engine({
  viewport: {
    useShadow: false,
    useTransformControls: !false,
    useHelper: false,
    useRenderOnDemand: !true,
  },
});

engine.subscribeOnce("engine-started", async () => {
  // setup lightings
  setupStats(engine)
  const ambientLightEntity = engine.manager.createEntity(new THREE.AmbientLight(0xffffff, 1));
  engine.manager.activateEntity(ambientLightEntity);
  const dirLightEnity = engine.manager.createEntity(new THREE.DirectionalLight(0xffffff, 2));
  dirLightEnity.sceneObject.position.set(0, 30, 10);
  engine.manager.activateEntity(dirLightEnity);

  // add random cubes
  Array(10)
    .fill(null)
    .map(async (_, index) => {
      const entity = await engine.manager.createEntityWithParams('primitive', { type: 'cylinder', color: 0xffccff * Math.random() })
      engine.manager.activateEntity(entity)
      entity.sceneObject.position.x = (index + 10) * Math.random() - 10;
      entity.sceneObject.position.z = (index + 10) * Math.random() - 10;
      entity.sceneObject.position.y = 0.5 * Math.random() * 10;
      entity.sceneObject.castShadow = engine.viewport.settings.useShadow;
      entity.sceneObject.receiveShadow = entity.sceneObject.castShadow;
      if (index % 2 == 0) {
        entity.addComponent(new InteractableComponent());
        entity.sceneObject.scale.multiplyScalar(1.5)
      }
      const angularSpeedX = 0.01 * Math.random();
      const angularSpeedY = 0.02 * Math.random();
      engine.subscribe("engine-update", () => {
        entity.sceneObject.rotation.x += angularSpeedX;
        entity.sceneObject.rotation.y += angularSpeedY;
      });
      entity.on("click", (data: any) => {
        console.log("@@ clicked", data);
      });
      return entity;
    });
  document.querySelector("#app")?.appendChild(engine.viewport.domElement);


  window.addEventListener("resize", () => {
    engine.viewport.resize();
  });

  const model = await globalLoader.loadGLTF(modelUrl);
  model.scene.animations = model.animations;
  const modelEntity = engine.manager.createEntity(model.scene);
  modelEntity.addComponent(new InteractableComponent())
  modelEntity.addComponent(new AnimationComponent({ name: model.animations[3].name, loop: true, clampWhenFinished: true, autoplay: true }))
  engine.manager.activateEntity(modelEntity);

  const action = engine.viewport.mixer.clipAction(modelEntity.sceneObject.animations[3], modelEntity.sceneObject);
  // action.play();


});
engine.run();

(window as any).nn = engine;
