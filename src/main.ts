import { Engine } from "./libs/ecs/main/Engine.ts";

import { _setupWorld } from "./libs/ecs/utils.ts";

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

document.querySelector("#app")?.appendChild(engine.viewport.domElement);

const viewportSystem = engine.viewport;
Array(10)
  .fill(null)
  .map((_, index) => {
    const entity = engine.entityManager.createEntity();
    entity.object3d.position.fromArray(
      [1, 2, 3].map(() => (index + 10) * Math.random() - 10)
    );
    entity.object3d.castShadow = engine.viewport.settings.useShadow;
    entity.object3d.receiveShadow = entity.object3d.castShadow;

    engine.subscribe("engine-update", () => {
      entity.object3d.rotation.x += 0.01 * Math.random();
      entity.object3d.rotation.y += 0.02 * Math.random();
    });

    engine.entityManager.activateEntity(entity);

    return entity;
  });

(window as any).nn = engine;
(window as any).vv = viewportSystem;
