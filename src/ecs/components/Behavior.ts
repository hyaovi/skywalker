import { pointerEventsType } from "../systems/ViewportSystem";
import { BaseComponent } from "./BaseComponent";

export class Behavior extends BaseComponent {
  readonly isBehavior: boolean;
  eventType?: pointerEventsType;
  _action!: <T>(args: T) => void;
  constructor(eventType?: pointerEventsType, action?: Behavior["_action"]) {
    super();
    this.isBehavior = true;
    if (eventType) this.eventType = eventType;
    if (action) this._action = action;
    this.action = this.action.bind(this);
  }

  action(args: any) {
    if (this._action) {
      this._action(args);
      return;
    }
    throw new Error(`The "action" method is not implemented!`);
  }
}
