import { useFrame, useThree } from "react-three-fiber";
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
} from "postprocessing";
import { refCameraLayer1, refCameraLayer2, savePassEnv, savePassBackface } from "./store";

function usePostprocessing() {
  const { gl, scene, size, camera } = useThree();

  const [composer] = useMemo(() => {
    const composer = new EffectComposer(gl, {
      frameBufferType: THREE.HalfFloatType,
    });

    const renderEnvPass = new RenderPass(scene, refCameraLayer1.current);
    const renderPass = new RenderPass(scene, camera);
    const renderBackfacePass = new RenderPass(scene, refCameraLayer2.current);

    savePassEnv.current = new SavePass();
    savePassBackface.current = new SavePass();

    const BLOOM = new BloomEffect({
      opacity: 1,
      blendFunction: BlendFunction.SCREEN,
      kernelSize: KernelSize.LARGE,
      luminanceThreshold: 0.85,
      luminanceSmoothing: 0.1,
      height: 100,
    });
    const effectPass = new EffectPass(camera, BLOOM);
    const renderEffectPass = new EffectPass(
      camera,
      new GammaCorrectionEffect({ gamma: 1 })
    );
    renderEffectPass.encodeOutput = false; // Prevent potential bugs.
    const backfaceEffectPass = new EffectPass(
      refCameraLayer2.current,
      new GammaCorrectionEffect({ gamma: 0.5 })
    );
    backfaceEffectPass.encodeOutput = false; // Prevent potential bugs.
    const renderEnvEffectPass = new EffectPass(
      refCameraLayer1.current,
      new GammaCorrectionEffect({ gamma: 5 })
    );
    renderEnvEffectPass.encodeOutput = false; // Prevent potential bugs.

    composer.addPass(renderBackfacePass);
    composer.addPass(backfaceEffectPass);
    composer.addPass(savePassBackface.current);

    composer.addPass(renderEnvPass);
    composer.addPass(renderEnvEffectPass);
    composer.addPass(savePassEnv.current);

    composer.addPass(renderPass);
    composer.addPass(effectPass);
    composer.addPass(renderEffectPass);

    return [composer];
  }, [gl, scene, camera, refCameraLayer1.current, refCameraLayer2.current]);

  useEffect(() => void composer.setSize(size.width, size.height), [
    composer,
    size,
  ]);

  useFrame((_, delta) => void composer.render(delta), 1);
}

export default usePostprocessing;
