import { useEffect } from "react";
import { useLoader, useThree } from "react-three-fiber";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import * as THREE from "three";
export default function Environment({ background = false }) {
  const { gl, scene } = useThree();
  const texture = useLoader(RGBELoader, "/aft_lounge_1k.hdr");
  useEffect(() => {
    const gen = new THREE.PMREMGenerator(gl);
    const envMap = gen.fromEquirectangular(texture).texture;
    if (background) scene.background = envMap;
    scene.environment = envMap;
    texture.dispose();
    gen.dispose();
    return () => (scene.environment = scene.background = null);
  }, [texture]);
  return null;
}
