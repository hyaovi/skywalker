import * as THREE from "three";
import Stats from "stats.js";

import { EVENT_NAMES } from "./base/EventManager";
import { Engine } from "./main/Engine";

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






























// old utils
// type observableMapType = SystemMapType | EntityMapType | ComponentMapType;
type observableMapType<T> = Map<string, T>; // Adjust according to the actual type of map you use

export function makeObservableMap<T>(
  map: observableMapType<T>,
  notify: (changeName: string) => void
) {
  return new Proxy(map, {
    get(target: observableMapType<T>, prop: PropertyKey, receiver: any) {
      if (prop === "size") {
        return target.size;
      }
      // if (prop === "values") {
      //   return Reflect.get(...arguments);
      // }

      const value = Reflect.get(target, prop, receiver);
      if (["values", "entries", "keys"].includes(prop.toString())) {
        return value.bind(target);
      }

      if (
        typeof value === "function" &&
        ["set", "delete", "clear"].includes(value.name)
      ) {
        console.log(value.name, prop, receiver);
        notify(value.name);
      }
      return typeof value === "function"
        ? (...args: any[]) => value.bind(target)(args)
        : value;
    },
  });
}

export function createTimeableFunction(
  fn: () => void,
  from: number = 0,
  duration: number = 5000,
  autoInit = true,
  debug = true
) {
  let stopId: any;
  let startId: any;
  let isCallable = false;
  let inited = false;

  const stop = () => {
    [startId, stopId].forEach((id) => {
      if (id) clearTimeout(id);
    });
  };
  const init = () => {
    if (inited) return;
    inited = true;
    startId = setTimeout(() => {
      console.log("@ time started");
      isCallable = true;
      stopId = setTimeout(() => {
        isCallable = false;
        console.log("@ time finished");
      }, from + duration);
    }, from);
  };
  if (autoInit) init();
  const proxiedFunction = new Proxy(fn, {
    apply(target, thisArg, argArray: []) {
      if (isCallable) {
        if (debug) {
          console.log("calling", isCallable);
        }
        return target.apply(thisArg, argArray);
      } else {
        if (debug) return console.log("time out");
        return undefined;
      }
    },
  });
  return { proxiedFunction, meta: { from, duration, init, stop } };
}

class TestTimable {
  name: string;
  callback!: () => void;

  constructor(name: string) {
    this.name = name;
  }
  addTimable(fn: () => void, from: number, duration: number) {
    const { proxiedFunction, meta } = createTimeableFunction(
      fn,
      from,
      duration,
      false,
      true
    );
    meta.init();
    this.callback = proxiedFunction.bind(this);
  }
}