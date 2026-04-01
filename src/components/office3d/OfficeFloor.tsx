/**
 * Office 3D — Premium Floor, Architecture & Environment
 * Rich command-center aesthetic with sectors, furniture, monitors, and panels.
 */
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { SECTOR_META, MEETING_POSITION } from "./OfficeLayout";

/* ── Sector Label ── */
function SectorLabel({ position, label, color }: { position: [number, number, number]; label: string; color: string }) {
  return (
    <Billboard position={position} follow lockX={false} lockY={false} lockZ={false}>
      <Text fontSize={0.2} color={color} anchorX="center" anchorY="bottom" outlineWidth={0.025} outlineColor="#000000" font={undefined} letterSpacing={0.08}>
        {label.toUpperCase()}
      </Text>
    </Billboard>
  );
}

/* ── Premium Floor ── */
function FloorPlane() {
  return (
    <group>
      {/* Main floor - slightly reflective dark surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 1]} receiveShadow>
        <planeGeometry args={[18, 16]} />
        <meshStandardMaterial color="#111128" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Subtle grid overlay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 1]}>
        <planeGeometry args={[18, 16]} />
        <meshStandardMaterial color="#1a1a40" roughness={0.8} metalness={0.1} transparent opacity={0.3} wireframe />
      </mesh>
    </group>
  );
}

/* ── Sector Floor Highlight ── */
function SectorFloor({ position, size, color }: { position: [number, number, number]; size: [number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const m = ref.current.material as THREE.MeshStandardMaterial;
    m.emissiveIntensity = 0.15 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.001, position[2]]}>
      <planeGeometry args={size} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.15}
        transparent
        opacity={0.08}
        roughness={0.9}
      />
    </mesh>
  );
}

/* ── Sector Border Lines (floor edge glow) ── */
function SectorBorder({ position, size, color }: { position: [number, number, number]; size: [number, number]; color: string }) {
  const hw = size[0] / 2;
  const hh = size[1] / 2;
  const y = 0.003;
  const corners = [
    [-hw, y, -hh], [hw, y, -hh], [hw, y, hh], [-hw, y, hh], [-hw, y, -hh],
  ].map(([x, cy, z]) => new THREE.Vector3(x + position[0], cy, z + position[2]));

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={corners.length}
          array={new Float32Array(corners.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.2} />
    </line>
  );
}

/* ── Glass Divider Panel ── */
function GlassPanel({ position, rotation = [0, 0, 0], size = [0.05, 1.8, 2] }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <boxGeometry args={size} />
      <meshPhysicalMaterial
        color="#2a2a5a"
        transparent
        opacity={0.12}
        roughness={0.1}
        metalness={0.8}
        clearcoat={1}
        clearcoatRoughness={0.1}
      />
    </mesh>
  );
}

/* ── Monitor Screen ── */
function MonitorScreen({ position, rotation = [0, 0, 0], size = [0.6, 0.4], color = "#60a5fa" }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number];
  color?: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const m = ref.current.material as THREE.MeshStandardMaterial;
    m.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 1.2 + position[0]) * 0.15;
  });
  return (
    <group position={position} rotation={rotation}>
      {/* Screen frame */}
      <mesh position={[0, 0, -0.015]}>
        <boxGeometry args={[size[0] + 0.04, size[1] + 0.04, 0.02]} />
        <meshStandardMaterial color="#1a1a30" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Screen surface */}
      <mesh ref={ref}>
        <planeGeometry args={size} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.6}
          roughness={0.2}
        />
      </mesh>
      {/* Screen stand */}
      <mesh position={[0, -(size[1] / 2) - 0.08, -0.02]}>
        <cylinderGeometry args={[0.015, 0.015, 0.16, 8]} />
        <meshStandardMaterial color="#252545" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  );
}

