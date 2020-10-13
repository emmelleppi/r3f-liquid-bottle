import * as THREE from "three";
import React, { Suspense } from "react";
import { Canvas, useResource } from "react-three-fiber";
import { Loader } from "drei/prototyping/Loader";
import { Physics, usePlane } from "use-cannon";
import Bottle from "./Bottle";
import { Box, ContactShadows, PerspectiveCamera, Plane, useAspect, useTextureLoader } from "drei";
import { Mouse } from "./mouse";
import Environment from "./Environment";
import { CAMERA_PROPS, refCameraLayer1, refCameraLayer2 } from "./store";
import usePostprocessing from "./use-postprocessing";

function PhyPlane(props) {
  usePlane(() => ({
    mass: 0,
    ...props,
  }));
  return null;
}

function PhyPlanes() {
  return (
    <>
      <PhyPlane rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 0]} />
      <PhyPlane position={[0, 0, -100]} />
      <PhyPlane rotation={[Math.PI, 0, 0]} position={[0, 0, 75]} />
      <PhyPlane rotation={[0, -Math.PI / 2, 0]} position={[30, 0, 0]} />
      <PhyPlane rotation={[0, Math.PI / 2, 0]} position={[-30, 0, 0]} />
    </>
  );
}

function Background() {
  const texture = useTextureLoader("/aft_lounge.jpg");
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat = new THREE.Vector2(4, 4);
  return (
    <>
      <Box position={CAMERA_PROPS.position} layers={1} >
        <meshBasicMaterial side={THREE.BackSide} map={texture} />
      </Box>
    </>
  );
}

function Scene() {
  const scale = useAspect("cover", 1024, 512, 2);
  useResource(refCameraLayer1);
  useResource(refCameraLayer2);
  usePostprocessing()
  return (
    <>
      <PerspectiveCamera ref={refCameraLayer1} layers={1} {...CAMERA_PROPS} />
      <PerspectiveCamera ref={refCameraLayer2} layers={2} {...CAMERA_PROPS} />
      <spotLight
        penumbra={1}
        angle={1.2}
        position={[50, 3, 10]}
        intensity={3}
      />
      <spotLight
        penumbra={1}
        angle={1.2}
        position={[-20, 5, 20]}
        intensity={3}
      />
      <group position={[0, -12, 0]}>
        <Physics gravity={[0, -100, 0]}>
          <Bottle />
          <Mouse />
          <PhyPlanes />
        </Physics>
        <ContactShadows
          rotation={[Math.PI / 2, 0, 0]}
          opacity={0.2}
          width={100}
          height={100}
          blur={1}
          far={40}
        />
      </group>
      <Background />
      <Plane scale={scale} position={[0, 0, -100]}>
        <meshPhongMaterial color="green" />
      </Plane>
      <Environment />
    </>
  );
}

export default function App() {
  return (
    <>
      <Canvas
        concurrent
        camera={CAMERA_PROPS}
        pixelRatio={1.8}
        gl={{
          powerPreference: "high-performance",
          antialias: false,
          stencil: false,
          alpha: false,
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
}
