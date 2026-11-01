import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import FloatingGeometry from './FloatingGeometry';

/**
 * Hero WebGL scene. `pointer` is a ref shared with Hero.jsx:
 *   { x, y }           normalised pointer position (-1..1)
 *   { dragX, dragY }   heading drag offset (-1..1)
 *   { dragging, overHeading } interaction flags
 */

function CameraRig({ pointer, reduced }) {
  useFrame((state, delta) => {
    if (reduced) return;
    const p = pointer.current;
    const tx = p.x * 0.7 + p.dragX * 0.6;
    const ty = p.y * -0.45 - p.dragY * 0.3;
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, tx, 2.5, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, ty, 2.5, delta);
    state.camera.lookAt(0, 0.3, 0);
  });
  return null;
}

function Orb({ pointer, lite, reduced }) {
  const group = useRef(null);
  const mat = useRef(null);
  const wire = useRef(null);
  const intro = useRef(0);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const p = pointer.current;

    // reveal (scale in)
    intro.current = Math.min(intro.current + delta / 1.8, 1);
    const eased = 1 - Math.pow(1 - intro.current, 3);
    const base = state.viewport.width < 7 ? 0.62 : 0.9;
    g.scale.setScalar(eased * base);

    if (reduced) return;

    // rotate + displace towards pointer / drag
    g.rotation.y += delta * 0.18;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, p.y * 0.4, 3, delta);
    g.position.x = THREE.MathUtils.damp(g.position.x, p.x * 0.35 + p.dragX * 1.4, 3, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, 0.9 - p.dragY * 0.6, 3, delta);

    // controlled deformation: calm → stronger over the heading → strongest while dragging
    const target =
      0.28 + (p.overHeading ? 0.14 : 0) + (p.dragging ? 0.18 : 0) + Math.min(Math.hypot(p.dragX, p.dragY) * 0.25, 0.2);
    if (mat.current) mat.current.distort = THREE.MathUtils.damp(mat.current.distort, target, 4, delta);
    if (wire.current) wire.current.rotation.y -= delta * 0.12;
  });

  return (
    <group ref={group} position={[0, 0.9, 0]}>
      <mesh>
        <icosahedronGeometry args={[1.35, lite ? 12 : 20]} />
        <MeshDistortMaterial
          ref={mat}
          color="#0c0f16"
          metalness={1}
          roughness={0.14}
          distort={0.28}
          speed={reduced ? 0 : 1.4}
          envMapIntensity={1.5}
        />
      </mesh>
      <mesh ref={wire} scale={1.62}>
        <icosahedronGeometry args={[1, lite ? 1 : 2]} />
        <meshBasicMaterial color="#52E5FF" wireframe transparent opacity={0.22} />
      </mesh>
    </group>
  );
}

function Particles({ count, reduced }) {
  const ref = useRef(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (reduced || !ref.current) return;
    ref.current.rotation.y += delta * 0.025;
    ref.current.rotation.x += delta * 0.006;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#C7FF4F"
        transparent
        opacity={0.75}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function HeroScene({ pointer, active = true, lite = false, reduced = false }) {
  return (
    <Canvas
      dpr={[1, lite ? 1.25 : 1.75]}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 0, 7.5], fov: 40 }}
      gl={{ antialias: !lite, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.25} />
      <pointLight position={[-4, 3, 3]} intensity={30} color="#C7FF4F" />
      <pointLight position={[4, -2, 3]} intensity={26} color="#52E5FF" />
      <pointLight position={[0, 3, -3]} intensity={18} color="#8B5CF6" />

      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={3} color="#C7FF4F" position={[-4, 2, 2]} scale={[6, 2, 1]} />
        <Lightformer form="ring" intensity={4} color="#52E5FF" position={[4, -1, 2]} scale={4} />
        <Lightformer form="rect" intensity={1.5} color="#8B5CF6" position={[0, 4, -3]} scale={[8, 2, 1]} />
      </Environment>

      <CameraRig pointer={pointer} reduced={reduced} />
      <Orb pointer={pointer} lite={lite} reduced={reduced} />
      <FloatingGeometry pointer={pointer} lite={lite} reduced={reduced} />
      <Particles count={lite ? 140 : 420} reduced={reduced} />
    </Canvas>
  );
}
