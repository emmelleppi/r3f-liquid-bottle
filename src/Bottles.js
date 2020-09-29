import * as THREE from "three";
import React, { useEffect, useRef, useState } from "react";
import { useLoader, useFrame } from "react-three-fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { draco } from "drei/loaders/draco";

import { material } from "./store";
import { useNormalTexture, useTextureLoader } from "drei";

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
  const liquidRef = useRef();

  const [plane] = useState(new THREE.Plane(new THREE.Vector3(0, -1, 0), 0));

  const { nodes } = useLoader(GLTFLoader, "/draco.glb", draco());

  const [hovered, set] = useState(false);

  const [normal, normal2] = useTextureLoader([
    "/225_norm.jpg",
    "/190_norm.jpeg",
  ]);
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping;
  normal2.wrapS = normal2.wrapT = THREE.RepeatWrapping;
  normal.repeat = new THREE.Vector2(8, 8);
  normal2.repeat = new THREE.Vector2(4, 4);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() * 10;
    ref.current.position.z = THREE.MathUtils.lerp(
      ref.current.position.z,
      hovered ? -15 : 0,
      0.075 - Math.abs(initial) / 2000
    );
    plane.normal.set(0.2 * Math.sin(time), -1, 0.2 * Math.cos(time));
    // plane.applyMatrix4(liquidRef.current.matrix);
    ref.current.rotation.z = THREE.MathUtils.lerp(
      ref.current.rotation.z,
      hovered ? -0.5 : 0,
      0.075
    );
  });

  return (
    <group
      rotation={[Math.PI / 2, 0, 3]}
      {...props}
      onPointerOver={(e) => (e.stopPropagation(), set(true))}
      onPointerOut={() => set(false)}
    >
      <group position-z={initial * 5} ref={ref}>
        {children}
        <mesh geometry={nodes[glas].geometry}>
          <meshPhysicalMaterial
            color={new THREE.Color("#fff").convertSRGBToLinear()}
            transparent={true}
            side={THREE.BackSide}
            transmission={0.5}
            metalness={0.9}
            roughness={0.1}
            normalMap={normal}
          />
        </mesh>
        <mesh geometry={nodes[glas].geometry} castShadow>
          <meshPhysicalMaterial
            color={new THREE.Color("#fff").convertSRGBToLinear()}
            transparent={true}
            side={THREE.BackSide}
            transmission={0.7}
            metalness={0.9}
            roughness={0.1}
            normalMap={normal}
          />
        </mesh>
        <mesh geometry={nodes[liquid].geometry} ref={liquidRef} castShadow>
          <meshPhysicalMaterial
            color={new THREE.Color("yellow")}
            transparent={true}
            transmission={0.5}
            metalness={0.9}
            roughness={0.1}
            clippingPlanes={[plane]}
          />
        </mesh>
        <mesh geometry={nodes[cap].geometry}>
          <meshPhysicalMaterial
            color={new THREE.Color("#010101")}
            metalness={0}
            roughness={1}
            normalMap={normal2}
          />
        </mesh>
      </group>
    </group>
  );
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
        {/* <Label texture={a} scale={[0.78, 0.78, 0.78]} position={[0, 0, -5]} /> */}
      </Bottle>
    </group>
  );
}