/* ── Wall-Mounted Display Panel ── */
function WallDisplay({ position, rotation = [0, 0, 0], width = 1.5, height = 0.8, color = "#a78bfa", label = "" }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  color?: string;
  label?: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const m = ref.current.material as THREE.MeshStandardMaterial;
    m.emissiveIntensity = 0.25 + Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
  });
  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[width + 0.06, height + 0.06, 0.03]} />
        <meshStandardMaterial color="#15152d" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Screen */}
      <mesh ref={ref}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.25}
          transparent
          opacity={0.35}
          roughness={0.3}
        />
      </mesh>
      {/* Label */}
      {label && (
        <Text
          position={[0, -(height / 2) - 0.1, 0.01]}
          fontSize={0.08}
          color={color}
          anchorX="center"
          anchorY="top"
          font={undefined}
          letterSpacing={0.1}
        >
          {label.toUpperCase()}
        </Text>
      )}
    </group>
  );
}

/* ── Ceiling Light Strip ── */
function CeilingLight({ position, length = 3, color = "#ffffff" }: {
  position: [number, number, number];
  length?: number;
  color?: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[length, 0.02, 0.15]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          transparent
          opacity={0.7}
        />
      </mesh>
      <rectAreaLight
        width={length}
        height={0.15}
        intensity={1.5}
        color={color}
        position={[0, -0.02, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

/* ── Meeting Table (Premium) ── */
function MeetingTable() {
  const [mx, my, mz] = MEETING_POSITION;
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ringRef.current) return;
    const m = ringRef.current.material as THREE.MeshBasicMaterial;
    m.opacity = 0.12 + Math.sin(state.clock.elapsedTime) * 0.04;
  });
  return (
    <group position={[mx, my, mz]}>
      {/* Table surface - glass top */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[1.3, 1.3, 0.04, 48]} />
        <meshPhysicalMaterial
          color="#1e1e45"
          roughness={0.1}
          metalness={0.7}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Inner glow ring on table */}
      <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 0.85, 48]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      {/* Table base - metallic pedestal */}
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.15, 0.25, 0.38, 16]} />
        <meshStandardMaterial color="#252550" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Floor ring glow */}
      <mesh ref={ringRef} position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.7, 48]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
      {/* Holographic center display */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.35, 16]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#fbbf24"
          emissiveIntensity={0.3}
          transparent
          opacity={0.15}
          roughness={0.1}
        />
      </mesh>
      <pointLight position={[0, 0.7, 0]} color="#fbbf24" intensity={0.4} distance={3} decay={2} />
    </group>
  );
}

/* ── Small Desk Props (keyboard, coffee, etc.) ── */
function DeskProp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Keyboard */}
      <mesh position={[0, 0.26, 0.1]}>
        <boxGeometry args={[0.25, 0.01, 0.08]} />
        <meshStandardMaterial color="#1a1a35" roughness={0.5} metalness={0.4} />
      </mesh>
    </group>
  );
}

