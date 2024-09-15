import * as THREE from "three";
import { OrbitControls, TransformControls } from "three/examples/jsm/Addons.js";

import { System } from "../BaseEcs";
import { Entity } from ".";
import { EVENT_NAMES } from "../BaseEcs/EventManager";
import { Object3DType } from "../sharedTypes";

class Controls {
  orbit!: OrbitControls;
  transform!: TransformControls;

  constructor(camera: THREE.Camera, domElement: HTMLCanvasElement) {
    this.orbit = new OrbitControls(camera, domElement);
    this.transform = new TransformControls(camera, domElement);
    this.init();
  }
  init() {
    this.transform.addEventListener("dragging-changed", (event) => {
      this.orbit.enabled = !event.value;
    });
  }
  select(entity: Entity) {
    this.deselect();
    this.transform.attach(entity.object3d);
  }
  deselect() {
    if (this.transform.dragging) return;
    this.transform.detach();
  }
  update(_delta: number): void {}
  render(delta: number) {
    this.orbit.update(delta);
  }
}

export class ViewportSystem extends System<Entity> {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  // controls
  controls: Controls;
  useRenderOnDemand: boolean = false;
  inited: boolean = false;
  raycaster: THREE.Raycaster;
  pointer: THREE.Vector2;
  getObjects!: () => Object3DType[];
  intersected?: {
    entityId: Entity["id"];
    object: Object3DType;
  };
  params: { [key: string]: any };
  constructor() {
    super([]);
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.01, 1000);

    this.controls = new Controls(this.camera, this.domElement);
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.params = {
      scene: {
        bg: "0x333333",
      },
    };
  }
  get domElement() {
    return this.renderer.domElement;
  }
  init() {
    if (this.inited) return;
    this.camera.position.set(0, 45, 50);
    this.camera.lookAt(new THREE.Vector3());

    // this.renderer.setClearColor(0x333333);
    this.renderer.setClearColor(0xffffff);

    this.renderer.setPixelRatio(Math.max(1.5, window.devicePixelRatio));
    this.resize();
    if (this.controls) {
      this.scene.add(this.controls.transform);
    }
    this.subscribe(EVENT_NAMES.entityActivate, (data: { entityId: string }) => {
      const entity = this.getEntityById(data.entityId);
      if (entity) this.addEntityToScene(entity);
    });

    this.initiatePointerDown();

    super.init();
    this.inited = true;
  }
  update(): void {
    this.render();
  }
  destroy() {
    // destroy viewport elements
  }
  addEntityToScene(entity: Entity) {
    if (!entity.object3d.userData.entityId) {
      this.scene.add(entity.object3d);
      entity.object3d.userData.entityId = entity.id;
      entity.isOnScene = true;
    }
  }
  removeEntityFromScene(entity: Entity) {
    if (this.controls.transform?.object?.uuid == entity.object3d.uuid) {
      this.controls.transform.detach();
    }
    this.scene.remove(entity.object3d);
    entity.isOnScene = false;
  }
  render() {
    this.renderer.autoClear = true;
    this.renderer.render(this.scene, this.camera);
    this.renderer.autoClear = true;
  }
  resize(width?: number, height?: number) {
    const innerWidth = width || window.innerWidth;
    const innerHeight = height || window.innerHeight;

    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
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
      if (this.controls.transform.object?.uuid !== object.uuid) {
        this.controls.transform.attach(object);
      }
      return this.intersected;
    }
    this.controls.deselect();
    return undefined;
  }

  // events
  // initiate domEvents
  initiatePointerDown() {
    this.domElement.addEventListener("click", (event) => {
      const selected = this.intersect(event);
      if (selected) {
        this.broadcast(EVENT_NAMES.entityClicked, {
          entityId: selected.entityId,
        });
      }
    });
  }
}
