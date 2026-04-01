/**
 * Office 3D — Agent Desk (Architectural)
 * Light mid-tone workstation, clear materials, no dark silhouettes.
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

/* ── Subtle particles ── */
function ActiveParticles({ color, count = 4 }: { color: string; count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.4;
      arr[i * 3 + 1] = Math.random() * 1.0 + 0.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const posAttr = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      posAttr.setY(i, ((t * 0.18 + i * 0.55) % 1.2) + 0.5);
      posAttr.setX(i, Math.sin(t * 0.35 + i * 1.4) * 0.15);
      posAttr.setZ(i, Math.cos(t * 0.25 + i * 0.8) * 0.15);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.022} transparent opacity={0.35} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ── Alert badge ── */
function AlertBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Billboard position={[0.4, 1.4, 0]} follow lockX={false} lockY={false} lockZ={false}>
      <mesh>
        <circleGeometry args={[0.085, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <Text position={[0, -0.01, 0.01]} fontSize={0.07} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>
        {String(count)}
      </Text>
    </Billboard>
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
  const ringRef = useRef<THREE.Mesh>(null);
  const targetPos = inMeeting && meetingPos ? meetingPos : desk.position;
  const isActive = agent.status === "active";
  const hasTask = agent.currentTask !== "Sem tarefa ativa";

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    g.position.x += (targetPos[0] - g.position.x) * Math.min(delta * 3, 1);
    g.position.y += (targetPos[1] - g.position.y) * Math.min(delta * 3, 1);
    g.position.z += (targetPos[2] - g.position.z) * Math.min(delta * 3, 1);

    if (ringRef.current) {
      const m = ringRef.current.material as THREE.MeshBasicMaterial;
      const target = hovered ? 0.5 : isActive ? 0.3 : agent.status === "idle" ? 0.15 : 0.05;
      m.opacity += (target - m.opacity) * Math.min(delta * 6, 1);
    }
  });

  return (
    <group ref={groupRef} position={desk.position}>
      {/* ── WORKSTATION ── */}
      {!inMeeting && (
        <group>
          {/* Desk surface — light mid-tone */}
          <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.15, 0.055, 0.7]} />
            <meshPhysicalMaterial color="#6868a0" roughness={0.18} metalness={0.45}
              clearcoat={0.2} clearcoatRoughness={0.3} />
          </mesh>
          {/* Front edge accent */}
          <mesh position={[0, 0.24, 0.355]}>
            <boxGeometry args={[1.15, 0.055, 0.008]} />
            <meshStandardMaterial color={tierColor} emissive={tierColor} emissiveIntensity={0.12} transparent opacity={0.35} />
          </mesh>
          {/* Legs */}
          {[[-0.5, 0.12, -0.28], [0.5, 0.12, -0.28], [-0.5, 0.12, 0.28], [0.5, 0.12, 0.28]].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]} castShadow>
              <cylinderGeometry args={[0.02, 0.02, 0.24, 8]} />
              <meshStandardMaterial color="#7878a8" roughness={0.2} metalness={0.55} />
            </mesh>
          ))}
          {/* Primary monitor */}
          <mesh position={[0, 0.5, -0.18]} castShadow>
            <boxGeometry args={[0.5, 0.35, 0.012]} />
            <meshStandardMaterial color={tierColor} emissive={tierColor}
              emissiveIntensity={isActive ? 0.2 : 0.06} transparent opacity={0.5} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.5, -0.195]} castShadow>
            <boxGeometry args={[0.54, 0.39, 0.012]} />
            <meshStandardMaterial color="#505078" roughness={0.12} metalness={0.75} />
          </mesh>
          <mesh position={[0, 0.34, -0.18]}>
            <cylinderGeometry args={[0.015, 0.015, 0.15, 8]} />
            <meshStandardMaterial color="#7878a8" roughness={0.25} metalness={0.55} />
          </mesh>
          {/* Secondary monitor */}
          <mesh position={[0.35, 0.45, -0.15]} rotation={[0, -0.3, 0]}>
            <boxGeometry args={[0.3, 0.22, 0.01]} />
            <meshStandardMaterial color={tierColor} emissive={tierColor}
              emissiveIntensity={isActive ? 0.15 : 0.04} transparent opacity={0.4} roughness={0.15} />
          </mesh>
          {/* Keyboard */}
          <mesh position={[0, 0.275, 0.1]}>
            <boxGeometry args={[0.3, 0.008, 0.1]} />
            <meshStandardMaterial color="#585890" roughness={0.4} metalness={0.3} />
          </mesh>
          {/* Mouse */}
          <mesh position={[0.25, 0.275, 0.12]}>
            <boxGeometry args={[0.05, 0.01, 0.07]} />
            <meshStandardMaterial color="#585890" roughness={0.4} metalness={0.3} />
          </mesh>
          {/* Chair */}
          <group position={[0, 0, 0.55]}>
            <mesh position={[0, 0.3, 0]} castShadow>
              <cylinderGeometry args={[0.17, 0.17, 0.04, 12]} />
              <meshStandardMaterial color="#606090" roughness={0.3} metalness={0.4} />
            </mesh>
            <mesh position={[0, 0.5, -0.14]} castShadow>
              <boxGeometry args={[0.3, 0.35, 0.03]} />
              <meshStandardMaterial color="#606090" roughness={0.3} metalness={0.4} />
            </mesh>
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
              <meshStandardMaterial color="#7878a8" roughness={0.2} metalness={0.5} />
            </mesh>
          </group>
        </group>
      )}

      {/* ── STATUS RING ── */}
      <mesh ref={ringRef} position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.44, 0.49, 32]} />
        <meshBasicMaterial color={sv.color} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* ── HITBOX ── */}
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

      {/* ── AVATAR ── */}
      <Billboard position={[0, 1.2, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <mesh>
          <circleGeometry args={[0.26, 32]} />
          <meshBasicMaterial color={tierColor} transparent opacity={hovered ? 0.95 : 0.88} />
        </mesh>
        <Text position={[0, -0.02, 0.001]} fontSize={0.19} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>
          {agent.name.charAt(0).toUpperCase()}
        </Text>
        <mesh position={[0.2, 0.18, 0.001]}>
          <circleGeometry args={[0.055, 16]} />
          <meshBasicMaterial color="#2a2a48" />
        </mesh>
        <mesh position={[0.2, 0.18, 0.002]}>
          <circleGeometry args={[0.038, 16]} />
          <meshBasicMaterial color={sv.color} />
        </mesh>
      </Billboard>

      {/* ── NAME ── */}
      <Billboard position={[0, 0.78, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <Text fontSize={0.11} color="#e8e8f8" anchorX="center" anchorY="bottom"
          outlineWidth={0.018} outlineColor="#2a2a48" font={undefined} maxWidth={1.4}>
          {agent.name}
        </Text>
      </Billboard>

      {/* ── STATUS / TASK ── */}
      <Billboard position={[0, 0.64, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <Text fontSize={0.07} color={sv.color} anchorX="center" anchorY="bottom"
          outlineWidth={0.01} outlineColor="#2a2a48" font={undefined} maxWidth={1.6} fillOpacity={0.85}>
          {isActive && hasTask ? `⚡ ${agent.currentTask.slice(0, 30)}` : sv.label}
        </Text>
      </Billboard>

      {/* ── PARTICLES ── */}
      {isActive && <ActiveParticles color={tierColor} count={3} />}

      {/* ── ALERT ── */}
      <AlertBadge count={agent.alertCount} />

      {/* ── DESK LIGHT ── */}
      {agent.status !== "offline" && (
        <pointLight position={[0, 1.0, 0]} color={tierColor}
          intensity={isActive ? 0.18 : 0.06} distance={1.5} decay={2} />
      )}
    </group>
  );
}
