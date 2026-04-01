/**
 * Office 3D — Agent Desk with 2D billboard avatar
 * Each agent sits at a desk showing status, name, and current task.
 */
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";
import type { AgentView } from "@/domains/agents/types";
import { TIER_COLORS, STATUS_VISUAL } from "./OfficeLayout";
import type { DeskPosition } from "./OfficeLayout";

const STATUS_EMOJI: Record<string, string> = {
  active: "⚡",
  idle: "💤",
  offline: "⭘",
};

interface AgentDeskProps {
  agent: AgentView;
  desk: DeskPosition;
  inMeeting?: boolean;
  meetingPos?: [number, number, number];
  onClick?: (agent: AgentView) => void;
  onHover?: (agent: AgentView | null, pos?: { x: number; y: number }) => void;
}

export function AgentDesk({ agent, desk, inMeeting, meetingPos, onClick, onHover }: AgentDeskProps) {
  const tierColor = TIER_COLORS[agent.tier] || TIER_COLORS.support;
  const sv = STATUS_VISUAL[agent.status] || STATUS_VISUAL.idle;
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const deskGlowRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef(0);

  const targetPos = inMeeting && meetingPos ? meetingPos : desk.position;

  // Smooth position interpolation + glow animation
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    g.position.x += (targetPos[0] - g.position.x) * Math.min(delta * 3, 1);
    g.position.y += (targetPos[1] - g.position.y) * Math.min(delta * 3, 1);
    g.position.z += (targetPos[2] - g.position.z) * Math.min(delta * 3, 1);

    // Pulse for active agents
    if (sv.pulse) {
      pulseRef.current += delta * 2;
      const p = Math.sin(pulseRef.current) * 0.15 + 0.85;
      if (glowRef.current) {
        const m = glowRef.current.material as THREE.MeshBasicMaterial;
        m.opacity = hovered ? 0.5 : p * 0.3;
      }
    } else if (glowRef.current) {
      const m = glowRef.current.material as THREE.MeshBasicMaterial;
      const t = hovered ? 0.35 : (agent.status === "idle" ? 0.12 : 0.04);
      m.opacity += (t - m.opacity) * Math.min(delta * 6, 1);
    }

    if (deskGlowRef.current) {
      const dm = deskGlowRef.current.material as THREE.MeshBasicMaterial;
      const dt = hovered ? 0.2 : 0.05;
      dm.opacity += (dt - dm.opacity) * Math.min(delta * 6, 1);
    }
  });

  return (
    <group ref={groupRef} position={desk.position}>
      {/* Desk surface */}
      {!inMeeting && (
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[1, 0.04, 0.6]} />
          <meshStandardMaterial color="#18183a" roughness={0.5} metalness={0.4} />
        </mesh>
      )}

      {/* Desk edge glow */}
      {!inMeeting && (
        <mesh ref={deskGlowRef} position={[0, 0.24, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.1, 0.7]} />
          <meshBasicMaterial color={tierColor} transparent opacity={0.05} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Status ring on floor */}
      <mesh ref={glowRef} position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.5, 24]} />
        <meshBasicMaterial color={sv.color} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Interactive hitbox */}
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
        <boxGeometry args={[0.9, 1.2, 0.5]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Avatar icon (2D billboard) */}
      <Billboard position={[0, 1, 0]} follow lockX={false} lockY={false} lockZ={false}>
        {/* Status dot */}
        <mesh position={[0.28, 0.28, 0]}>
          <circleGeometry args={[0.06, 16]} />
          <meshBasicMaterial color={sv.color} />
        </mesh>
      </Billboard>

      {/* Agent avatar circle */}
      <Billboard position={[0, 1, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <mesh>
          <circleGeometry args={[0.25, 24]} />
          <meshBasicMaterial color={tierColor} transparent opacity={hovered ? 0.95 : 0.8} />
        </mesh>
        {/* Letter initial */}
        <Text position={[0, -0.02, 0.01]} fontSize={0.2} color="#ffffff" anchorX="center" anchorY="middle" font={undefined}>
          {agent.name.charAt(0).toUpperCase()}
        </Text>
      </Billboard>

      {/* Name */}
      <Billboard position={[0, 0.6, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <Text fontSize={0.12} color="#ffffff" anchorX="center" anchorY="bottom" outlineWidth={0.015} outlineColor="#000000" font={undefined} maxWidth={1.2}>
          {agent.name}
        </Text>
      </Billboard>

      {/* Status / task subtitle */}
      <Billboard position={[0, 0.45, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <Text fontSize={0.08} color={sv.color} anchorX="center" anchorY="bottom" outlineWidth={0.01} outlineColor="#000000" font={undefined} maxWidth={1.4}>
          {STATUS_EMOJI[agent.status]} {agent.status === "active" && agent.currentTask !== "Sem tarefa ativa" 
            ? agent.currentTask.slice(0, 30) 
            : sv.label}
        </Text>
      </Billboard>

      {/* Point light for active agents */}
      {agent.status !== "offline" && (
        <pointLight
          position={[0, 1.2, 0]}
          color={tierColor}
          intensity={agent.status === "active" ? 0.5 : 0.2}
          distance={2.5}
          decay={2}
        />
      )}
    </group>
  );
}
