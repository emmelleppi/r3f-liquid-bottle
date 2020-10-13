import * as THREE from "three";
import React, { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "react-three-fiber";
import { useTextureLoader, Torus } from "drei";
import { frag, vert } from "./materials/liquidMaterial";
import clamp from "lodash/clamp";
import lerp from "lerp";
import Environment from "./Environment";

function Background() {
  const { scene } = useThree();
  const texture = useTextureLoader("/aft_lounge.jpg");

  useEffect(() => {
    scene.background = texture;
  }, [scene, texture]);

  return null;
}

function Liquid(props) {
  const ref = useRef();
  const bubbleMaterial = useRef();

  const wobbleAmountToAddX = useRef(0);
  const wobbleAmountToAddZ = useRef(0);
  const lastPos = useRef(new THREE.Vector3());
  const lastRot = useRef(new THREE.Vector3());

  const recovery = 4;
  const wobbleSpeed = 1;
  const maxWobble = 0.01;

  const { size, viewport } = useThree();

  useFrame(({ clock, mouse }) => {
    if (ref.current) {
      const time = clock.getElapsedTime();
      const _delta = clock.getDelta();
      const delta = _delta > 0 ? _delta : 0.01;

      const mouseX = (mouse.x * viewport.width) / 2;
      const mouseY = (mouse.y * viewport.height) / 2;

      ref.current.position.x = mouseX * 2;
      ref.current.position.y = mouseY * 2;
      ref.current.rotation.x += 0.01;

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
        -ref.current.position.y + 0.2;
    }
  });

  return (
    <>
      <group {...props} ref={ref} dispose={null}>
        <Torus args={[1, 0.5, 64, 64]} renderOrder={0}>
          <meshPhysicalMaterial
            side={THREE.BackSide}
            transmission={0.1}
            metalness={1}
            roughness={0}
            transparent
            clearcoat={1}
            color={0x00ffff}
            opacity={0.3}
          />
        </Torus>
        <Torus args={[1, 0.5, 64, 64]} renderOrder={1}>
          <meshPhysicalMaterial
            transmission={0.7}
            metalness={1}
            roughness={0}
            transparent
            clearcoat={1}
            color={0x00ffff}
            opacity={0.3}
          />
        </Torus>
        <Torus
          renderOrder={0}
          ref={bubbleMaterial}
          args={[1, 0.5, 64, 64]}
          scale={[0.99, 0.99, 0.99]}
        >
          <shaderMaterial
            transparent
            vertexShader={vert}
            fragmentShader={frag}
            side={THREE.DoubleSide}
            uniforms={{
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
                value: new THREE.Vector4(128 / 255, 0, 1, 0.7),
              },
              rimColor: {
                value: new THREE.Vector4(1, 1, 1, 1),
              },
              foamColor: {
                value: new THREE.Vector4(128 / 255, 0, 1, 0.7),
              },
              tint: {
                value: new THREE.Vector4(1, 0, 1, 0.7),
              },
              rim: {
                value: 0.02,
              },
              rimPower: {
                value: 1,
              },
            }}
          />
        </Torus>
      </group>
    </>
  );
}

export default function App() {
  return (
    <>
      <Canvas
        pixelRatio={2}
        colorManagement
        camera={{ position: [0, 0, 5], fov: 15 }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[0, -0, 10]} intensity={2} />
        <Suspense fallback={null}>
          <Liquid position={[0, 0, -10]} />
          <Environment />
          <Background />
        </Suspense>
      </Canvas>
    </>
  );
}
