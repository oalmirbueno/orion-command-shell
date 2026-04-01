/**
 * Office 3D — Premium Agent Desk
 * Rich workstation with dual monitors, chair, platform glow,
 * particles for active agents, and alert indicators.
 */
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import { useRef, useState, useMemo } from "react";
import * as THREE from "three";
import type { AgentView } from "@/domains/agents/types";
import { TIER_COLORS, STATUS_VISUAL } from "./OfficeLayout";
import type { DeskPosition } from "./OfficeLayout";

interface AgentDeskProps {
  agent: AgentView;
  desk: DeskPosition;
  inMeeting?: boolean;
  meetingPos?: [number, number, number];
  onClick?: (agent: AgentView) => void;
  onHover?: (agent: AgentView | null, pos?: { x: number; y: number }) => void;
}

/* ── Particles for active agents ── */
function ActiveParticles({ color, count = 8 }: { color: string; count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.7;
      arr[i * 3 + 1] = Math.random() * 1.4 + 0.3;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.7;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const posAttr = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      posAttr.setY(i, ((t * 0.35 + i * 0.45) % 1.6) + 0.3);
      posAttr.setX(i, Math.sin(t * 0.7 + i * 1.3) * 0.25);
      posAttr.setZ(i, Math.cos(t * 0.5 + i * 0.8) * 0.25);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.035} transparent opacity={0.65} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ── Alert ring ── */
function AlertRing({ count }: { count: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
  });
  if (count <= 0) return null;
  return (
    <group>
      <mesh ref={ref} position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.56, 0.64, 24]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <Billboard position={[0.42, 1.4, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <mesh>
          <circleGeometry args={[0.09, 16]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <Text position={[0, -0.01, 0.01]} fontSize={0.075} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>
          {String(count)}
        </Text>
      </Billboard>
    </group>
  );
}

/* ══════════════════════════════════════════════════ */
/* ── MAIN DESK ── */
/* ══════════════════════════════════════════════════ */

export function AgentDesk({ agent, desk, inMeeting, meetingPos, onClick, onHover }: AgentDeskProps) {
  const tierColor = TIER_COLORS[agent.tier] || TIER_COLORS.support;
  const sv = STATUS_VISUAL[agent.status] || STATUS_VISUAL.idle;
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const platformRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef(0);
  const targetPos = inMeeting && meetingPos ? meetingPos : desk.position;
  const isActive = agent.status === "active";
  const hasTask = agent.currentTask !== "Sem tarefa ativa";

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    g.position.x += (targetPos[0] - g.position.x) * Math.min(delta * 3, 1);
    g.position.y += (targetPos[1] - g.position.y) * Math.min(delta * 3, 1);
    g.position.z += (targetPos[2] - g.position.z) * Math.min(delta * 3, 1);

    if (platformRef.current) {
      const pm = platformRef.current.material as THREE.MeshStandardMaterial;
      pm.emissiveIntensity += ((hovered ? 0.9 : isActive ? 0.45 : 0.18) - pm.emissiveIntensity) * Math.min(delta * 6, 1);
    }
    if (ringRef.current) {
      pulseRef.current += delta * 2.5;
      const m = ringRef.current.material as THREE.MeshBasicMaterial;
      const base = isActive ? 0.4 : agent.status === "idle" ? 0.18 : 0.06;
      const pulse = isActive ? Math.sin(pulseRef.current) * 0.15 : 0;
      m.opacity += ((hovered ? 0.55 : base + pulse) - m.opacity) * Math.min(delta * 8, 1);
    }
    if (outerRef.current) {
      const m = outerRef.current.material as THREE.MeshBasicMaterial;
      m.opacity += ((hovered ? 0.3 : 0) - m.opacity) * Math.min(delta * 8, 1);
    }
  });

  return (
    <group ref={groupRef} position={desk.position}>
      {/* ── WORKSTATION (hidden during meeting) ── */}
      {!inMeeting && (
        <group>
          {/* Desk surface */}
          <mesh position={[0, 0.24, 0]} castShadow>
            <boxGeometry args={[1.15, 0.05, 0.7]} />
            <meshStandardMaterial color="#1c1c48" roughness={0.25} metalness={0.6} />
          </mesh>
          {/* Front edge accent */}
          <mesh position={[0, 0.24, 0.36]}>
            <boxGeometry args={[1.15, 0.05, 0.012]} />
            <meshStandardMaterial color={tierColor} emissive={tierColor} emissiveIntensity={0.5} transparent opacity={0.65} />
          </mesh>
          {/* Side accent */}
          <mesh position={[-0.58, 0.24, 0]}>
            <boxGeometry args={[0.012, 0.05, 0.7]} />
            <meshStandardMaterial color={tierColor} emissive={tierColor} emissiveIntensity={0.3} transparent opacity={0.4} />
          </mesh>
          {/* Desk legs */}
          {[[-0.5, 0.12, -0.28], [0.5, 0.12, -0.28], [-0.5, 0.12, 0.28], [0.5, 0.12, 0.28]].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]}>
              <cylinderGeometry args={[0.018, 0.018, 0.24, 8]} />
              <meshStandardMaterial color="#2a2a5a" roughness={0.3} metalness={0.7} />
            </mesh>
          ))}
          {/* Primary monitor */}
          <mesh position={[0, 0.5, -0.18]}>
            <boxGeometry args={[0.5, 0.35, 0.012]} />
            <meshStandardMaterial color={tierColor} emissive={tierColor}
              emissiveIntensity={isActive ? 0.55 : 0.2} transparent opacity={0.55} roughness={0.15} />
          </mesh>
          {/* Monitor frame */}
          <mesh position={[0, 0.5, -0.195]}>
            <boxGeometry args={[0.54, 0.39, 0.01]} />
            <meshStandardMaterial color="#151538" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Monitor stand */}
          <mesh position={[0, 0.34, -0.18]}>
            <cylinderGeometry args={[0.015, 0.015, 0.15, 8]} />
            <meshStandardMaterial color="#2a2a5a" roughness={0.4} metalness={0.6} />
          </mesh>
          {/* Secondary monitor (smaller, angled) */}
          <mesh position={[0.35, 0.45, -0.15]} rotation={[0, -0.3, 0]}>
            <boxGeometry args={[0.3, 0.22, 0.01]} />
            <meshStandardMaterial color={tierColor} emissive={tierColor}
              emissiveIntensity={isActive ? 0.4 : 0.12} transparent opacity={0.4} roughness={0.2} />
          </mesh>
          {/* Keyboard */}
          <mesh position={[0, 0.275, 0.1]}>
            <boxGeometry args={[0.3, 0.008, 0.1]} />
            <meshStandardMaterial color="#161640" roughness={0.5} metalness={0.35} />
          </mesh>
          {/* Mouse */}
          <mesh position={[0.25, 0.275, 0.12]}>
            <boxGeometry args={[0.05, 0.01, 0.07]} />
            <meshStandardMaterial color="#161640" roughness={0.5} metalness={0.35} />
          </mesh>
          {/* Chair */}
          <group position={[0, 0, 0.55]}>
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.17, 0.17, 0.04, 12]} />
              <meshStandardMaterial color="#1a1a45" roughness={0.4} metalness={0.5} />
            </mesh>
            <mesh position={[0, 0.5, -0.14]}>
              <boxGeometry args={[0.3, 0.35, 0.03]} />
              <meshStandardMaterial color="#1a1a45" roughness={0.4} metalness={0.5} />
            </mesh>
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
              <meshStandardMaterial color="#303060" roughness={0.3} metalness={0.6} />
            </mesh>
          </group>
        </group>
      )}

      {/* ── AGENT PLATFORM ── */}
      <mesh ref={platformRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.52, 32]} />
        <meshStandardMaterial color={tierColor} emissive={tierColor} emissiveIntensity={0.2}
          transparent opacity={0.14} roughness={0.7} />
      </mesh>

      {/* Status ring */}
      <mesh ref={ringRef} position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.44, 0.5, 32]} />
        <meshBasicMaterial color={sv.color} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Hover outer ring */}
      <mesh ref={outerRef} position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.54, 0.6, 32]} />
        <meshBasicMaterial color={tierColor} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* ── INTERACTIVE HITBOX ── */}
      <mesh position={[0, 0.85, 0]}
        onClick={(e) => { e.stopPropagation(); onClick?.(agent); }}
        onPointerOver={(e) => {
          e.stopPropagation(); setHovered(true);
          document.body.style.cursor = "pointer";
          const ev = e as unknown as { clientX: number; clientY: number };
          onHover?.(agent, { x: ev.clientX, y: ev.clientY });
        }}
        onPointerMove={(e) => {
          const ev = e as unknown as { clientX: number; clientY: number };
          onHover?.(agent, { x: ev.clientX, y: ev.clientY });
        }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; onHover?.(null); }}
      >
        <boxGeometry args={[1.1, 1.5, 0.8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* ── AVATAR BILLBOARD ── */}
      <Billboard position={[0, 1.2, 0]} follow lockX={false} lockY={false} lockZ={false}>
        {/* Outer glow */}
        <mesh>
          <circleGeometry args={[0.32, 32]} />
          <meshBasicMaterial color={tierColor} transparent opacity={hovered ? 0.2 : 0.08} />
        </mesh>
        {/* Avatar body */}
        <mesh position={[0, 0, 0.001]}>
          <circleGeometry args={[0.24, 32]} />
          <meshBasicMaterial color={tierColor} transparent opacity={hovered ? 1 : 0.88} />
        </mesh>
        {/* Initial */}
        <Text position={[0, -0.02, 0.002]} fontSize={0.19} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>
          {agent.name.charAt(0).toUpperCase()}
        </Text>
        {/* Status dot border */}
        <mesh position={[0.21, 0.19, 0.002]}>
          <circleGeometry args={[0.06, 16]} />
          <meshBasicMaterial color="#0c0c20" />
        </mesh>
        {/* Status dot */}
        <mesh position={[0.21, 0.19, 0.003]}>
          <circleGeometry args={[0.042, 16]} />
          <meshBasicMaterial color={sv.color} />
        </mesh>
      </Billboard>

      {/* ── NAME ── */}
      <Billboard position={[0, 0.76, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <Text fontSize={0.115} color="#ffffff" anchorX="center" anchorY="bottom"
          outlineWidth={0.022} outlineColor="#0c0c20" font={undefined} maxWidth={1.4}>
          {agent.name}
        </Text>
      </Billboard>

      {/* ── STATUS / TASK ── */}
      <Billboard position={[0, 0.62, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <Text fontSize={0.075} color={sv.color} anchorX="center" anchorY="bottom"
          outlineWidth={0.014} outlineColor="#0c0c20" font={undefined} maxWidth={1.6}>
          {isActive && hasTask ? `⚡ ${agent.currentTask.slice(0, 30)}` : sv.label}
        </Text>
      </Billboard>

      {/* ── PARTICLES ── */}
      {isActive && <ActiveParticles color={tierColor} count={7} />}

      {/* ── ALERTS ── */}
      <AlertRing count={agent.alertCount} />

      {/* ── LIGHT ── */}
      {agent.status !== "offline" && (
        <pointLight position={[0, 1.4, 0]} color={tierColor}
          intensity={isActive ? 0.45 : 0.18} distance={2.2} decay={2} />
      )}
    </group>
  );
}
