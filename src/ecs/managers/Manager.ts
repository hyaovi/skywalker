import { Base, EVENT_NAMES } from "../base";
import { IModelParams, MeshComponent, meshParamsMapType } from "../components";
import { Entity } from "../entities";
import { globalLoader } from "../loaders";
import { IPrimitiveParams, Object3DType } from "../sharedTypes";
import { System } from "../systems";
import { loopThroughMapValues } from "../utils";
import { createLight, createPrimitiveMesh, ILightParams } from "../utils/ObjectFactory";
import { Query } from "./Query";


export type SystemClass<T extends System> = new () => T;


class Manager extends Base {
    systems: Map<string, System> = new Map();
    entities: Map<string, Entity> = new Map();
    private idcounters: number = 0
    constructor() {
        super()
    }
    protected getNewId(): string {
        this.idcounters++;
        return this.idcounters.toString()
    }
    addSystem<T extends System>(system: T): T {
        system.id = this.getNewId();
        this.systems.set(system.systemType, system);
        system.init();
        system.start();
        return system
    }
    // getSystem<T extends System>(systemClass: SystemClass<T>): T | undefined {
    getSystem<T extends System>(systemClass: new (...args: any[]) => T) {
        return this.systems.get(systemClass.name)
    }
    removeSystem<T extends System>(systemClass: SystemClass<T>): boolean {
        return this.systems.delete(systemClass.name)
    }
    createEntity(object3d?: Object3DType): Entity {
        const entity = new Entity(object3d);
        entity.id = this.getNewId();
        entity.init();
        this.entities.set(entity.id, entity);
        this.broadcast(EVENT_NAMES.entityAdded)
        return entity
    }
    async createEntityWithParams<MeshType extends keyof meshParamsMapType>(type: MeshType, params: meshParamsMapType[MeshType]): Promise<Entity> {
        let mesh: Object3DType;

        switch (type) {
            case 'light':
                mesh = createLight(params as ILightParams)
                break;
            case 'primitive':
                mesh = createPrimitiveMesh(params as IPrimitiveParams)
                break
            case 'model':
                const model = await globalLoader.loadGLTF((params as IModelParams).url);
                mesh = model.scene;
                mesh.animations = model.animations;
                break
            default:
                throw new Error(`unknown type: ${type}`)
        }
        const entity = this.createEntity(mesh);
        entity.addComponent(new MeshComponent({ type, params }))
        return entity

    }
    activateEntity(_entity: Entity) {
        const entity = this.getEntityById(_entity.id);
        if (entity) {
            this.broadcast(EVENT_NAMES.entityActivate, { entityId: entity.id });
            entity.isActive = true;
            entity.start();
        }
    }
    getEntityById(entityId: string): Entity | undefined {
        return this.entities.get(entityId)
    }
    removeEntity(entityId: string): boolean {
        // might need some clean up before remove
        const entity = this.getEntityById(entityId);
        if (entity) entity.destroy()
        return this.entities.delete(entityId)
    }
    filterEntities(cb: (entity: Entity) => boolean) {
        return [...this.entities.values()].filter(cb);
    }
    // lifecycles
    init(): void {
        if (this.inited) return;
        loopThroughMapValues(this.systems, (system) => system.init())
        loopThroughMapValues(this.entities, (entities) => entities.init())
        this.inited = true
    }
    start(): void {
        loopThroughMapValues(this.systems, (system) => system.start())
        loopThroughMapValues(this.entities, (entities) => entities.start())
    }
    update(_delta: number): void {
        loopThroughMapValues(this.systems, (system) => {
            if (system.needsUpdateCalls) { system.update(_delta) }
        })
    }
    getEntitiesByComponentType(_componentTypes: string[]): Entity[] {
        const entities: Entity[] = [];
        const componentTypes = new Set(_componentTypes);
        loopThroughMapValues(this.entities, (entity) => {
            let isMatch = false;
            for (const componentType of componentTypes) {
                isMatch = entity.hasComponentType(componentType);
            }
            if (isMatch) entities.push(entity)
        })
        return entities
    }
    getQuery() {
        return new Query()
    }
}


export const manager = new Manager();

