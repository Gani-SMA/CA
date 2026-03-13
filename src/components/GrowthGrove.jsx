import { useRef, Suspense, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Shield, Plane, Laptop, Home, Plus, X, Edit3, Check, Trash2 } from 'lucide-react';
import { API_BASE } from '../data/constants';
import './GrowthGrove.css';

const GOAL_ICONS = [Shield, Plane, Laptop, Home];
const COLORS_3D = [['#8b5cf6', '#a78bfa'], ['#06b6d4', '#22d3ee'], ['#10b981', '#34d399'], ['#f59e0b', '#fbbf24']];
const CARD_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

function GrowthStructure({ goal, position, index }) {
  const groupRef = useRef();
  const progress = goal.target > 0 ? Math.min(1, goal.saved / goal.target) : 0;
  const height = 0.5 + progress * 3;
  const [baseColor, tipColor] = COLORS_3D[index % COLORS_3D.length];

  useFrame(state => {
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
        <Text position={[0, height + 0.7, 0]} fontSize={0.2} color="white" anchorX="center">{goal.name}</Text>
        <Text position={[0, -0.5, 0]} fontSize={0.16} color="#94a3b8" anchorX="center">{Math.round(progress * 100)}%</Text>
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
  useFrame(state => { if (particlesRef.current) particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02; });
  return (
    <points ref={particlesRef}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial size={0.04} color="#8b5cf6" transparent opacity={0.6} />
    </points>
  );
}

const EMPTY_GOAL = { name: '', target: '', saved: '', color: '#8b5cf6' };

export default function GrowthGrove() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_GOAL);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/savings/goals`);
      const data = await res.json();
      setGoals(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch(`${API_BASE}/api/savings/goals`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, target: parseFloat(form.target), saved: parseFloat(form.saved) || 0, color: form.color }),
      });
      setForm(EMPTY_GOAL);
      setShowAddForm(false);
      await fetchGoals();
    } catch (e) {} finally { setSubmitting(false); }
  };

  const handleSaveEdit = async (id) => {
    try {
      await fetch(`${API_BASE}/api/savings/goals/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editForm.name, target: parseFloat(editForm.target), saved: parseFloat(editForm.saved), color: editForm.color }),
      });
      setEditId(null);
      await fetchGoals();
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    await fetch(`${API_BASE}/api/savings/goals/${id}`, { method: 'DELETE' });
    await fetchGoals();
  };

  const positions = goals.slice(0, 6).map((_, i) => {
    const angle = (i / Math.max(goals.length, 1)) * Math.PI * 2;
    return [Math.cos(angle) * 3, 0, Math.sin(angle) * 3];
  });

  return (
    <div className="grove">
      <div className="grove__header">
        <div>
          <h2>Growth Grove</h2>
          <p>Track your savings goals — each structure grows as you save more. Add new goals to plant a new tree!</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={15} /> Add Goal
        </button>
      </div>

      {showAddForm && (
        <div className="glass-card grove__add-form animate-fade">
          <h3>🎯 New Savings Goal</h3>
          <form onSubmit={handleAdd}>
            <div className="grove__form-row">
              <div className="grove__form-field">
                <label>Goal Name</label>
                <input type="text" placeholder="e.g. Emergency Fund, Vacation..."
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="grove__form-field">
                <label>Target Amount (₹)</label>
                <input type="number" min="1" placeholder="e.g. 100000"
                  value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} required />
              </div>
              <div className="grove__form-field">
                <label>Already Saved (₹)</label>
                <input type="number" min="0" placeholder="0"
                  value={form.saved} onChange={e => setForm(f => ({ ...f, saved: e.target.value }))} />
              </div>
              <div className="grove__form-field">
                <label>Color</label>
                <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="grove__color-input" />
              </div>
            </div>
            <div className="grove__form-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : '✓ Add Goal'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {goals.length > 0 && (
        <div className="grove__canvas-wrapper glass-card" role="img" aria-label="3D savings growth visualization">
          <Canvas camera={{ position: [0, 3, 8], fov: 50 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.25} />
              <pointLight position={[5, 8, 5]} intensity={0.7} color="#8b5cf6" />
              <pointLight position={[-5, 5, -5]} intensity={0.5} color="#06b6d4" />
              <pointLight position={[0, -2, 5]} intensity={0.3} color="#10b981" />
              <Stars radius={40} depth={40} count={1500} factor={2} saturation={0.3} fade speed={0.5} />
              <Particles />
              {goals.slice(0, 4).map((goal, i) => (
                <GrowthStructure key={goal.id} goal={goal} position={positions[i] || [i * 2, 0, 0]} index={i} />
              ))}
              <OrbitControls autoRotate autoRotateSpeed={0.3} enableZoom enablePan={false} minDistance={4} maxDistance={14} />
            </Suspense>
          </Canvas>
        </div>
      )}

      {loading ? (
        <div className="grove__loading glass-card"><div className="thinking-dots"><span /><span /><span /></div><p>Loading goals...</p></div>
      ) : goals.length === 0 ? (
        <div className="grove__empty glass-card animate-fade">
          <span>🌱</span>
          <h3>No savings goals yet</h3>
          <p>Click "Add Goal" to plant your first savings tree and start tracking your progress!</p>
        </div>
      ) : (
        <div className="grove__goals">
          {goals.map((goal, i) => {
            const progress = goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
            const color = goal.color || CARD_COLORS[i % CARD_COLORS.length];
            const GoalIcon = GOAL_ICONS[i % GOAL_ICONS.length];
            const isEditing = editId === goal.id;
            return (
              <div key={goal.id} className="grove__goal glass-card animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                {isEditing ? (
                  <div className="grove__edit-form">
                    <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="grove__edit-input" placeholder="Goal Name" />
                    <input type="number" value={editForm.target} onChange={e => setEditForm(f => ({ ...f, target: e.target.value }))} className="grove__edit-input" placeholder="Target ₹" />
                    <input type="number" value={editForm.saved} onChange={e => setEditForm(f => ({ ...f, saved: e.target.value }))} className="grove__edit-input" placeholder="Saved ₹" />
                    <input type="color" value={editForm.color} onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))} className="grove__color-input" />
                    <div className="grove__edit-actions">
                      <button className="txn__btn txn__btn--save" onClick={() => handleSaveEdit(goal.id)}><Check size={14} /></button>
                      <button className="txn__btn txn__btn--cancel" onClick={() => setEditId(null)}><X size={14} /></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grove__goal-header">
                      <div className="grove__goal-icon" style={{ background: color + '18', color }}>
                        <GoalIcon size={20} strokeWidth={1.8} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4>{goal.name}</h4>
                        <span className="grove__goal-pct" style={{ color }}>{progress}%</span>
                      </div>
                      <div className="grove__goal-btns">
                        <button className="txn__btn txn__btn--edit" onClick={() => { setEditId(goal.id); setEditForm({ name: goal.name, target: goal.target, saved: goal.saved, color: goal.color || '#8b5cf6' }); }}>
                          <Edit3 size={13} />
                        </button>
                        <button className="txn__btn txn__btn--delete" onClick={() => handleDelete(goal.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="grove__goal-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                      <div className="grove__goal-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)` }} />
                    </div>
                    <div className="grove__goal-amounts">
                      <span>₹{(goal.saved || 0).toLocaleString('en-IN')} saved</span>
                      <span className="grove__goal-target">of ₹{(goal.target || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
