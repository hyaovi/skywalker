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