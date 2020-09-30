import { useFrame, useLoader, useThree } from "react-three-fiber";
import * as THREE from "three";
import { useEffect, useMemo } from "react";
import {
    EffectComposer,
    SavePass,
    RenderPass,
    EffectPass,
    BloomEffect,
    BlendFunction,
    KernelSize,
    GammaCorrectionEffect,
    SSAOEffect,
    SMAAEffect,
    NormalPass,
    SMAAImageLoader,
  } from "postprocessing";

function usePostprocessing(cameraLayer1, cameraLayer2) {
  
    const smaa = useLoader(SMAAImageLoader);
    const { gl, scene, size, camera } = useThree();
  
    const [
      composer,
      savePassEnv,
      savePassBackface,
    ] = useMemo(() => {
      const composer = new EffectComposer(gl, {
        frameBufferType: THREE.HalfFloatType,
      });
  
      const savePassEnv = new SavePass();
      const savePassBackface = new SavePass();
      const renderPass = new RenderPass(scene, camera);
      const renderEnvPass = new RenderPass(scene, cameraLayer1);
      const renderBackfacePass = new RenderPass(scene, cameraLayer2);
      const normalPass = new NormalPass(scene, camera);
  
      const BLOOM = new BloomEffect({
        opacity: 0.8,
        blendFunction: BlendFunction.SCREEN,
        kernelSize: KernelSize.LARGE,
        luminanceThreshold: 4,
        luminanceSmoothing: 5,
        height: 100,
      });
  
      const SMAA = new SMAAEffect(...smaa);
      SMAA.colorEdgesMaterial.setEdgeDetectionThreshold(0.2);
      const aOconfig = {
        blendFunction: BlendFunction.MULTIPLY,
        samples: 64, // May get away with less samples
        rings: 10, // Just make sure this isn't a multiple of samples
        distanceThreshold: 1,
        distanceFalloff: 1,
        rangeThreshold: 1, // Controls sensitivity based on camera view distance **
        rangeFalloff: 0.01,
        luminanceInfluence: 1,
        radius: 1, // Spread range
        intensity: 40,
        bias: 0.5,
      };
      const AO = new SSAOEffect(
        camera,
        normalPass.renderTarget.texture,
        aOconfig
      );

      const effectPass = new EffectPass(camera, SMAA, AO, BLOOM);
  
      const backfaceEffectPass = new EffectPass(
        cameraLayer2,
        new GammaCorrectionEffect({ gamma: 0.5 })
      );
      backfaceEffectPass.encodeOutput = false; // Prevent potential bugs.
  
      composer.addPass(renderBackfacePass);
      composer.addPass(backfaceEffectPass);
      composer.addPass(savePassBackface);
  
      composer.addPass(renderEnvPass);
      composer.addPass(savePassEnv);
  
      composer.addPass(renderPass);
      composer.addPass(normalPass);
      composer.addPass(effectPass);
  
      return [composer, savePassEnv, savePassBackface];
    }, [
      gl,
      scene,
      camera,
      smaa,
      cameraLayer1,
      cameraLayer2
    ]);
  
    useEffect(() => void composer.setSize(size.width, size.height), [
      composer,
      size,
    ]);
  
    useFrame((_, delta) => void composer.render(delta), 1);
  
    return [savePassEnv, savePassBackface];
  }

  export default usePostprocessing