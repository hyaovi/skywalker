type EventCallback<T> = (data: T) => void;
type eventType = string;

export class EventManager {
  private _events: Map<string, Set<EventCallback<any>>> = new Map();

  // Subscribe to an event with a callback
  on<T>(event: eventType, callback: EventCallback<T>): void {
    if (!this._events.has(event)) {
      this._events.set(event, new Set());
    }
    this._events.get(event)!.add(callback as EventCallback<any>);
  }

  // Unsubscribe from an event
  off<T>(event: eventType, callback: EventCallback<T>): void {
    if (!this._events.has(event)) return;

    const callbacks = this._events.get(event)!;
    callbacks.delete(callback as EventCallback<any>);

    if (callbacks.size === 0) {
      this._events.delete(event);
    }
  }

  // Emit an event with data
  emit<T>(event: eventType, data?: T): void {
    if (!this._events.has(event)) return;

    this._events.get(event)!.forEach((callback) => callback(data));
  }

  // Subscribe to an event with a callback that will be invoked only once
  once<T>(event: eventType, callback: EventCallback<T>): void {
    const onceCallback: EventCallback<T> = (data: T) => {
      callback(data);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }
  get events() {
    return this._events;
  }
}
export const eventManager = new EventManager();

export const EVENT_NAMES = {
  componentAddedToEntity: "new-component-added",
  componentRemoveFromEntity: "component-removed",

  entityAdding: "adding-entity",
  entityAdded: "added-entity",
  entityActivate: "activate-entity",
  entityRemoving: "removing-entity",
  entityRemoved: "removed-entity",
  entityClicked: "entity-click",

  systemAdding: "system-adding",
  systemAdded: "system-added",
  systemRemoving: "system-removing",
  systemRemoved: "system-removed",
  systemsUpdated: "systems-updated",

  engineInited: "engine-inited",
  engineStarted: "engine-started",
  engineUpdate: "engine-update",

  click: "click",
};
