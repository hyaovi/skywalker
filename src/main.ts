import "./style.css";

import { Engine } from "./skywalker/BaseEngine.ts";
import { createCustomGrid, createLight } from "./skywalker/ObjectFactory.ts";
import { GridHelper } from "three";

const engine = new Engine();
document.querySelector("#app")?.appendChild(engine.viewport.domElement);

const entity2 = engine.createEntity();
const entity3 = engine.createEntity();
const gridEntity = engine.createEntity();
// gridEntity.object3d = new GridHelper(60, 60);
gridEntity.object3d = createCustomGrid();
gridEntity.isInteractive = false;

entity2.object3d = createLight({ type: "directional" });
entity3.object3d = createLight({ type: "ambient" });

const sleep = async (time = 1000) =>
  new Promise<void>((resolve) => setTimeout(resolve, time));

engine.init();
engine.start();
const urls = ["https://voiranime.com", "https://google.com"];
const viewportSystem = engine.entityManager.viewport;
engine.entityManager.addEntity(entity2);
engine.entityManager.addEntity(entity3);
engine.entityManager.addEntity(gridEntity);
let entities = Array(2)
  .fill(null)
  .map((_, index) => {
    const entity = engine.createEntity();
    entity.object3d.position.x += index * Math.random() * 6 + index;
    entity.object3d.position.z += index * Math.random() * 6 + index;
    const url = urls[index];
    entity.addEventAction({
      actionName: "rotateObject",
      eventName: "start",
      data: { rotX: 0.01, rotY: 0.05 },
    });
    // entity.addEventAction({
    //   actionName: "openUrl",
    //   eventName: "click",
    //   data: { url },
    // });
    engine.entityManager.addEntity(entity);

    return entity;
  });

// entities[1].addEventAction({
//   actionName: "rotateObject",
//   eventName: "click",
//   data: { rotX: 0.01, rotY: 0.04, rotZ: 0.1 },
// });
(window as any).nn = engine;
(window as any).vv = viewportSystem;
(window as any).q = entity3;
window.addEventListener("resize", () => {
  viewportSystem.resize();
});

// entities[0].object3d.scale.multiplyScalar(2);
