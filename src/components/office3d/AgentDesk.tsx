/**
 * Office 3D — Premium Agent Desk with 2D billboard avatar
 * Includes particle effects for active agents and alert indicators.
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

/* ── Particle system for active agents ── */
function ActiveParticles({ color, count = 8 }: { color: string; count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.8;
      arr[i * 3 + 1] = Math.random() * 1.2 + 0.3;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const geo = ref.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const baseY = ((t * 0.3 + i * 0.4) % 1.5) + 0.3;
      posAttr.setY(i, baseY);
      posAttr.setX(i, Math.sin(t * 0.8 + i * 1.2) * 0.3);
      posAttr.setZ(i, Math.cos(t * 0.6 + i * 0.9) * 0.3);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.03} transparent opacity={0.6} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ── Alert ring indicator ── */
function AlertRing({ count }: { count: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const m = ref.current.material as THREE.MeshBasicMaterial;
    m.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
  });

  if (count <= 0) return null;
  return (
    <group>
      <mesh ref={ref} position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.62, 24]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* Alert badge */}
      <Billboard position={[0.4, 1.35, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <mesh>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <Text position={[0, -0.01, 0.01]} fontSize={0.07} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>
          {String(count)}
        </Text>
      </Billboard>
    </group>
  );
}

/* ── Main Desk Component ── */
export function AgentDesk({ agent, desk, inMeeting, meetingPos, onClick, onHover }: AgentDeskProps) {
  const tierColor = TIER_COLORS[agent.tier] || TIER_COLORS.support;
  const sv = STATUS_VISUAL[agent.status] || STATUS_VISUAL.idle;
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const platformRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef(0);

  const targetPos = inMeeting && meetingPos ? meetingPos : desk.position;

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    // Smooth movement
    g.position.x += (targetPos[0] - g.position.x) * Math.min(delta * 3, 1);
    g.position.y += (targetPos[1] - g.position.y) * Math.min(delta * 3, 1);
    g.position.z += (targetPos[2] - g.position.z) * Math.min(delta * 3, 1);

    // Platform glow
    if (platformRef.current) {
      const pm = platformRef.current.material as THREE.MeshStandardMaterial;
      const tEI = hovered ? 0.8 : (agent.status === "active" ? 0.4 : 0.15);
      pm.emissiveIntensity += (tEI - pm.emissiveIntensity) * Math.min(delta * 6, 1);
    }

    // Inner ring pulse
    if (innerRingRef.current) {
      pulseRef.current += delta * 2.5;
      const m = innerRingRef.current.material as THREE.MeshBasicMaterial;
      const base = agent.status === "active" ? 0.35 : (agent.status === "idle" ? 0.15 : 0.05);
      const pulse = agent.status === "active" ? Math.sin(pulseRef.current) * 0.15 : 0;
      const target = hovered ? 0.5 : base + pulse;
      m.opacity += (target - m.opacity) * Math.min(delta * 8, 1);
    }

    // Outer hover glow
    if (outerGlowRef.current) {
      const m = outerGlowRef.current.material as THREE.MeshBasicMaterial;
      m.opacity += ((hovered ? 0.25 : 0) - m.opacity) * Math.min(delta * 8, 1);
    }
  });

  const isActive = agent.status === "active";
  const hasTask = agent.currentTask !== "Sem tarefa ativa";

  return (
    <group ref={groupRef} position={desk.position}>
      {/* ── Desk (only when not in meeting) ── */}
      {!inMeeting && (
        <group>
          {/* Desk surface - premium material */}
          <mesh position={[0, 0.22, 0]} castShadow>
            <boxGeometry args={[1.1, 0.05, 0.65]} />
            <meshStandardMaterial color="#1a1a42" roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Desk front edge glow */}
          <mesh position={[0, 0.22, 0.33]}>
            <boxGeometry args={[1.1, 0.05, 0.01]} />
            <meshStandardMaterial color={tierColor} emissive={tierColor} emissiveIntensity={0.4} transparent opacity={0.5} />
          </mesh>
          {/* Desk legs */}
          {[[-0.45, 0.11, -0.25], [0.45, 0.11, -0.25], [-0.45, 0.11, 0.25], [0.45, 0.11, 0.25]].map((pos, i) => (
            <mesh key={i} position={pos as [number, number, number]}>
              <cylinderGeometry args={[0.02, 0.02, 0.22, 8]} />
              <meshStandardMaterial color="#252555" roughness={0.3} metalness={0.7} />
            </mesh>
          ))}
          {/* Monitor on desk */}
          <mesh position={[0, 0.45, -0.15]}>
            <boxGeometry args={[0.45, 0.3, 0.015]} />
            <meshStandardMaterial
              color={tierColor}
              emissive={tierColor}
              emissiveIntensity={isActive ? 0.5 : 0.15}
              transparent
              opacity={0.5}
              roughness={0.2}
            />
          </mesh>
          {/* Monitor stand */}
          <mesh position={[0, 0.32, -0.15]}>
            <cylinderGeometry args={[0.015, 0.015, 0.14, 8]} />
            <meshStandardMaterial color="#252555" roughness={0.4} metalness={0.6} />
          </mesh>
          {/* Keyboard on desk */}
          <mesh position={[0, 0.255, 0.1]}>
            <boxGeometry args={[0.28, 0.008, 0.1]} />
            <meshStandardMaterial color="#15153a" roughness={0.6} metalness={0.3} />
          </mesh>
        </group>
      )}

      {/* ── Agent Platform (circular base) ── */}
      <mesh ref={platformRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 32]} />
        <meshStandardMaterial
          color={tierColor}
          emissive={tierColor}
          emissiveIntensity={0.2}
          transparent
          opacity={0.12}
          roughness={0.8}
        />
      </mesh>

      {/* Inner status ring */}
      <mesh ref={innerRingRef} position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.48, 32]} />
        <meshBasicMaterial color={sv.color} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Outer hover ring */}
      <mesh ref={outerGlowRef} position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.52, 0.58, 32]} />
        <meshBasicMaterial color={tierColor} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* ── Interactive hitbox ── */}
      <mesh
        position={[0, 0.8, 0]}
        onClick={(e) => { e.stopPropagation(); onClick?.(agent); }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
          const ev = e as unknown as { clientX: number; clientY: number };
          onHover?.(agent, { x: ev.clientX, y: ev.clientY });
        }}
        onPointerMove={(e) => {
          const ev = e as unknown as { clientX: number; clientY: number };
          onHover?.(agent, { x: ev.clientX, y: ev.clientY });
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
          onHover?.(null);
        }}
      >
        <boxGeometry args={[1, 1.4, 0.7]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* ── Avatar (2D billboard) ── */}
      <Billboard position={[0, 1.15, 0]} follow lockX={false} lockY={false} lockZ={false}>
        {/* Outer glow circle */}
        <mesh>
          <circleGeometry args={[0.3, 32]} />
          <meshBasicMaterial color={tierColor} transparent opacity={hovered ? 0.15 : 0.06} />
        </mesh>
        {/* Avatar circle */}
        <mesh position={[0, 0, 0.001]}>
          <circleGeometry args={[0.22, 32]} />
          <meshBasicMaterial color={tierColor} transparent opacity={hovered ? 1 : 0.85} />
        </mesh>
        {/* Initial letter */}
        <Text position={[0, -0.02, 0.002]} fontSize={0.18} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>
          {agent.name.charAt(0).toUpperCase()}
        </Text>
        {/* Status dot */}
        <mesh position={[0.2, 0.18, 0.002]}>
          <circleGeometry args={[0.055, 16]} />
          <meshBasicMaterial color="#0a0a1a" />
        </mesh>
        <mesh position={[0.2, 0.18, 0.003]}>
          <circleGeometry args={[0.04, 16]} />
          <meshBasicMaterial color={sv.color} />
        </mesh>
      </Billboard>

      {/* ── Name label ── */}
      <Billboard position={[0, 0.72, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <Text
          fontSize={0.11}
          color="#ffffff"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="#0a0a1a"
          font={undefined}
          maxWidth={1.3}
        >
          {agent.name}
        </Text>
      </Billboard>

      {/* ── Status / Task line ── */}
      <Billboard position={[0, 0.58, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <Text
          fontSize={0.07}
          color={sv.color}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.012}
          outlineColor="#0a0a1a"
          font={undefined}
          maxWidth={1.5}
        >
          {isActive && hasTask ? `⚡ ${agent.currentTask.slice(0, 32)}` : sv.label}
        </Text>
      </Billboard>

      {/* ── Particles for active agents ── */}
      {isActive && <ActiveParticles color={tierColor} count={6} />}

      {/* ── Alert indicator ── */}
      <AlertRing count={agent.alertCount} />

      {/* ── Point light ── */}
      {agent.status !== "offline" && (
        <pointLight
          position={[0, 1.3, 0]}
          color={tierColor}
          intensity={isActive ? 0.4 : 0.15}
          distance={2}
          decay={2}
        />
      )}
    </group>
  );
}
