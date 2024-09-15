import "./style.css";

import { Engine } from "./MainEcs/Engine.ts";
import { createCustomGrid, createLight } from "./MainEcs/ObjectFactory.ts";

import { ActionComponent } from "./MainEcs/EventActionSystem.ts";

const engine = new Engine();
document.querySelector("#app")?.appendChild(engine.viewport.domElement);

const entity2 = engine.entityManager.createEntity();
const entity3 = engine.entityManager.createEntity();
const gridEntity = engine.entityManager.createEntity();
gridEntity.object3d = createCustomGrid();
gridEntity.isInteractive = false;

entity2.object3d = createLight({ type: "directional" });
entity3.object3d = createLight({ type: "ambient" });

const sleep = async (time = 1000) =>
  new Promise<void>((resolve) => setTimeout(resolve, time));

engine.init();
engine.start();
const urls = ["https://voiranime.com", "https://google.com"];
const viewportSystem = engine.viewport;
engine.entityManager.activateEntity(entity2);
engine.entityManager.activateEntity(entity3);
engine.entityManager.activateEntity(gridEntity);
let entities = Array(2)
  .fill(null)
  .map((_, index) => {
    const entity = engine.entityManager.createEntity();
    entity.object3d.position.x += index * Math.random() * 6 + index;
    entity.object3d.position.z += index * Math.random() * 6 + index;
    const actionComponent = new ActionComponent();
    const url = urls[index];
    actionComponent.data.actions.push(
      ...[
        {
          actionName: "rotateObject",
          eventName: "start",
          data: { rotX: 0.01, rotY: 0.05 },
        },
        {
          actionName: "openUrl",
          eventName: "click",
          data: { url },
        },
      ]
    );
    entity.addComponent(actionComponent);

  
    engine.entityManager.activateEntity(entity);

    return entity;
  });


(window as any).nn = engine;
(window as any).vv = viewportSystem;
(window as any).q = entity3;
window.addEventListener("resize", () => {
  viewportSystem.resize();
});

entities[0].object3d.scale.multiplyScalar(2);
