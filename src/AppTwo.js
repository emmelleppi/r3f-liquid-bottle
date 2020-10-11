import * as THREE from "three";
import React, { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "react-three-fiber";
import { Box, OrbitControls, Torus, useTextureLoader } from "drei";
import { frag, vert } from "./liquidShader";
import clamp from "lodash/clamp";
import lerp from "lerp";

function Marcello(props) {
  const ref = useRef();
  const ref2 = useRef();

  const wobbleAmountToAddX = useRef(0);
  const wobbleAmountToAddZ = useRef(0);
  const lastPos = useRef(new THREE.Vector3());
  const lastRot = useRef(new THREE.Vector3());

  const recovery = 4;
  const wobbleSpeed = 1;
  const maxWobble = 0.02;

  const { size, viewport } = useThree();
  const texture = useTextureLoader("/aft_lounge.jpg");

  useFrame(({ clock, mouse }) => {
    if (ref.current) {
      const time = clock.getElapsedTime();
      const _delta = clock.getDelta();
      const delta = _delta > 0 ? _delta : 0.016;

      const mouseX = (mouse.x * viewport.width) / 2;
      const mouseY = (mouse.y * viewport.height) / 2;

      ref.current.position.x = ref2.current.position.x = mouseX * 2;
      ref.current.position.y = ref2.current.position.y = mouseY * 2;
      ref.current.rotation.x = ref2.current.rotation.x = mouseX;
      ref.current.rotation.y = ref2.current.rotation.y = mouseY;

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
      ref.current.material.uniforms.wobbleX.value = wobbleAmountX;
      ref.current.material.uniforms.wobbleZ.value = wobbleAmountZ;

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

      ref.current.material.uniforms.fillAmount.value =
        -ref.current.position.y + 0.2;
    }
  });

  return (
    <>
      <Box
        ref={ref}
        {...props}
        args={[1, 1, 1, 32, 32, 32]}
        scale={[0.99, 0.99, 0.99]}
      >
        <shaderMaterial
          transparent
          vertexShader={vert}
          fragmentShader={frag}
          side={THREE.DoubleSide}
          uniforms={{
            time: { value: 0 },
            envMap: { value: texture },
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
              value: new THREE.Vector4(0, 0, 1, 0.9),
            },
            rimColor: {
              value: new THREE.Vector4(1, 1, 1, 0.5),
            },
            foamColor: {
              value: new THREE.Vector4(0, 0, 1, 0.9),
            },
            tint: {
              value: new THREE.Vector4(1, 0, 1, 0.9),
            },
            rim: {
              value: 0.05,
            },
            rimPower: {
              value: 1,
            },
          }}
        />
      </Box>
      <Box ref={ref2} {...props} args={[1, 1, 1, 32, 32, 32]}>
        <meshPhysicalMaterial
          metalness={1}
          roughnessMap={0}
          transparent
          opacity={0.3}
          clearcoat={1}
        />
      </Box>
    </>
  );
}

export default function App() {
  return (
    <>
      <Canvas
        pixelRatio={1.5}
        colorManagement
        camera={{ position: [0, 0, 5], fov: 15 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x9ff59a);
        }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[0, -0, 10]} intensity={2} />
        <Suspense fallback={null}>
          <Marcello position={[0, 0, -10]} args={[1, 1, 1, 32, 32, 32]} />
        </Suspense>
        <OrbitControls />
      </Canvas>
    </>
  );
}
