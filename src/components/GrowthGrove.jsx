import { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Shield, Plane, Laptop, Home } from 'lucide-react';
import { SAVINGS_GOALS } from '../data/mockData';
import './GrowthGrove.css';

const GOAL_ICONS = [Shield, Plane, Laptop, Home];

function GrowthStructure({ goal, position, index }) {
  const groupRef = useRef();
  const progress = goal.saved / goal.target;
  const height = 0.5 + progress * 3;
  const colors = [['#8b5cf6', '#a78bfa'], ['#06b6d4', '#22d3ee'], ['#10b981', '#34d399'], ['#f59e0b', '#fbbf24']];
  const [baseColor, tipColor] = colors[index % colors.length];

  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3 + index) * 0.1;
  });

  const segments = useMemo(() => {
    const segs = [];
    const segCount = Math.max(2, Math.floor(progress * 6));
    for (let i = 0; i < segCount; i++) {
      const t = i / segCount;
      segs.push({ y: i * (height / segCount), height: height / segCount, radius: 0.15 + (1 - t) * 0.25 * progress, t });
    }
    return segs;
  }, [progress, height]);

  return (
    <Float speed={0.8} rotationIntensity={0.1} floatIntensity={0.3}>
      <group ref={groupRef} position={position}>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.6, 0.7, 0.15, 16]} />
          <meshStandardMaterial color={baseColor} roughness={0.5} metalness={0.5} transparent opacity={0.3} />
        </mesh>
        {segments.map((seg, i) => (
          <mesh key={i} position={[0, seg.y + seg.height / 2, 0]}>
            <cylinderGeometry args={[seg.radius * 0.7, seg.radius, seg.height, 6]} />
            <meshStandardMaterial
              color={new THREE.Color(baseColor).lerp(new THREE.Color(tipColor), seg.t)}
              emissive={new THREE.Color(baseColor)} emissiveIntensity={0.2 + seg.t * 0.3}
              roughness={0.15} metalness={0.6} transparent opacity={0.8}
            />
          </mesh>
        ))}
        <mesh position={[0, height + 0.2, 0]}>
          <sphereGeometry args={[0.15 + progress * 0.15, 16, 16]} />
          <meshStandardMaterial color={tipColor} emissive={tipColor} emissiveIntensity={0.8} transparent opacity={0.7} />
        </mesh>
        <Text position={[0, height + 0.7, 0]} fontSize={0.22} color="white" anchorX="center">{goal.name}</Text>
        <Text position={[0, -0.5, 0]} fontSize={0.16} color="#94a3b8" anchorX="center">{Math.round(progress * 100)}% complete</Text>
      </group>
    </Float>
  );
}

function Particles() {
  const particlesRef = useRef();
  const positions = useMemo(() => {
    const pos = new Float32Array(100 * 3);
    for (let i = 0; i < 100; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = Math.random() * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  useFrame((state) => { if (particlesRef.current) particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02; });

  return (
    <points ref={particlesRef}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial size={0.04} color="#8b5cf6" transparent opacity={0.6} />
    </points>
  );
}

export default function GrowthGrove() {
  const positions = [[-3, 0, 0], [-1, 0, -2], [1.5, 0, 1], [3.5, 0, -1]];

  return (
    <div className="grove">
      <div className="grove__header">
        <h2>Growth Grove</h2>
        <p>Watch your savings grow! Each structure represents a savings goal — height reflects your progress.</p>
      </div>

      <div className="grove__canvas-wrapper glass-card" role="img" aria-label="3D savings growth visualization">
        <Canvas camera={{ position: [0, 3, 8], fov: 50 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.25} />
            <pointLight position={[5, 8, 5]} intensity={0.7} color="#8b5cf6" />
            <pointLight position={[-5, 5, -5]} intensity={0.5} color="#06b6d4" />
            <pointLight position={[0, -2, 5]} intensity={0.3} color="#10b981" />
            <Stars radius={40} depth={40} count={1500} factor={2} saturation={0.3} fade speed={0.5} />
            <Particles />
            {SAVINGS_GOALS.map((goal, i) => (
              <GrowthStructure key={goal.id} goal={goal} position={positions[i]} index={i} />
            ))}
            <OrbitControls autoRotate autoRotateSpeed={0.3} enableZoom enablePan={false} minDistance={4} maxDistance={14} />
          </Suspense>
        </Canvas>
      </div>

      <div className="grove__goals">
        {SAVINGS_GOALS.map((goal, i) => {
          const progress = Math.round((goal.saved / goal.target) * 100);
          const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
          const GoalIcon = GOAL_ICONS[i];
          return (
            <div key={goal.id} className="grove__goal glass-card animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="grove__goal-header">
                <div className="grove__goal-icon" style={{ background: colors[i] + '18', color: colors[i] }}>
                  <GoalIcon size={20} strokeWidth={1.8} />
                </div>
                <div>
                  <h4>{goal.name}</h4>
                  <span className="grove__goal-pct" style={{ color: colors[i] }}>{progress}%</span>
                </div>
              </div>
              <div className="grove__goal-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${goal.name} progress`}>
                <div className="grove__goal-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${colors[i]}, ${colors[i]}aa)` }} />
              </div>
              <div className="grove__goal-amounts">
                <span>₹{goal.saved.toLocaleString('en-IN')}</span>
                <span className="grove__goal-target">₹{goal.target.toLocaleString('en-IN')}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
