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
  NormalPass,
} from "postprocessing";

function usePostprocessing(cameraLayer1, cameraLayer2) {
  const { gl, scene, size, camera } = useThree();

  const [composer, savePassEnv, savePassBackface] = useMemo(() => {
    const composer = new EffectComposer(gl, {
      frameBufferType: THREE.HalfFloatType,
    });

    const savePassEnv = new SavePass();
    const savePassBackface = new SavePass();
    const renderPass = new RenderPass(scene, camera);
    const renderEnvPass = new RenderPass(scene, cameraLayer1);
    const renderBackfacePass = new RenderPass(scene, cameraLayer2);

    const BLOOM = new BloomEffect({
      opacity: 1,
      blendFunction: BlendFunction.SCREEN,
      kernelSize: KernelSize.LARGE,
      luminanceThreshold: 0.85,
      luminanceSmoothing: 0.1,
      height: 100,
    });

    const effectPass = new EffectPass(camera, BLOOM);

    const backfaceEffectPass = new EffectPass(
      cameraLayer2,
      new GammaCorrectionEffect({ gamma: 0.5 })
    );
    backfaceEffectPass.encodeOutput = false; // Prevent potential bugs.
    const renderEnvEffectPass = new EffectPass(
      cameraLayer1,
      new GammaCorrectionEffect({ gamma: 7 })
    );
    renderEnvEffectPass.encodeOutput = false; // Prevent potential bugs.
    const renderEffectPass = new EffectPass(
      camera,
      new GammaCorrectionEffect({ gamma: 1 })
    );
    renderEffectPass.encodeOutput = false; // Prevent potential bugs.

    composer.addPass(renderBackfacePass);
    composer.addPass(backfaceEffectPass);
    composer.addPass(savePassBackface);

    composer.addPass(renderEnvPass);
    composer.addPass(renderEnvEffectPass);
    composer.addPass(savePassEnv);

    composer.addPass(renderPass);
    composer.addPass(effectPass);
    composer.addPass(renderEffectPass);

    return [composer, savePassEnv, savePassBackface];
  }, [gl, scene, camera, cameraLayer1, cameraLayer2]);

  useEffect(() => void composer.setSize(size.width, size.height), [
    composer,
    size,
  ]);

  useFrame((_, delta) => void composer.render(delta), 1);

  return [savePassEnv, savePassBackface];
}

export default usePostprocessing;
