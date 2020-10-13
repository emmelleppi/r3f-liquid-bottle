import { shaderMaterial } from "drei";

export const frag = `
varying vec3 worldNormal;
void main() {
gl_FragColor = vec4(worldNormal, 1.0);
}`;

export const vert = `
varying vec3 worldNormal;
void main() {

  vec4 transformedNormal = vec4(normal, 0.);
  vec4 transformedPosition = vec4(position, 1.0);
  #ifdef USE_INSTANCING
    transformedNormal = instanceMatrix * transformedNormal;
    transformedPosition = instanceMatrix * transformedPosition;
  #endif

  worldNormal = normalize( modelViewMatrix * transformedNormal).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * transformedPosition;
}`;

export const BackfaceMaterial = shaderMaterial(
  {},
  vert,
  frag
)