/* ════════════════════════════════════════════ */
/* ── MAIN EXPORT ── */
/* ════════════════════════════════════════════ */
export function OfficeFloor() {
  return (
    <group>
      <FloorPlane />

      {/* ── Sector Floors ── */}
      <SectorFloor position={[0, 0, -1]} size={[5.5, 3.5]} color={SECTOR_META.command.color} />
      <SectorBorder position={[0, 0, -1]} size={[5.5, 3.5]} color={SECTOR_META.command.color} />

      <SectorFloor position={[0, 0, 2.25]} size={[9.5, 4.5]} color={SECTOR_META.operations.color} />
      <SectorBorder position={[0, 0, 2.25]} size={[9.5, 4.5]} color={SECTOR_META.operations.color} />

      <SectorFloor position={[5.5, 0, 1.25]} size={[3, 7]} color={SECTOR_META.support.color} />
      <SectorBorder position={[5.5, 0, 1.25]} size={[3, 7]} color={SECTOR_META.support.color} />

      <SectorFloor position={[-5.5, 0, 1.25]} size={[3, 7]} color={SECTOR_META.support.color} />
      <SectorBorder position={[-5.5, 0, 1.25]} size={[3, 7]} color={SECTOR_META.support.color} />

      <SectorFloor position={[0, 0, -4.5]} size={[4.5, 3.5]} color={SECTOR_META.meeting.color} />
      <SectorBorder position={[0, 0, -4.5]} size={[4.5, 3.5]} color={SECTOR_META.meeting.color} />

      {/* ── Sector Labels ── */}
      <SectorLabel position={[0, 2.6, -2]} label={SECTOR_META.command.label} color={SECTOR_META.command.color} />
      <SectorLabel position={[0, 2.6, 0.3]} label={SECTOR_META.operations.label} color={SECTOR_META.operations.color} />
      <SectorLabel position={[5.5, 2.6, -2.2]} label="Suporte" color={SECTOR_META.support.color} />
      <SectorLabel position={[-5.5, 2.6, -2.2]} label="Infra" color={SECTOR_META.support.color} />
      <SectorLabel position={[0, 2.6, -6]} label={SECTOR_META.meeting.label} color={SECTOR_META.meeting.color} />

      {/* ── Meeting Room ── */}
      <MeetingTable />

      {/* Meeting room glass walls */}
      <GlassPanel position={[-2.2, 0.9, -4.5]} size={[0.04, 1.8, 3.5]} />
      <GlassPanel position={[2.2, 0.9, -4.5]} size={[0.04, 1.8, 3.5]} />
      <GlassPanel position={[0, 0.9, -6.2]} rotation={[0, Math.PI / 2, 0]} size={[0.04, 1.8, 4.4]} />

      {/* ── Glass Dividers between sectors ── */}
      <GlassPanel position={[-4, 0.9, 1]} size={[0.04, 1.6, 6]} />
      <GlassPanel position={[4, 0.9, 1]} size={[0.04, 1.6, 6]} />

      {/* ── Wall Displays ── */}
      {/* Command center main display */}
      <WallDisplay
        position={[0, 1.6, -2.6]}
        width={2.5}
        height={1}
        color="#a78bfa"
        label="Sistema Central"
      />
      {/* Operations side displays */}
      <WallDisplay
        position={[-3.9, 1.5, 2.25]}
        rotation={[0, Math.PI / 2, 0]}
        width={1.8}
        height={0.7}
        color="#60a5fa"
        label="Operações"
      />
      <WallDisplay
        position={[3.9, 1.5, 2.25]}
        rotation={[0, -Math.PI / 2, 0]}
        width={1.8}
        height={0.7}
        color="#60a5fa"
        label="Pipeline"
      />
      {/* Support displays */}
      <WallDisplay
        position={[6.9, 1.4, 1]}
        rotation={[0, -Math.PI / 2, 0]}
        width={1.2}
        height={0.6}
        color="#6ee7b7"
        label="Recursos"
      />
      <WallDisplay
        position={[-6.9, 1.4, 1]}
        rotation={[0, Math.PI / 2, 0]}
        width={1.2}
        height={0.6}
        color="#6ee7b7"
        label="Infra"
      />

      {/* ── Ceiling Lights ── */}
      <CeilingLight position={[0, 4, -1]} length={4} color="#c4b5fd" />
      <CeilingLight position={[0, 4, 2]} length={7} color="#93c5fd" />
      <CeilingLight position={[0, 4, 3.5]} length={7} color="#93c5fd" />
      <CeilingLight position={[5.5, 4, 1]} length={2} color="#6ee7b7" />
      <CeilingLight position={[-5.5, 4, 1]} length={2} color="#6ee7b7" />
      <CeilingLight position={[0, 3.5, -4.5]} length={3} color="#fde68a" />

      {/* ── Grid (very subtle) ── */}
      <gridHelper args={[18, 36, "#15153a", "#101030"]} position={[0, 0.003, 1]} />
    </group>
  );
}
