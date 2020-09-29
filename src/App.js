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
import { ContactShadows } from "drei";

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

export default function App() {
  return (
    <>
      <Canvas
        pixelRatio={1.5}
        concurrent
        shadowMap
        colorManagement
        camera={{ position: [0, 0, 100], fov: 15 }}
        onCreated={({ gl }) => {
          // gl.localClippingEnabled = true
          gl.setClearColor(0xacd3e5)
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
          castShadow
          position={[4, -15, 5]}
          intensity={2}
          shadow-mapSize-width={256}
          shadow-mapSize-height={256}
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
          </group>
          <Environment />
        </Suspense>
        <Suspense fallback={null}>
          <EffectComposer multisampling={0}>
            <SSAO
              intensity={40}
              samples={32} // amount of samples per pixel (shouldn't be a multiple of the ring count)
              rings={5} // amount of rings in the occlusion sampling pattern
              distanceThreshold={0.0} // global distance threshold at which the occlusion effect starts to fade out. min: 0, max: 1
              distanceFalloff={0.0} // distance falloff. min: 0, max: 1
              rangeThreshold={0.0} // local occlusion range threshold at which the occlusion starts to fade out. min: 0, max: 1
              rangeFalloff={1.0} // occlusion range falloff. min: 0, max: 1
              luminanceInfluence={10} // how much the luminance of the scene influences the ambient occlusion
              radius={10} // occlusion sampling radius
              scale={0.5} // scale of the ambient occlusion
              bias={0.5} // occlusion bias
            />
            <SMAA edgeDetectionMode={EdgeDetectionMode.DEPTH} />
            <Bloom
              luminanceThreshold={0.75}
              luminanceSmoothing={0.9}
              intensity={1}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
      <Stats />
      <Loader />
    </>
  );
}
