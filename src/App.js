import * as THREE from "three";
import React, { Suspense, useEffect } from "react";
import { Canvas, useThree } from "react-three-fiber";
import { useCubeTextureLoader } from "drei/loaders/useCubeTextureLoader";
import { Loader } from "drei/prototyping/Loader";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib";
import { EffectComposer, SSAO, SMAA, Bloom } from "react-postprocessing";
import { EdgeDetectionMode } from "postprocessing";

import Bottles from "./Bottles";
import { ContactShadows } from "drei";

RectAreaLightUniformsLib.init();

function Environment({ background = false }) {
  const { gl, scene } = useThree();
  const cubeMap = useCubeTextureLoader(
    ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
    { path: "/cube/" }
  );
  useEffect(() => {
    const gen = new THREE.PMREMGenerator(gl);
    gen.compileEquirectangularShader();
    const hdrCubeRenderTarget = gen.fromCubemap(cubeMap);
    cubeMap.dispose();
    gen.dispose();
    if (background) scene.background = hdrCubeRenderTarget.texture;
    scene.environment = hdrCubeRenderTarget.texture;
    return () => (scene.environment = scene.background = null);
  }, [cubeMap]);
  return null;
}

export default function App() {
  return (
    <>
      <Canvas
        pixelRatio={2}
        concurrent
        shadowMap
        colorManagement
        camera={{ position: [0, 0, 100], fov: 15 }}
        onCreated={({ gl }) => void (gl.localClippingEnabled = true)}
        // gl={{
        //   logarithmicDepthBuffer: true,
        //   powerPreference: 'high-performance',
        //   antialias: false,
        //   stencil: false,
        //   depth: false,
        //   alpha: false
        // }}
      >
        <spotLight
          penumbra={1}
          angle={0.35}
          castShadow
          position={[0, 80, 0]}
          intensity={5}
          shadow-mapSize-width={256}
          shadow-mapSize-height={256}
        />
        <rectAreaLight
          position={[0, 10, -20]}
          width={50}
          height={20}
          intensity={4}
          onUpdate={(self) => self.lookAt(0, 0, 0)}
        />
        <pointLight position={[10, -10, 5]} intensity={1} />
        <ambientLight />
        <Suspense fallback={null}>
          <group position={[0, -12, 0]}>
            <Bottles />
            <ContactShadows
              rotation={[Math.PI / 2, 0, 0]}
              opacity={0.8}
              width={100}
              height={100}
              blur={1}
              far={100}
            />
          </group>
          <Environment />
        </Suspense>
        <Suspense fallback={null}>
          <EffectComposer multisampling={0}>
            <SSAO
              samples={64}
              intensity={64}
              luminanceInfluence={0.5}
              radius={10}
              scale={0.5}
              bias={0.5}
            />
            <SMAA edgeDetectionMode={EdgeDetectionMode.DEPTH} />
            <Bloom
              luminanceThreshold={0.9}
              luminanceSmoothing={0.8}
              intensity={1}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
}
