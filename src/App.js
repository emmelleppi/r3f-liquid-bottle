import * as THREE from "three";
import React, { Suspense, useEffect } from "react";
import { Canvas, useLoader, useThree } from "react-three-fiber";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { Loader } from "drei/prototyping/Loader";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib";
import { Physics, usePlane } from "use-cannon";
import Bottles from "./Bottles";
import {
  Box,
  ContactShadows,
  OrbitControls,
  Stats,
  useTextureLoader,
} from "drei";
import useLayers from "./use-layers";
import { Mouse } from "./mouse";

RectAreaLightUniformsLib.init();

function Environment({ background = false }) {
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

function PhyPlane(props) {
  usePlane(() => ({
    mass: 0,
    ...props,
  }));
  return null;
}

function Background() {
  const ref = useLayers([1]);
  const texture = useTextureLoader("/aft_lounge.jpg");
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat = new THREE.Vector2(2, 2);
  return (
    <Box ref={ref} position={[0, 0, 130]}>
      <meshBasicMaterial side={THREE.BackSide} map={texture} />
    </Box>
  );
}

export default function App() {
  return (
    <>
      <Canvas
        pixelRatio={1.5}
        concurrent
        colorManagement
        camera={{ position: [0, 0, 130], fov: 15 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x9ff59a);
        }}
        gl={{
          powerPreference: "high-performance",
          antialias: false,
          stencil: false,
          alpha: false,
        }}
      >
        <ambientLight intensity={0.3} />
        <spotLight
          penumbra={1}
          angle={0.35}
          position={[4, -15, 5]}
          intensity={2}
        />
        <rectAreaLight
          position={[-100, 0, 0]}
          color="#1FD0F6"
          width={50}
          height={50}
          intensity={3}
          onUpdate={(self) => self.lookAt(0, 0, 0)}
        />
        <Suspense fallback={null}>
          <group position={[0, -12, 0]}>
            <Physics gravity={[0, -100, 0]}>
              <Bottles />
              <Mouse />
              <PhyPlane
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.2, 0]}
              />
              <PhyPlane rotation={[0, 0, 0]} position={[0, 0, -100]} />
              <PhyPlane rotation={[0, -Math.PI / 2, 0]} position={[30, 0, 0]} />
              <PhyPlane rotation={[0, Math.PI / 2, 0]} position={[-30, 0, 0]} />
            </Physics>
            <ContactShadows
              position={[0, -0.01, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              opacity={0.8}
              width={100}
              height={100}
              blur={1}
              far={40}
              renderOrder={1}
            />
            <Background />
          </group>
          <Environment />
        </Suspense>
      </Canvas>
      <Stats />
      <Loader />
    </>
  );
}
