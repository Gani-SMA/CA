import { useRef, useState, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';
import {
  Chart as ChartJS, ArcElement, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { X } from 'lucide-react';
import { CATEGORIES } from '../data/mockData'; // TRANSACTIONS removed, we'll need a new route for details later
import './ExpenseGalaxy.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function SpendingSphere({ category, spent, maxSpent, position, onClick }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const [hovered, setHovered] = useState(false);

  const minRadius = 0.4;
  const maxRadius = 1.5;
  const radius = minRadius + (spent / maxSpent) * (maxRadius - minRadius);
  const color = new THREE.Color(category.color);

  useFrame((state) => {
    if (meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.05;
      meshRef.current.scale.setScalar(1 + pulse + (hovered ? 0.15 : 0));
      if (glowRef.current) {
        glowRef.current.material.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 2) * 0.08;
      }
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <group position={position}>
        <mesh ref={glowRef}>
          <sphereGeometry args={[radius * 1.4, 32, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.12} />
        </mesh>
        <mesh
          ref={meshRef}
          onClick={(e) => { e.stopPropagation(); onClick(category); }}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
        >
          <sphereGeometry args={[radius, 64, 64]} />
          <meshStandardMaterial
            color={color} emissive={color} emissiveIntensity={hovered ? 0.6 : 0.3}
            roughness={0.2} metalness={0.3} transparent opacity={0.85}
          />
        </mesh>
        <Text position={[0, radius + 0.35, 0]} fontSize={0.22} color="white" anchorX="center" anchorY="bottom">
          {category.name}
        </Text>
        <Text position={[0, -(radius + 0.3), 0]} fontSize={0.18} color="#94a3b8" anchorX="center" anchorY="top">
          {'\u20B9'}{spent.toLocaleString('en-IN')}
        </Text>
      </group>
    </Float>
  );
}

function getCategoryPositions(count) {
  const positions = [];
  const radius = 5;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    positions.push([Math.cos(angle) * radius, Math.sin(angle * 2) * 0.5, Math.sin(angle) * radius]);
  }
  return positions;
}

function GalaxyScene({ onSelectCategory, spendingData }) {
  const positions = useMemo(() => getCategoryPositions(CATEGORIES.length), []);
  const maxSpent = Math.max(...Object.values(spendingData || { default: 1 }));

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#8b5cf6" />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#06b6d4" />
      <pointLight position={[0, 5, -10]} intensity={0.4} color="#ec4899" />
      <Stars radius={50} depth={50} count={2000} factor={3} saturation={0.5} fade speed={1} />
      {CATEGORIES.map((cat, i) => {
        const spent = spendingData?.[cat.id] || 0;
        if (spent === 0) return null; // Don't render empty categories
        return (
          <SpendingSphere key={cat.id} category={cat} spent={spent} maxSpent={maxSpent} position={positions[i]} onClick={onSelectCategory} />
        );
      })}
      <OrbitControls autoRotate autoRotateSpeed={0.5} enableZoom enablePan={false} minDistance={4} maxDistance={15} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.5} />
    </>
  );
}

export default function ExpenseGalaxy() {
  const [selected, setSelected] = useState(null);
  const [spendingData, setSpendingData] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        setSpendingData(data.spendingByCategory || {});
        setLoaded(true);
      })
      .catch(err => {
        console.error("Failed to load galaxy stats", err);
        setLoaded(true);
      });
  }, []);

  const handleSelect = useCallback((category) => setSelected(category), []);
  const handleClose = useCallback(() => setSelected(null), []);

  const getDetailData = () => {
    // Note: To show real sub-transactions in the overlay, we need a new API endpoint. 
    // For now, we stub this out so the UI doesn't crash from missing TRANSACTIONS mock.
    if (!selected) return null;
    return {
      labels: ["Category Total"],
      datasets: [{
        data: [spendingData[selected.id] || 0],
        backgroundColor: [selected.color + 'CC'],
        borderColor: selected.color, borderWidth: 1, borderRadius: 4,
      }],
    };
  };

  return (
    <div className="galaxy">
      <div className="galaxy__header">
        <h2>Expense Galaxy</h2>
        <p>Explore your spending universe — each sphere represents a category. Click to dive deeper.</p>
      </div>

      <div className="galaxy__canvas-wrapper glass-card" role="img" aria-label="3D Expense Galaxy visualization">
        {loaded && (
          <Canvas camera={{ position: [0, 3, 10], fov: 55 }}>
            <Suspense fallback={null}>
              <GalaxyScene onSelectCategory={handleSelect} spendingData={spendingData} />
            </Suspense>
          </Canvas>
        )}
        <div className="galaxy__legend">
          {CATEGORIES.map(cat => (
            <button key={cat.id} className="galaxy__legend-item" onClick={() => handleSelect(cat)}>
              <span className="galaxy__legend-dot" style={{ background: cat.color }} />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="galaxy__detail-overlay" onClick={handleClose} role="dialog" aria-modal="true" aria-label={`${selected.name} details`}>
          <div className="galaxy__detail glass-card glow-purple" onClick={e => e.stopPropagation()}>
            <button className="galaxy__detail-close" onClick={handleClose} aria-label="Close details">
              <X size={16} strokeWidth={2} />
            </button>
            <div className="galaxy__detail-header">
              <div className="galaxy__detail-icon" style={{ background: selected.color + '22', color: selected.color }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{selected.name.charAt(0)}</span>
              </div>
              <div>
                <h3>{selected.name}</h3>
                <span className="galaxy__detail-amount">₹{(spendingData[selected.id] || 0).toLocaleString('en-IN')} spent</span>
              </div>
            </div>
            <div className="galaxy__detail-budget">
              <div className="galaxy__detail-progress-bar">
                <div className="galaxy__detail-progress-fill" style={{
                  width: `${Math.min(100, ((spendingData[selected.id] || 0) / selected.budget) * 100)}%`,
                  background: (spendingData[selected.id] || 0) > selected.budget ? '#f43f5e' : selected.color,
                }} />
              </div>
              <span className="galaxy__detail-budget-text">
                ₹{(spendingData[selected.id] || 0).toLocaleString('en-IN')} / ₹{selected.budget.toLocaleString('en-IN')} budget
              </span>
            </div>
            <div className="galaxy__detail-chart">
              {getDetailData() && <Bar data={getDetailData()} options={{
                responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                plugins: {
                  legend: { display: false },
                  tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', titleColor: '#f0f4ff', bodyColor: '#94a3b8', padding: 12, cornerRadius: 8, callbacks: { label: (ctx) => ` ₹${ctx.raw.toLocaleString('en-IN')}` } },
                },
                scales: {
                  x: { ticks: { color: '#64748b', callback: v => `₹${v}` }, grid: { color: 'rgba(148,163,184,0.06)' } },
                  y: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } },
                },
              }} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
