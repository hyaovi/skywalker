import * as THREE from "three";
import {  Engine, InteractableComponent } from "./ecs";

import { setupStats } from "./ecs/utils/utils";


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
      const entity = await engine.manager.createEntityWithParams('primitive', { type: 'cylinder', color: 0xffccff * Math.random(), material:'standard' })
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
      return entity;
    });
  document.querySelector("#app")?.appendChild(engine.viewport.domElement);


  window.addEventListener("resize", () => {
    engine.viewport.resize();
  });



});
engine.run();

(window as any).nn = engine;
