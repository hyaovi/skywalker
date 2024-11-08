import { Base, EVENT_NAMES } from "../base";
import type { Component } from "../components";
import type { Entity } from "../entities";
import { loopThroughMapValues } from "../utils";
import { manager } from "./Manager";

type componentTypeType = Component["componentType"];
export class Query extends Base {
  entities = manager.entities;
  componentTypes: Set<componentTypeType> = new Set();
  protected queryResults: Entity[] | null = null;
  constructor() {
    super();
    // setup listenner
    const invavlideCache = this.invalidateCache.bind(this);
    this.subscribe(EVENT_NAMES.entityAdded, invavlideCache);
    this.subscribe(EVENT_NAMES.entityRemoved, invavlideCache);
    this.subscribe(EVENT_NAMES.componentAddedToEntity, invavlideCache);
    this.subscribe(EVENT_NAMES.componentRemoveFromEntity, invavlideCache);
  }
  setFilter(componentTypes: componentTypeType[]) {
    this.componentTypes.clear();
    for (const componentType of componentTypes) {
      this.componentTypes.add(componentType)
    }
  }
  execute(): Entity[] {
    if (!this.queryResults) {
      const results: Entity[] = [];
      loopThroughMapValues(this.entities, entity => {
        let isMatch = false;
        for (const componentType of this.componentTypes) {
          isMatch = entity.hasComponentType(componentType);
        }
        if (isMatch) results.push(entity);
      });
      this.queryResults = results;
    }
    return this.queryResults;
  }
  invalidateCache() {
    this.queryResults = null;
  }
}
