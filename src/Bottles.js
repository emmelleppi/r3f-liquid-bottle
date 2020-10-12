import * as THREE from "three";
import React, { useEffect, useRef } from "react";
import { useFrame, useLoader, useResource, useThree } from "react-three-fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { draco } from "drei/loaders/draco";
import { useTextureLoader } from "drei/loaders/useTextureLoader";
import lerp from "lerp";
import clamp from "lodash/clamp";
import { useCylinder } from "use-cannon";
import usePostprocessing from "./use-postprocessing";
import { frag, vert } from "./materials/backfaceMaterial";
import {
  frag as fragRefraction,
  vert as vertRefraction,
} from "./materials/refractionMaterial";
import { useDragConstraint } from "./mouse";
import { PerspectiveCamera } from "drei";

function Bottle() {
  const bubbleMaterial = useRef();

  const wobbleAmountToAddX = useRef(0);
  const wobbleAmountToAddZ = useRef(0);
  const lastPos = useRef(new THREE.Vector3());
  const lastRot = useRef(new THREE.Vector3());

  const bodyArgs = [2.5, 3, 20, 32];
  const [ref] = useCylinder(() => ({
    mass: 1,
    args: bodyArgs,
    position: [0, 20, 0],
    rotation: [0, -1.8, 0],
    linearDamping: 0.0,
    angularDamping: 0.75,
  }));
  const bind = useDragConstraint(ref);

  const recovery = 10;
  const wobbleSpeed = 0.1;
  const maxWobble = 0.03;

  const { nodes } = useLoader(GLTFLoader, "/coca-bottle.glb", draco());

  const { size } = useThree();

  const refCameraLayer1 = useResource();
  const refCameraLayer2 = useResource();
  const [savePassEnv, savePassBackface] = usePostprocessing(
    refCameraLayer1.current,
    refCameraLayer2.current
  );

  const [tassoni] = useTextureLoader(["/tassoni.png"]);
  tassoni.center = new THREE.Vector2(0.5, 0.5);
  tassoni.rotation = -Math.PI / 2;
  tassoni.repeat = new THREE.Vector2(-1, 1);

  useEffect(() => {
    refCameraLayer1.current.lookAt(0, 0, 0);
    refCameraLayer2.current.lookAt(0, 0, 0);
  }, [refCameraLayer1, refCameraLayer2]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() * 10;
    const _delta = clock.getDelta();
    const delta = _delta > 0 ? _delta : 0.01;

    // decrease wobble over time
    wobbleAmountToAddX.current = lerp(
      wobbleAmountToAddX.current,
      0,
      delta * recovery
    );
    wobbleAmountToAddZ.current = lerp(
      wobbleAmountToAddZ.current,
      0,
      delta * recovery
    );

    // make a sine wave of the decreasing wobble
    const pulse = 2 * Math.PI * wobbleSpeed;
    const wobbleAmountX = wobbleAmountToAddX.current * Math.sin(pulse * time);
    const wobbleAmountZ = wobbleAmountToAddZ.current * Math.cos(pulse * time);

    // send it to the shader
    bubbleMaterial.current.material.uniforms.wobbleX.value = wobbleAmountX;
    bubbleMaterial.current.material.uniforms.wobbleZ.value = wobbleAmountZ;

    // velocity
    const velocity = lastPos.current.clone();
    velocity.sub(ref.current.position).divideScalar(delta);
    const angularVelocity = ref.current.rotation.clone().toVector3();
    angularVelocity.sub(lastRot.current);

    // add clamped velocity to wobble
    wobbleAmountToAddX.current += clamp(
      (velocity.x + angularVelocity.z * 0.2) * maxWobble,
      -maxWobble,
      maxWobble
    );
    wobbleAmountToAddZ.current += clamp(
      (velocity.z + angularVelocity.x * 0.2) * maxWobble,
      -maxWobble,
      maxWobble
    );

    // keep last position
    lastPos.current = ref.current.position.clone();
    lastRot.current = ref.current.rotation.clone().toVector3();
    bubbleMaterial.current.material.uniforms.fillAmount.value =
      -ref.current.position.y + 7;
  });

  return (
    <>
      <PerspectiveCamera
        ref={refCameraLayer1}
        args={[15]}
        position={[0, 0, 130]}
        layers={[1]}
      />
      <PerspectiveCamera
        ref={refCameraLayer2}
        args={[15]}
        position={[0, 0, 130]}
        layers={[2]}
      />
      <group ref={ref} dispose={null} {...bind}>
        <group position={[0, 10.01, 0]}>
          <mesh geometry={nodes["Mesh.002_0"].geometry}>
            <meshPhysicalMaterial color="green" metalness={1} roughness={1} />
          </mesh>
          <mesh geometry={nodes["Mesh.002_1"].geometry} castShadow>
            <meshPhysicalMaterial metalness={1} roughness={0} clearcoat={1} />
          </mesh>
        </group>
        <group position={[0, -0.04, 0]} scale={[0.98, 0.98, 0.98]}>
          <mesh ref={bubbleMaterial} geometry={nodes.Coca_Outside.geometry}>
            <shaderMaterial
              transparent
              vertexShader={vertRefraction}
              fragmentShader={fragRefraction}
              uniforms={{
                envMap: { value: savePassEnv.renderTarget.texture },
                backfaceMap: { value: savePassBackface.renderTarget.texture },
                resolution: {
                  value: new THREE.Vector2(size.width, size.height),
                },
                fillAmount: {
                  value: 0,
                },
                wobbleX: {
                  value: 0.01,
                },
                wobbleZ: {
                  value: 0.01,
                },
                topColor: {
                  value: new THREE.Vector4(0, 0, 1, 0),
                },
                rimColor: {
                  value: new THREE.Vector4(1, 1, 1, 1),
                },
                foamColor: {
                  value: new THREE.Vector4(1, 1, 1, 1),
                },
                tint: {
                  value: new THREE.Vector4(1, 1, 0, 0.75),
                },
                rim: {
                  value: 0.05,
                },
                rimPower: {
                  value: 1,
                },
              }}
            />
          </mesh>
          <mesh layers={[2]} geometry={nodes.Coca_Outside.geometry}>
            <shaderMaterial
              transparent
              side={THREE.BackSide}
              vertexShader={vert}
              fragmentShader={frag}
            />
          </mesh>
        </group>
        <mesh geometry={nodes.Coca_Outside.geometry} position={[0, -0.04, 0]}>
          <meshPhysicalMaterial
            transparent
            side={THREE.BackSide}
            transmission={0.7}
            metalness={1}
            roughness={0}
            clearcoat={1}
            clearcoatRoughness={0}
            opacity={0.15}
          />
        </mesh>
        <mesh
          geometry={nodes.Coca_Outside.geometry}
          position={[0, -0.04, 0]}
          castShadow
        >
          <meshPhysicalMaterial
            transparent
            transmission={0.1}
            metalness={1}
            roughness={0}
            clearcoat={1}
            clearcoatRoughness={0}
            opacity={0.15}
          />
        </mesh>
        <mesh geometry={nodes.Label.geometry} position={[1.69, 0.84, -0.01]}>
          <meshPhysicalMaterial
            transparent
            alphaTest={0.8}
            side={THREE.DoubleSide}
            metalness={0.3}
            roughness={1}
            clearcoat={0}
            clearcoatRoughness={0}
            map={tassoni}
          />
        </mesh>
      </group>
    </>
  );
}

export default function Bottles(props) {
  const group = useRef();
  return (
    <group ref={group} {...props} dispose={null}>
      <Bottle />
    </group>
  );
}
