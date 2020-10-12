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
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <>
      <Canvas
        concurrent
        colorManagement
        onCreated={({ gl }) => {
          gl.setClearColor(0x9ff59a);
        }}
        camera={{ position: [0, 0, 130], fov: 15 }}
        pixelRatio={1.8}
        gl={{
          powerPreference: "high-performance",
          antialias: false,
          stencil: false,
          alpha: false,
        }}
      >
        <spotLight
          penumbra={1}
          angle={1.2}
          position={[50, 3, 10]}
          intensity={8}
        />
        <rectAreaLight
          position={[-20, 5, 20]}
          width={50}
          height={50}
          intensity={6}
          onUpdate={(self) => self.lookAt(0, 0, 0)}
        />
        <Suspense fallback={null}>
          <group position={[0, -12, 0]}>
            <Physics gravity={[0, -100, 0]}>
              <Bottles />
              <Mouse />
              <PhyPlane
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.3, 0]}
              />
              <PhyPlane rotation={[0, 0, 0]} position={[0, 0, -100]} />
              <PhyPlane rotation={[0, -Math.PI / 2, 0]} position={[30, 0, 0]} />
              <PhyPlane rotation={[0, Math.PI / 2, 0]} position={[-30, 0, 0]} />
            </Physics>
            <ContactShadows
              position={[0, 0, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              opacity={0.6}
              width={100}
              height={100}
              blur={1}
              far={40}
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
