type EventCallback<T> = (data: T) => void;
type eventType = string;

export class EventManager {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private _events: Map<string, Set<EventCallback<any>>> = new Map();

  // Subscribe to an event with a callback
  on<T>(event: eventType, callback: EventCallback<T>): void {
    if (!this._events.has(event)) {
      this._events.set(event, new Set());
    }
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    this._events.get(event)?.add(callback as EventCallback<any>);
  }

  // Unsubscribe from an event
  off<T>(event: eventType, callback: EventCallback<T>): void {
    if (!this._events.has(event)) return;

    const callbacks = this._events.get(event);
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    callbacks?.delete(callback as EventCallback<any>);

    if (callbacks?.size === 0) {
      this._events.delete(event);
    }
  }

  // Emit an event with data
  emit<T>(event: eventType, data?: T): void {
    const callbacks = this._events.get(event);
    if (!callbacks) return;
    for (const cb of callbacks) {
      cb(data)
    }
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

export const EVENT_NAMES = {
  componentAddedToEntity: "new-component-added",
  componentRemoveFromEntity: "component-removed",

  entityAdding: "adding-entity",
  entityAdded: "added-entity",
  entityActivate: "activate-entity",
  entityOnScene: "entity-on-scene",
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

  requestNewEntity: 'entity-manager-request-new-entity',
  activateEntity: 'entity-manager-request-new-entity',

  click: "click",
};

export const globalEventManager = new EventManager();