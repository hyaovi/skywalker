import * as THREE from "three";
import { Engine, InteractableComponent } from "./ecs";

import { createGalaxy, setupStats } from "./ecs/utils/utils";

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
  setupStats(engine);
  const ambientLightEntity = engine.manager.createEntity(
    new THREE.AmbientLight(0xffffff, 1),
  );
  engine.manager.activateEntity(ambientLightEntity);
  const dirLightEnity = engine.manager.createEntity(
    new THREE.DirectionalLight(0xffffff, 2),
  );
  dirLightEnity.sceneObject.position.set(0, 30, 10);
  engine.manager.activateEntity(dirLightEnity);

  // add random cubes
  Array(10)
    .fill(null)
    .map(async (_, index) => {
      const entity = await engine.manager.createEntityWithParams('primitive', { type: 'cylinder', color: 0xffccff * Math.random(), material: 'standard' })
      engine.manager.activateEntity(entity)
      entity.sceneObject.position.x = (index + 10) * Math.random() - 10;
      entity.sceneObject.position.z = (index + 10) * Math.random() - 10;
      entity.sceneObject.position.y = 0.5 * Math.random() * 10;
      entity.sceneObject.castShadow = engine.viewport.settings.useShadow;
      entity.sceneObject.receiveShadow = entity.sceneObject.castShadow;
      let interactable: InteractableComponent | null = null;
      if (index % 2 === 0) {
        interactable = new InteractableComponent()
        entity.addComponent(interactable);
        entity.sceneObject.scale.multiplyScalar(1.5)
      }
      const angularSpeedX = 0.01 * Math.random();
      const angularSpeedY = 0.02 * Math.random();
      engine.subscribe("engine-update", () => {
        if (interactable?.isHovered) {
          entity.sceneObject.rotation.x += angularSpeedX * 60;
          entity.sceneObject.rotation.y += angularSpeedY * 60;
        } else {
          entity.sceneObject.rotation.x += angularSpeedX;
          entity.sceneObject.rotation.y += angularSpeedY;
        }
      });
      return entity;
    });
  document.querySelector("#app")?.appendChild(engine.viewport.domElement);
  const radius = 12;
  const satelite = await engine.manager.createEntityWithParams("primitive", {
    type: "sphere",
    material: "normal",
    color: "",
  });
  engine.manager.activateEntity(satelite);
  satelite.sceneObject.scale.multiplyScalar(0.5);
  satelite.sceneObject.position.y = radius;
  satelite.sceneObject.position.x = radius;

  const galaxy = engine.manager.createEntity(
    createGalaxy(6000, radius, 0xccccff),
  );
  engine.manager.activateEntity(galaxy);
  galaxy.sceneObject.rotation.x = Math.PI / 3;
  engine.subscribe("engine-update", () => {
    galaxy.sceneObject.rotation.y += 0.0005;

    satelite.sceneObject.position.x =
      radius * 1.01 * Math.sin(performance.now() / 100);
    satelite.sceneObject.position.y =
      radius * 1.01 * Math.cos(performance.now() / 100);
  });

  window.addEventListener("resize", () => {
    engine.viewport.resize();
  });

  engine.context.renderer.setClearColor(0x000000);
});
engine.run();

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
(window as any).nn = engine;
