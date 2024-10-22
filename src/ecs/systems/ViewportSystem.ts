import * as THREE from "three";
import { OrbitControls, TransformControls } from "three/examples/jsm/Addons.js";

import { EVENT_NAMES } from "../base/EventManager";
import { Object3DType, ObjectHelperType } from "../sharedTypes";
import { Entity } from "../entities/Entity";
import { makeHelper } from "../utils/ObjectFactory";
import { System } from "./System";

export interface IViewportParams {
  clearColor?: number | THREE.Color;
  useShadow?: boolean;
  useHelper?: boolean;
  useTransformControls?: boolean;
  size?: number;
  useRenderOnDemand?: boolean;
}
interface IViewportSettings extends IViewportParams {
  clearColor: number | THREE.Color;
  useShadow: boolean;
  useHelper: boolean;
  useTransformControls: boolean;
  useRenderOnDemand: boolean;
  size: number;
}
export const defaultViewportSetting: IViewportSettings = {
  clearColor: 0xd1d3d0,
  useShadow: true,
  useHelper: true,
  useTransformControls: true,
  size: 150,
  useRenderOnDemand: false,
};

export const pointerEvents = [
  "click",
  "pointerdown",
  "pointerup",
  "pointermove",
] as const;
export type pointerEventsType = (typeof pointerEvents)[number];

class Controls {
  orbit!: OrbitControls;
  transform?: TransformControls;
  settings: {
    useTransform?: boolean;
  } = {
    useTransform: true,
  };

  constructor(
    camera: THREE.Camera,
    domElement: HTMLCanvasElement,
    settings: Controls["settings"] = {}
  ) {
    this.settings = { ...this.settings, ...settings };
    this.orbit = new OrbitControls(camera, domElement);
    if (this.settings.useTransform) {
      this.transform = new TransformControls(camera, domElement);
    }

    this.init();
  }
  init() {
    this.transform?.addEventListener("dragging-changed", (event) => {
      this.orbit.enabled = !event.value;
    });
  }
  select(entity: Entity) {
    this.deselect();
    if (this.settings.useTransform) {
      this.transform?.attach(entity.object3d);
    }
    this.highlight(entity);
  }
  highlight(entity: Entity) {
    const helper = entity.helper;
    if (helper) {
      helper.visible = true;
    }
  }
  unHighlight(entity: Entity) {
    const helper = entity.helper;
    if (helper) {
      helper.visible = false;
    }
  }
  deselect() {
    if (this.settings.useTransform) {
      if (this.transform?.dragging) return;
      this.transform?.detach?.();
    }
  }
  update(_delta: number): void {}
  render(delta: number) {
    this.orbit.update(delta);
  }
}

export class ViewportSystem extends System {
  scene: THREE.Scene;
  sceneHelper: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  mixer: THREE.AnimationMixer;
  // controls
  controls: Controls;
  useRenderOnDemand: boolean;
  shouldRender: boolean;
  inited: boolean = false;
  raycaster: THREE.Raycaster;
  pointer: THREE.Vector2;
  getObjects!: () => Object3DType[];
  intersected?: {
    entityId: Entity["id"];
    object: Object3DType;
  };
  highlightedHelper!: ObjectHelperType;
  settings: IViewportSettings = { ...defaultViewportSetting };
  constructor(settings?: IViewportParams) {
    const componentsTypes = ["*"];
    super(componentsTypes);
    this.settings = {
      ...this.settings,
      ...defaultViewportSetting,
      ...settings,
    };
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.01, 1000);
    this.mixer = new THREE.AnimationMixer(this.scene);
    this.sceneHelper = new THREE.Scene();
    this.useRenderOnDemand = this.settings.useRenderOnDemand;
    this.shouldRender = !this.useRenderOnDemand;

