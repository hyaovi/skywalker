import { Entity } from ".";
import { BaseComponent, System } from "../base";
import { EVENT_NAMES } from "../base/EventManager";

export class MotionComponent extends BaseComponent {
  constructor() {
    super();
  }
}

export class MotionSystem extends System<Entity> {
    // the goal here is to make movable object , eg : move entity with 'WASD' or arrow keys
  constructor() {
    super([MotionComponent.name]);
  }
  init(): void {
    if (this.inited) return;
    this.subscribe(
      EVENT_NAMES.entityOnScene,
      ({ entityId }: { entityId: Entity["id"] }) => {
        // setup motion
        const entity = this.getEntityById(entityId);
        if (entity?.hasComponentType(MotionComponent.name)) {
          console.log(`setup motion`);
        }
      }
    );
  }
}
