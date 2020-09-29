import * as THREE from "three";

export const material = {
  inner: new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#fff").convertSRGBToLinear(),
    transparent: true,
    side: THREE.BackSide,
    transmission: 0.5,
    metalness: 1,
    roughness: 0,
  }),
  outer: new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#fff").convertSRGBToLinear(),
    transparent: true,
    transmission: 0.7,
    metalness: 1,
    roughness: 0,
  }),
  cap: new THREE.MeshStandardMaterial({ color: new THREE.Color("#040404") }),
  liquid: new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("yellow"),
    transparent: true,
    transmission: 0.5,
  }),
};
