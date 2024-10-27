import * as THREE from "three";
import { GLTF } from "three/examples/jsm/Addons.js";

export class Loader {
  manager: THREE.LoadingManager;
  constructor() {
    const onLoad = () => console.log("@@ starting loading");
    const onError = (url: string) =>
      console.log("@@ something went wrong", url);
    const onProgress = (url: string, loaded: number, total: number) =>
      console.log("@@ progress", url, loaded, total);
    this.manager = new THREE.LoadingManager(onLoad, onProgress, onError);

    this.loadGLTF = this.loadGLTF.bind(this);
  }
  private async createGLTFLoader() {
    const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
    const { DRACOLoader } = await import("three/addons/loaders/DRACOLoader.js");
    const { KTX2Loader } = await import("three/addons/loaders/KTX2Loader.js");
    const { MeshoptDecoder } = await import(
      "three/addons/libs/meshopt_decoder.module.js"
    );

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("../examples/jsm/libs/draco/gltf/");

    const ktx2Loader = new KTX2Loader(this.manager);
    ktx2Loader.setTranscoderPath("../examples/jsm/libs/basis/");

    const loader = new GLTFLoader(this.manager);
    loader.setDRACOLoader(dracoLoader);
    loader.setKTX2Loader(ktx2Loader);
    loader.setMeshoptDecoder(MeshoptDecoder);

    return loader;
  }
  async loadGLTF(url: string) {
    const loader = await this.createGLTFLoader();
    return new Promise<GLTF>((resolve, reject) => {
      loader.load(
        url,
        (data) => {
          loader?.dracoLoader?.dispose();
          loader?.ktx2Loader?.dispose();
          resolve(data);
        },
        undefined,
        (error: unknown) => {
          reject(error);
        }
      );
    });
  }
  init() {}
}

export const globalLoader = new Loader();
