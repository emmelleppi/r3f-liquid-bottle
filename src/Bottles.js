import * as THREE from "three";
import React, { useRef, useState } from "react";
import { useLoader, useFrame } from "react-three-fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { draco } from "drei/loaders/draco";
import { useTextureLoader } from "drei/loaders/useTextureLoader";
import { a, useSpring, useTransition } from '@react-spring/three'

function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}

function Label({ texture, offset = [-1, -1], repeat = [2, 2], ...props }) {
  const { nodes } = useLoader(GLTFLoader, "/draco.glb", draco());
  texture.offset.set(...offset);
  texture.repeat.set(...repeat);
  return (
    <group {...props}>
      <mesh geometry={nodes.aesop_GLBC001.geometry}>
        <meshStandardMaterial
          attach="material"
          map={texture}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={nodes.aesop_GLBC001.geometry} rotation-z={3.1}>
        <meshStandardMaterial
          attach="material"
          map={texture}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function Bottle({ initial, glas, cap, liquid, children, ...props }) {
  const ref = useRef();

  const [hovered, set] = useState(false);
  const [plane] = useState(new THREE.Plane(new THREE.Vector3(0, -1, 0), 0));

  const { nodes } = useLoader(GLTFLoader, "/draco.glb", draco());
  const [
    planksAo,
    planksDisplacement,
    planksNormal,
    planksRoughness,
  ] = useTextureLoader([
    "/planks/ao.jpg",
    "/planks/displacement.jpg",
    "/planks/normal.jpg",
    "/planks/roughness.jpg",
  ]);
  planksAo.wrapS = planksAo.wrapT = THREE.RepeatWrapping;
  planksDisplacement.wrapS = planksDisplacement.wrapT = THREE.RepeatWrapping;
  planksNormal.wrapS = planksNormal.wrapT = THREE.RepeatWrapping;
  planksRoughness.wrapS = planksRoughness.wrapT = THREE.RepeatWrapping;
  planksAo.repeat = new THREE.Vector2(4, 4);
  planksDisplacement.repeat = new THREE.Vector2(4, 4);
  planksNormal.repeat = new THREE.Vector2(4, 4);
  planksRoughness.repeat = new THREE.Vector2(4, 4);
  const [glassNormal] = useTextureLoader(["/225_norm.jpg"])
  glassNormal.wrapS = glassNormal.wrapT = THREE.RepeatWrapping;
  glassNormal.repeat = new THREE.Vector2(4, 4);

  const transition = useTransition(true, {
    from: { opacity: 0, scale: [0.1, 0.1, 0.1] },
    enter: { opacity: 1, scale: [1, 1, 1] },
  });
  const { z } = useSpring({
    z: hovered ? 100 : 0,
    onChange: ({ z }) => {
      // const x = easeOutCubic(z / 100)
      // plane.constant = 0//ref.current.position.distanceTo(origin)// 0.65 * x
      // console.log(plane.constant)
      // plane.normal.set(.1 * Math.sin(x * 4 * Math.PI), -1, .1 * Math.cos(x * 4 * Math.PI))
    }
  });
  const { scaleLiquid } = useSpring({
    scaleLiquid: hovered ? 1.002 : 1,
    config: {
      mass: 1.1,
      tension: 156,
      friction: 1
    }
  })
  const { posZ, rotZ } = useSpring({
    posZ: z.to([0, 100], [0, -15]),
    rotZ: z.to([0, 100], [0, -0.5]),
  });

  return transition(({ opacity, scale }, data) =>(
      <group
        rotation={[Math.PI / 2, 0, 3]}
        {...data}
        {...props}
        onPointerOver={(e) => (e.stopPropagation(), set(true))}
        onPointerOut={() => set(false)}
      >
        <a.group position-z={posZ} ref={ref} rotation-z={rotZ} opacity={opacity} scale={scale}>
          {children}
          <mesh geometry={nodes[glas].geometry}>
            <meshPhysicalMaterial
              color="#FFFFFF"
              transparent
              side={THREE.BackSide}
              transmission={0.1}
              metalness={1}
              roughness={0}
              clearcoat={1}
              clearcoatRoughness={1}
              normalMap={glassNormal}
              clearcoatNormaMap={glassNormal}
            />
          </mesh>
          <mesh geometry={nodes[glas].geometry} castShadow>
            <meshPhysicalMaterial
              color="#FFFFFF"
              transparent
              transmission={0.7}
              metalness={1}
              roughness={0}
              clearcoat={1}
              clearcoatRoughness={1}
              normalMap={glassNormal}
              clearcoatNormaMap={glassNormal}
              opacity={0.1}
            />
          </mesh>
          <a.mesh geometry={nodes[liquid].geometry} castShadow scale-z={scaleLiquid} >
            <meshPhysicalMaterial
              color={new THREE.Color("#ffc100")}t
              transmission={0.1}
              metalness={0.9}
              roughness={0}
              // clippingPlanes={[plane]}
            />
          </a.mesh>
          <mesh geometry={nodes[cap].geometry}>
            <meshPhysicalMaterial
              color={new THREE.Color("#010101")}
              metalness={0}
              roughness={1}
              normalMap={planksNormal}
              clearcoatNormaMap={planksNormal}
              aoMap={planksAo}
              displacementMap={planksDisplacement}
              roughnessMap={planksRoughness}
            />
          </mesh>
        </a.group>
      </group>
    ))
}

export default function Bottles(props) {
  const group = useRef();
  const [a] = useLoader(THREE.TextureLoader, ["/aesop_GFT_d.jpg"]);
  return (
    <group ref={group} {...props} dispose={null} scale={[0.1, 0.1, 0.1]}>
      <Bottle
        initial={-40}
        position={[0, 0, 0]}
        glas="Untitled.052_0"
        cap="Untitled.052_1"
        liquid="Untitled.052_2"
      >
        <Label texture={a} scale={[0.76, 0.76, 0.76]} position={[0, 0, -5]} />
      </Bottle>
    </group>
  );
}
