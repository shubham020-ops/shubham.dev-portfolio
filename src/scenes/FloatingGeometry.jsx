import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

const shapes = [
  { kind: 'torus', pos: [-4.1, 1.6, -1], scale: 0.55, color: '#C7FF4F', speed: 0.5, wire: false },
  { kind: 'octa', pos: [4.2, 1.9, -0.5], scale: 0.62, color: '#52E5FF', speed: 0.7, wire: true },
  { kind: 'box', pos: [-3.2, -1.7, 0.4], scale: 0.42, color: '#8B5CF6', speed: 0.6, wire: true },
  { kind: 'ico', pos: [3.4, -1.5, 0.8], scale: 0.38, color: '#C7FF4F', speed: 0.9, wire: false },
  { kind: 'torus', pos: [0.2, -2.6, -2], scale: 0.7, color: '#52E5FF', speed: 0.4, wire: true },
];

function Geometry({ kind }) {
  switch (kind) {
    case 'torus':
      return <torusGeometry args={[1, 0.28, 12, 32]} />;
    case 'octa':
      return <octahedronGeometry args={[1, 0]} />;
    case 'box':
      return <boxGeometry args={[1.3, 1.3, 1.3]} />;
    default:
      return <icosahedronGeometry args={[1, 0]} />;
  }
}

function Shape({ kind, pos, scale, color, speed, wire, pointer, lite }) {
  const ref = useRef(null);
  const depth = 0.4 + Math.abs(pos[2]) * 0.25;

  useFrame((_, delta) => {
    const m = ref.current;
    if (!m) return;
    m.rotation.x += delta * speed * 0.4;
    m.rotation.y += delta * speed * 0.55;
    // pointer parallax per depth layer (smoothed)
    const tx = pos[0] + pointer.current.x * depth * 0.5 + pointer.current.dragX * depth * 0.8;
    const ty = pos[1] + pointer.current.y * depth * 0.35 - pointer.current.dragY * depth * 0.4;
    m.position.x = THREE.MathUtils.damp(m.position.x, tx, 3, delta);
    m.position.y = THREE.MathUtils.damp(m.position.y, ty, 3, delta);
  });

  return (
    <Float speed={lite ? 0 : speed * 1.4} rotationIntensity={0} floatIntensity={lite ? 0 : 1.1}>
      <mesh ref={ref} position={pos} scale={scale}>
        <Geometry kind={kind} />
        {wire ? (
          <meshBasicMaterial color={color} wireframe transparent opacity={0.7} />
        ) : (
          <meshStandardMaterial
            color="#0d1017"
            metalness={0.9}
            roughness={0.25}
            emissive={color}
            emissiveIntensity={0.25}
          />
        )}
      </mesh>
    </Float>
  );
}

export default function FloatingGeometry({ pointer, lite = false, reduced = false }) {
  const list = lite ? shapes.slice(0, 3) : shapes;
  return (
    <group>
      {list.map((s, i) => (
        <Shape key={i} {...s} pointer={pointer} lite={lite || reduced} />
      ))}
    </group>
  );
}
