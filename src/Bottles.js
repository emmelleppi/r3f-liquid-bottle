import * as THREE from "three";
import React, { useEffect, useRef, useState } from "react";
import { useFrame, useLoader, useResource, useThree } from "react-three-fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { draco } from "drei/loaders/draco";
import { useTextureLoader } from "drei/loaders/useTextureLoader";
import { a, useSpring } from '@react-spring/three'

import usePostprocessing from "./use-postprocessing"
import { frag, vert } from "./materials/backfaceMaterial";
import { frag as fragRefraction, vert as vertRefraction } from "./materials/refractionMaterial";
import { PerspectiveCamera, Plane } from "drei";

function Bottle() {
  const ref = useRef();
  const bubbleMaterial = useRef();

  const [hovered, set] = useState(false);
  const { nodes } = useLoader(GLTFLoader, '/coca-bottle.glb', draco())

  const { size } = useThree()

  const refCameraLayer1 = useResource()
  const refCameraLayer2 = useResource()
  const [savePassEnv, savePassBackface] = usePostprocessing(refCameraLayer1.current, refCameraLayer2.current)

  const [tassoni] = useTextureLoader(["/tassoni.jpg"])
  tassoni.center = new THREE.Vector2(0.5, 0.5);
  tassoni.rotation = -Math.PI / 2
  tassoni.repeat = new THREE.Vector2(-1, 1);

  const [glassNormal] = useTextureLoader(["/225_norm.jpg"])
  glassNormal.wrapS = glassNormal.wrapT = THREE.RepeatWrapping;
  glassNormal.repeat = new THREE.Vector2(4, 4);

  const { z } = useSpring({
    z: hovered ? 100 : 0,
  });
  const { scaleLiquid, positionLiquid } = useSpring({
    scaleLiquid: hovered ? 1.005 : 1,
    positionLiquid: hovered ? -0.005 : 0,
    config: {
      mass: 1.1,
      tension: 156,
      friction: 1
    }
  })
  const { posZ, rotZ } = useSpring({
    posZ: z.to([0, 100], [0, 5]),
    rotZ: z.to([0, 100], [0, -2]),
  });

  useEffect(() => {
    refCameraLayer1.current.lookAt(0,0,0)
    refCameraLayer2.current.lookAt(0,0,0)
  },[refCameraLayer1, refCameraLayer2])

  useFrame(({ clock }) => {
    bubbleMaterial.current.material.uniforms.time.value += 1
  })

  return <>
    <perspectiveCamera
      ref={refCameraLayer1}
      args={[15]}
      position={[0,0,130]}
      layers={[1]}
    />
    <perspectiveCamera
      ref={refCameraLayer2}
      args={[15]}
      position={[0,0,130]}
      layers={[2]}
    />
    <a.group
      ref={ref}
      dispose={null}
      position-y={posZ}
      rotation-y={rotZ}
      onPointerOver={(e) => (e.stopPropagation(), set(true))}
      onPointerOut={() => set(false)}
    >
      <group position={[0, 10.3, 0]} >
        <group position={[0, 10.01, 0]}>
          <mesh geometry={nodes['Mesh.002_0'].geometry} castShadow >
            <meshPhysicalMaterial
              color={new THREE.Color("green")}
              metalness={1}
              roughness={1}
            /> 
          </mesh>
          <mesh  geometry={nodes['Mesh.002_1'].geometry} castShadow >
            <meshPhysicalMaterial
              color={new THREE.Color("white")}
              metalness={1}
              roughness={0}
              clearcoat={1}
            /> 
          </mesh>
        </group>
        <group position={[0, -1.31, 0]} scale={[0.98, 0.98, 0.98]} >
          <a.mesh ref={bubbleMaterial} geometry={nodes.Coca_Liquid.geometry} position-y={positionLiquid} scale-y={scaleLiquid} >
            <shaderMaterial
              transparent
              vertexShader={vertRefraction}
              fragmentShader={fragRefraction}
              uniforms={{
                time: { value: 0 },
                envMap: { value: savePassEnv.renderTarget.texture },
                backfaceMap: { value: savePassBackface.renderTarget.texture },
                resolution: { value: new THREE.Vector2(size.width, size.height) },
              }}
            />
          </a.mesh>
          <mesh layers={[2]} geometry={nodes.Coca_Liquid.geometry} >
            <shaderMaterial transparent side={THREE.BackSide} vertexShader={vert} fragmentShader={frag} />
          </mesh>
        </group>
        <mesh geometry={nodes.Coca_Outside.geometry} position={[0, -0.04, 0]} >
          <meshPhysicalMaterial
            color="#FFFFFF"
            transparent
            side={THREE.BackSide}
            transmission={0.1}
            metalness={0.9}
            roughness={0}
            clearcoat={1}
            clearcoatRoughness={1}
            normalMap={glassNormal}
            normalScale={[2, 2]}
            clearcoatNormaMap={glassNormal}
            opacity={0.2}
          />
        </mesh>
        <mesh geometry={nodes.Coca_Outside.geometry} position={[0, -0.04, 0]} castShadow >
          <meshPhysicalMaterial
            color="#FFFFFF"
            transparent
            transmission={0.7}
            metalness={0.9}
            roughness={0}
            clearcoat={1}
            clearcoatRoughness={1}
            normalMap={glassNormal}
            normalScale={[2, 2]}
            clearcoatNormaMap={glassNormal}
            opacity={0.2}
          />
        </mesh>
        <mesh geometry={nodes.Label.geometry} position={[1.69, 0.84, -0.01]} >
          <meshPhysicalMaterial
              side={THREE.DoubleSide}
              metalness={0}
              roughness={1}
              clearcoat={1}
              clearcoatRoughness={1}
              map={tassoni}
              normalMap={glassNormal}
            />
        </mesh>
      </group>
    </a.group>
  </>
}

export default function Bottles(props) {
  const group = useRef();
  return (
    <group ref={group} {...props} dispose={null} >
      <Bottle />
    </group>
  );
}