    if (this.settings.useShadow) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.controls = new Controls(this.camera, this.domElement, {
      useTransform: this.settings.useTransformControls,
    });
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.pointerEventCallback = this.pointerEventCallback.bind(this);
  }
  get domElement() {
    return this.renderer.domElement;
  }
  init() {
    if (this.inited) return;
    this.camera.position.set(0, 20, 30);
    this.camera.lookAt(new THREE.Vector3());

    this.renderer.setClearColor(this.settings.clearColor);

    this.renderer.setPixelRatio(Math.max(1, window.devicePixelRatio));
    this.resize();
    if (this.controls.transform) {
      this.scene.add(this.controls.transform);
    }
    this.subscribe(EVENT_NAMES.entityActivate, (data: { entityId: string }) => {
      const entity = this.getEntityById(data.entityId);
      if (entity) this.addEntityToScene(entity);
    });

    pointerEvents.forEach((pointerEvent) => {
      this.domElement.addEventListener(
        pointerEvent,
        this.createThrottledPointerEvent()
      );
    });
    // render on demand for controls
    if (this.useRenderOnDemand) {
      this.controls?.orbit?.addEventListener("change", () => {
        this.requestRender();
      });
      this.controls?.transform?.addEventListener("change", () => {
        this.requestRender();
      });
    }
    this.requestRender();
    super.init();
    this.inited = true;
  }
  requestRender() {
    this.shouldRender = true;
  }
  update(delta: number): void {
    if (!this.useRenderOnDemand) {
      this.requestRender();
    }
    if (this.shouldRender) {
      this.render(delta);
    }
  }
  destroy() {
    // destroy viewport elements
  }
  addEntityToScene(entity: Entity) {
    if (!entity.object3d.entityId) {
      this.scene.add(entity.object3d);
      entity.object3d.entityId = entity.id;
      entity.object3d.userData.entityId = entity.id;
      entity.isOnScene = true;

      // add helper on editor mode
      this.makeHelper(entity);
      if (this.settings.useHelper && entity.helper) {
        this.sceneHelper.add(entity.helper);
        entity.object3d.userData.helper = entity.helper;
      }
      this.broadcast(EVENT_NAMES.entityOnScene, { entityId: entity.id });
    }
  }
  removeEntityFromScene(entity: Entity) {
    if (this.controls.transform?.object?.uuid == entity.object3d.uuid) {
      this?.controls?.transform?.detach();
    }
    this.scene.remove(entity.object3d);
    // cleanup animation if any
    if (entity.object3d?.animations.length > 0) {
      this.mixer.uncacheRoot(entity.object3d);
    }
    entity.isOnScene = false;
  }
  render(delta: number) {
    if (this.highlightedHelper) {
      this.highlightedHelper.update();
    }
    this.renderer.autoClear = true;
    this.renderer.render(this.sceneHelper, this.camera);
    this.renderer.autoClear = false;
    this.renderer.render(this.scene, this.camera);
    this.renderer.autoClear = true;
    this.mixer.update(delta / 1000);
    if (this.useRenderOnDemand) {
      this.shouldRender = false;
    }
  }
  resize(width?: number, height?: number) {
    const innerWidth = width || window.innerWidth;
    const innerHeight = height || window.innerHeight;

    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);

    this.requestRender();
  }
  intersect(event: PointerEvent | MouseEvent) {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const objects = this.getObjects();
    const intersects = this.raycaster.intersectObjects(objects, true);
    if (intersects.length) {
      const object = intersects[0].object;
      const { entityId } = object.userData;
      this.intersected = {
        entityId,
        object,
      };
      return this.intersected;
    }

    return undefined;
  }

  // events
  // initiate domEvents
  pointerEventCallback(event: PointerEvent | MouseEvent) {
    if (this.controls?.transform?.dragging) return;
    const selected = this.intersect(event);
    if (selected) {
      this.broadcast(`entity-${event.type}`, {
        entityId: selected.entityId,
        event,
      });

      // handle event by type
      const entity = this.getEntityById(selected.entityId);

      const objectCurrentlyAttached =
        this.controls?.transform?.object?.uuid == selected.object.uuid;
      switch (event.type) {
        case "click": {
          if (!objectCurrentlyAttached && entity) {
            this.controls.select(entity);
          }
          break;
        }

        case "pointermove": {
          if (entity && entity?.helper?.uuid !== this.highlightedHelper?.uuid) {
            this.entities.forEach((entity) => {
              this.controls.unHighlight(entity);
            });
            this.controls.highlight(entity);
            this.highlightedHelper = entity?.helper;
          }
          break;
        }

        default:
          break;
      }
    } else {
      const isClickEvent = event.type === "click";
      const isPointerMove = event.type === "pointermove";
      isClickEvent && this.controls.deselect();
      if (isPointerMove && this.highlightedHelper) {
        this.highlightedHelper.visible = false;
        this.highlightedHelper = undefined;
      }
    }
  }
  createThrottledPointerEvent(timeout: number = 150) {
    let lastimeInvoked = 0;
    return (event: PointerEvent | MouseEvent) => {
      if (lastimeInvoked == 0) {
        this.pointerEventCallback(event);
        lastimeInvoked = event.timeStamp;
      } else {
        if (event.timeStamp - lastimeInvoked >= timeout) {
          this.pointerEventCallback(event);
          lastimeInvoked = event.timeStamp;
        }
      }
    };
  }
  makeHelper(entity: Entity) {
    if (!entity.isInteractive) return;
    if (entity.helper && entity.helper.parent) {
      entity.helper.removeFromParent();
      entity.helper.dispose();
    }
    const helper = makeHelper(entity.object3d);
    if (helper) {
      helper.visible = false;
    }
    entity.helper = helper;
    return entity.helper;
  }
}
