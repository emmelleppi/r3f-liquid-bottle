import * as THREE from "three";
import React, { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "react-three-fiber";
import { draco, useTextureLoader } from "drei";
import { frag, vert } from "./liquidShader";
import clamp from "lodash/clamp";
import lerp from "lerp";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

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

function Background() {
  const {  scene } = useThree();
  const texture = useTextureLoader("/aft_lounge.jpg");
  
  useEffect(() => {
    scene.background = texture;
  }, [scene,texture])

  return null
}

function Marcello(props) {
  const ref = useRef();
  const bubbleMaterial = useRef();

  const wobbleAmountToAddX = useRef(0);
  const wobbleAmountToAddZ = useRef(0);
  const lastPos = useRef(new THREE.Vector3());
  const lastRot = useRef(new THREE.Vector3());

  const recovery = 4;
  const wobbleSpeed = 1;
  const maxWobble = 0.002;

  const { size, viewport } = useThree();

  const { nodes } = useLoader(GLTFLoader, "/coca-bottle.glb", draco());

  const [tassoni] = useTextureLoader(["/tassoni.jpg"]);
  tassoni.center = new THREE.Vector2(0.5, 0.5);
  tassoni.rotation = -Math.PI / 2;
  tassoni.repeat = new THREE.Vector2(-1, 1);

  const [glassNormal] = useTextureLoader(["/225_norm.jpg"]);
  glassNormal.wrapS = glassNormal.wrapT = THREE.RepeatWrapping;
  glassNormal.repeat = new THREE.Vector2(4, 4);

  useFrame(({ clock, mouse }) => {
    if (ref.current) {
      const time = clock.getElapsedTime();
      const _delta = clock.getDelta();
      const delta = _delta > 0 ? _delta : 0.01;

      const mouseX = (mouse.x * viewport.width) / 2;
      const mouseY = (mouse.y * viewport.height) / 2;

      ref.current.position.x = mouseX * 2;
      ref.current.position.y = mouseY * 2;

      // decrease wobble over time
      wobbleAmountToAddX.current = lerp(
        wobbleAmountToAddX.current,
        0,
        delta * recovery
      );
      wobbleAmountToAddZ.current = lerp(
        wobbleAmountToAddZ.current,
        0,
        delta * recovery
      );

      // make a sine wave of the decreasing wobble
      const pulse = 2 * Math.PI * wobbleSpeed;
      const wobbleAmountX = wobbleAmountToAddX.current * Math.sin(pulse * time);
      const wobbleAmountZ = wobbleAmountToAddZ.current * Math.cos(pulse * time);

      // send it to the shader
      bubbleMaterial.current.material.uniforms.wobbleX.value = wobbleAmountX;
      bubbleMaterial.current.material.uniforms.wobbleZ.value = wobbleAmountZ;

      // velocity
      const velocity = lastPos.current.clone();
      velocity.sub(ref.current.position).divideScalar(delta);
      const angularVelocity = ref.current.rotation.clone().toVector3();
      angularVelocity.sub(lastRot.current);

      // add clamped velocity to wobble
      wobbleAmountToAddX.current += clamp(
        (velocity.x + angularVelocity.z * 0.2) * maxWobble,
        -maxWobble,
        maxWobble
      );
      wobbleAmountToAddZ.current += clamp(
        (velocity.z + angularVelocity.x * 0.2) * maxWobble,
        -maxWobble,
        maxWobble
      );

      // keep last position
      lastPos.current = ref.current.position.clone();
      lastRot.current = ref.current.rotation.clone().toVector3();

      bubbleMaterial.current.material.uniforms.fillAmount.value =
        -ref.current.position.y - 0.2;
    }
  });

  return (
    <>
      <group
        {...props}
        ref={ref}
        dispose={null}
      >
        <group position={[0, 0, 0]}>
          <group position={[0, 10.01, 0]}>
            <mesh geometry={nodes["Mesh.002_0"].geometry} castShadow>
              <meshPhysicalMaterial
                color={new THREE.Color("green")}
                metalness={1}
                roughness={1}
              />
            </mesh>
            <mesh geometry={nodes["Mesh.002_1"].geometry} castShadow>
              <meshPhysicalMaterial
                color={new THREE.Color("white")}
                metalness={1}
                roughness={0}
                clearcoat={1}
              />
            </mesh>
          </group>
          <mesh ref={bubbleMaterial} geometry={nodes.Coca_Outside.geometry} scale={[0.97, 0.97, 0.97]} position={[0, -0.04, 0]} renderOrder={1} >
            <shaderMaterial
              transparent
              vertexShader={vert}
              fragmentShader={frag}
              side={THREE.DoubleSide}
              uniforms={{
                time: { value: 0 },
                resolution: {
                  value: new THREE.Vector2(size.width, size.height),
                },
                fillAmount: {
                  value: 0,
                },
                wobbleX: {
                  value: 0.01,
                },
                wobbleZ: {
                  value: 0.01,
                },
                topColor: {
                  value: new THREE.Vector4(0, 0, 1, 0),
                },
                rimColor: {
                  value: new THREE.Vector4(1, 1, 1, 1),
                },
                foamColor: {
                  value: new THREE.Vector4(1, 1, 0, 0.9),
                },
                tint: {
                  value: new THREE.Vector4(1, 1, 0, 0.4),
                },
                rim: {
                  value: 0.01,
                },
                rimPower: {
                  value: 1,
                },
              }}
            />    
          </mesh>
          <mesh geometry={nodes.Coca_Outside.geometry} renderOrder={0}>
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
          <mesh
            geometry={nodes.Coca_Outside.geometry}
            position={[0, -0.04, 0]}
            renderOrder={2}
            castShadow
          >
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
          <mesh geometry={nodes.Label.geometry} position={[1.69, 0.84, -0.01]} renderOrder={3}>
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
      </group>

    </>
  );
}

export default function App() {
  return (
    <>
      <Canvas
        pixelRatio={2}
        colorManagement
        camera={{ position: [0, 0, 5], fov: 15 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x9ff59a);
        }}
        gl={{
          // logarithmicDepthBuffer: true,
          // powerPreference: "high-performance",
          // antialias: false,
          // stencil: false,
          // depth: false,
          // alpha: false,
        }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[0, -0, 10]} intensity={2} />
        <Suspense fallback={null}>
          <Marcello position={[0, 0, -10]} scale={[0.1,0.1,0.1]} />
          <Environment />
          {/* <Background /> */}
        </Suspense>
      </Canvas>
    </>
  );
}
