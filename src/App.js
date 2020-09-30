import * as THREE from "three";
import React, { Suspense, useEffect } from "react";
import { Canvas, useLoader, useThree } from "react-three-fiber";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { Loader } from "drei/prototyping/Loader";
import { Stats } from "drei/misc/Stats";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib";
import { EffectComposer, SSAO, SMAA, Bloom } from "react-postprocessing";
import { EdgeDetectionMode } from "postprocessing";

import Bottles from "./Bottles";
import { ContactShadows, Plane, useAspect, useTextureLoader } from "drei";
import useLayers from "./use-layers";

RectAreaLightUniformsLib.init();

function Environment({ background = false }) {
  const { gl, scene } = useThree();
  const texture = useLoader(RGBELoader, "/aft_lounge_1k.hdr")
  useEffect(() => {
    const gen = new THREE.PMREMGenerator(gl);
    const envMap = gen.fromEquirectangular( texture ).texture;
    if (background) scene.background = envMap;
    scene.environment = envMap;
    texture.dispose();
    gen.dispose();
    return () => (scene.environment = scene.background = null);
  }, [texture]);
  return null;
}

function Background() {
  const ref =  useLayers([1])
  const texture = useTextureLoader("/aft_lounge.jpg")
  const scale = useAspect(
    "cover",                  // Aspect ratio: cover | ... more to come, PR's welcome ;)
    1024,                     // Pixel-width
    512,                      // Pixel-height
    1                         // Optional scaling factor
  )
  return <Plane ref={ref} scale={scale} position={[0, 20, 10]}  >
    <meshPhysicalMaterial map={texture} depthTest={false} color={0x9ff59a} transparent opacity={0.8}/>
  </Plane>
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
          gl.setClearColor(0x9ff59a)
        }}
        gl={{
          logarithmicDepthBuffer: true,
          powerPreference: 'high-performance',
          antialias: false,
          stencil: false,
          depth: false,
          alpha: false
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
            <Bottles />
            <ContactShadows
              position={[0, -0.01, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              opacity={0.8}
              width={50}
              height={50}
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
