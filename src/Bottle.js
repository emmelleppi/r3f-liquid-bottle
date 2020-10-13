import * as THREE from "three";
import React, { useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "react-three-fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { draco } from "drei/loaders/draco";
import { useTextureLoader } from "drei/loaders/useTextureLoader";
import lerp from "lerp";
import clamp from "lodash/clamp";
import { useCylinder } from "use-cannon";
import { frag, vert } from "./materials/backfaceMaterial";
import {
  frag as fragRefraction,
  vert as vertRefraction,
} from "./materials/refractionMaterial";
import { useDragConstraint } from "./mouse";
import { BOTTLE, BOTTLE_BODY_PROPS, LABEL, LIQUID_PARAMS, PLUG_BOTTOM, PLUG_TOP, savePassBackface, savePassEnv } from "./store";

function Bottle() {
  const liquidBody = useRef();
  const wobbleAmountToAddX = useRef(0);
  const wobbleAmountToAddZ = useRef(0);
  const lastPos = useRef(new THREE.Vector3());
  const lastRot = useRef(new THREE.Vector3());
  
  const { size } = useThree();
  const { nodes } = useLoader(GLTFLoader, "/coca-bottle.glb", draco());
  const [tassoni] = useTextureLoader(["/tassoni.png"]);

  const [ref] = useCylinder(() => (BOTTLE_BODY_PROPS));
  const bind = useDragConstraint(ref);
  
  const uniforms = useMemo(() => ({
    envMap: { value: savePassEnv.current.renderTarget.texture },
    backfaceMap: { value: savePassBackface.current.renderTarget.texture },
    resolution: {
      value: new THREE.Vector2(size.width, size.height),
    },
    fillAmount: {
      value: 0,
    },
    wobbleX: {
      value: 0,
    },
    wobbleZ: {
      value: 0,
    },
    topColor: {
      value: new THREE.Vector4(0, 0, 1, 0),
    },
    rimColor: {
      value: new THREE.Vector4(1, 1, 1, 1),
    },
    foamColor: {
      value: new THREE.Vector4(1, 1, 1, 1),
    },
    tint: {
      value: new THREE.Vector4(1, 1, 0, 0.5),
    },
    rim: {
      value: 0.05,
    },
    rimPower: {
      value: 1,
    },
  }), [savePassEnv.current, size, savePassBackface.current])
  
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const _delta = clock.getDelta();
    // dont ask me why but sometimes the delta is 0
    const delta = _delta > 0 ? _delta : 0.01;
    
    const {
      recovery,
      wobbleSpeed,
      maxWobble,
    } = LIQUID_PARAMS

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
    liquidBody.current.material.uniforms.wobbleX.value = wobbleAmountX;
    liquidBody.current.material.uniforms.wobbleZ.value = wobbleAmountZ;

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

    // keep the fillAmount always on the right Y
    liquidBody.current.material.uniforms.fillAmount.value =
      -ref.current.position.y + 8;
  });

  return (
    <>
      <group ref={ref} dispose={null} {...bind}>
        <group position={[0, 10.01, 0]}>
          <mesh geometry={nodes["Mesh.002_0"].geometry}>
            <meshPhysicalMaterial {...PLUG_TOP} />
          </mesh>
          <mesh geometry={nodes["Mesh.002_1"].geometry} >
            <meshPhysicalMaterial {...PLUG_BOTTOM} />
          </mesh>
        </group>
        <group position={[0, -0.04, 0]} scale={[0.98, 0.98, 0.98]}>
          <mesh ref={liquidBody} geometry={nodes.Coca_Outside.geometry}>
            <shaderMaterial
              transparent
              vertexShader={vertRefraction}
              fragmentShader={fragRefraction}
              uniforms={uniforms}
            />
          </mesh>
          <mesh layers={2} geometry={nodes.Coca_Outside.geometry}>
            <shaderMaterial
              transparent
              side={THREE.BackSide}
              vertexShader={vert}
              fragmentShader={frag}
            />
          </mesh>
        </group>
        <mesh geometry={nodes.Coca_Outside.geometry} position={[0, -0.04, 0]}>
          <meshPhysicalMaterial
            transparent
            side={THREE.BackSide}
            transmission={0.1}
            {...BOTTLE}
          />
        </mesh>
        <mesh
          geometry={nodes.Coca_Outside.geometry}
          position={[0, -0.04, 0]}
        >
          <meshPhysicalMaterial
            transparent
            transmission={0.4}
            {...BOTTLE}
          />
        </mesh>
        <mesh geometry={nodes.Label.geometry} position={[1.69, 0.84, -0.01]}>
          <meshPhysicalMaterial
            transparent
            alphaTest={0.8}
            side={THREE.DoubleSide}
            map={tassoni}
            {...LABEL}
          />
        </mesh>
      </group>
    </>
  );
}

export default function(props) {
  return (
    <group {...props} dispose={null}>
      <Bottle />
    </group>
  );
}
