import { EVENT_NAMES } from "../base";
import { InteractableComponent } from "../components";
import { Entity } from "../entities";
import { System } from "./System";
import * as THREE from "three";

type EventType = PointerEvent | MouseEvent
export class InteractableSystem extends System {
    raycaster = new THREE.Raycaster();
    pointer: THREE.Vector2;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    private interactableMeshes: THREE.Mesh[] | null = null;

    constructor({ scene, camera, renderer }: { scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer }) {
        super([InteractableComponent.name])
        this.needsUpdateCalls = false;
        this.pointer = new THREE.Vector2();
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer
    }
    private initializeEventListeners() {
        this.subscribe(EVENT_NAMES.componentAddedToEntity, this.markEntity);
        this.subscribe(EVENT_NAMES.entityOnScene, this.markEntity);
        this.subscribe(EVENT_NAMES.entityRemoved, this.invalideInteractableMeshesCache);
        // meshes list 
        window.addEventListener('pointerdown', this.handlePointerDown);
    }
    init(): void {
        if (this.inited) return
        this.initializeEventListeners();
        this.inited = true
    }
    updateRaycaster(event: EventType) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.camera);
    }
    handlePointerDown = (event: EventType) => {
        this.updateRaycaster(event);
        const entity = this.intersectByEntities();
        if (entity) {
            this.broadcast(`entity-click`, {
                entityId: entity.id,
                event,
            });
            entity.emit('click', event)
        }
    }
    intersectByEntities(): Entity | undefined {
        const results: { distance: number, entity: Entity }[] = []
        this.query.execute().forEach(entity => {
            const meshes: THREE.Mesh[] = [];
            entity.sceneObject.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    meshes.push(child)
                }
            })
            const result = this.raycaster.intersectObjects(meshes, false)
            if (result.length) {
                const { distance } = result[0]
                results.push({ distance, entity })
            }
        })
        if (results.length) {
            results.sort((a, b) => a.distance - b.distance)
            return results[0].entity
        }
    }
    intersectEntity(): Entity | undefined {
        const objects = this.query.execute().map(entity => entity.sceneObject);
        const meshes: THREE.Mesh[] = [];
        objects.forEach(object => {
            object.traverse(child => {
                if (child instanceof THREE.Mesh && child.userData.entityId) {
                    meshes.push(child)
                }
            })
        })
        const result = this.raycaster.intersectObjects(meshes, !true);
        if (result.length && result[0].object.userData.entityId) {
            return this.getEntityById(result[0].object.userData.entityId)
        }
    }
    getInteractableMeshes() {
        if (!this.interactableMeshes) {
            const objects = this.query.execute().map(entity => entity.sceneObject);
            const meshes: THREE.Mesh[] = [];
            objects.forEach(object => {
                object.traverse(child => {
                    if (child instanceof THREE.Mesh && child.userData.entityId) {
                        meshes.push(child)
                    }
                })
            })
            this.interactableMeshes = meshes;
        }
        return this.interactableMeshes
    }
    invalideInteractableMeshesCache = () => {
        this.interactableMeshes = null;
    }
    markEntity = ({ entityId }: { entityId: Entity['id'] }) => {
        const entity = this.getEntityById(entityId);
        if (entity && entity.isOnScene && entity.hasComponentType(InteractableComponent.name)) {
            entity.sceneObject.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.userData.entityId = entity.id
                }
            })
            this.invalideInteractableMeshesCache()
        }
    }

    destroy(): void {
        this.unsubscribe(EVENT_NAMES.entityOnScene, this.invalideInteractableMeshesCache);
        this.unsubscribe(EVENT_NAMES.entityRemoved, this.invalideInteractableMeshesCache);
        this.unsubscribe(EVENT_NAMES.componentAddedToEntity, this.markEntity);
        // meshes list 
        window.addEventListener('pointerdown', this.handlePointerDown);
        this.invalideInteractableMeshesCache();
    }


}