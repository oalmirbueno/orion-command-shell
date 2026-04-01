/**
 * Office 3D — Premium Environment
 * Rich command-center with architectural mass, raised platforms,
 * structural pillars, server racks, curved displays, and warm lighting.
 */
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { SECTOR_META, MEETING_POSITION } from "./OfficeLayout";

/* ══════════════════════════════════════════════════ */
/* ── PRIMITIVES ── */
/* ══════════════════════════════════════════════════ */

function SectorLabel({ position, label, color }: { position: [number, number, number]; label: string; color: string }) {
  return (
    <Billboard position={position} follow lockX={false} lockY={false} lockZ={false}>
      <Text fontSize={0.18} color={color} anchorX="center" anchorY="bottom" outlineWidth={0.03} outlineColor="#0a0a18" font={undefined} letterSpacing={0.12}>
        {label.toUpperCase()}
      </Text>
    </Billboard>
  );
}

/* ── Floor ── */
function FloorPlane() {
  return (
    <group>
      {/* Primary floor - mid-tone with warm undertone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 1]} receiveShadow>
        <planeGeometry args={[20, 18]} />
        <meshStandardMaterial color="#161630" roughness={0.55} metalness={0.25} />
      </mesh>
      {/* Reflective overlay for premium feel */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 1]}>
        <planeGeometry args={[20, 18]} />
        <meshPhysicalMaterial
          color="#1e1e42"
          roughness={0.3}
          metalness={0.4}
          clearcoat={0.3}
          clearcoatRoughness={0.4}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}

/* ── Sector Floor ── */
function SectorFloor({ position, size, color, elevated = false }: {
  position: [number, number, number]; size: [number, number]; color: string; elevated?: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const m = ref.current.material as THREE.MeshStandardMaterial;
    m.emissiveIntensity = 0.2 + Math.sin(state.clock.elapsedTime * 0.4) * 0.06;
  });
  const y = elevated ? 0.04 : 0.002;
  return (
    <group>
      {elevated && (
        <mesh position={[position[0], 0.02, position[2]]}>
          <boxGeometry args={[size[0], 0.04, size[1]]} />
          <meshStandardMaterial color="#1a1a3d" roughness={0.4} metalness={0.5} />
        </mesh>
      )}
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[position[0], y, position[2]]}>
        <planeGeometry args={size} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} transparent opacity={0.1} roughness={0.8} />
      </mesh>
    </group>
  );
}

/* ── Floor border glow lines ── */
function SectorBorder({ position, size, color }: { position: [number, number, number]; size: [number, number]; color: string }) {
  const hw = size[0] / 2, hh = size[1] / 2, y = 0.005;
  const corners = [[-hw, y, -hh], [hw, y, -hh], [hw, y, hh], [-hw, y, hh], [-hw, y, -hh]]
    .map(([x, cy, z]) => new THREE.Vector3(x + position[0], cy, z + position[2]));
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={corners.length}
          array={new Float32Array(corners.flatMap(p => [p.x, p.y, p.z]))} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.25} />
    </line>
  );
}

/* ── Glass Panel ── */
function GlassPanel({ position, rotation = [0, 0, 0], size = [0.05, 2, 2] }: {
  position: [number, number, number]; rotation?: [number, number, number]; size?: [number, number, number];
}) {
  return (
    <group>
      <mesh position={position} rotation={rotation} castShadow>
        <boxGeometry args={size} />
        <meshPhysicalMaterial color="#3040708" transparent opacity={0.1} roughness={0.05} metalness={0.9}
          clearcoat={1} clearcoatRoughness={0.05} />
      </mesh>
      {/* Frame edges */}
      <mesh position={[position[0], position[1] + size[1] / 2, position[2]]} rotation={rotation}>
        <boxGeometry args={[size[0] + 0.02, 0.03, size[2] + 0.02]} />
        <meshStandardMaterial color="#353560" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[position[0], position[1] - size[1] / 2, position[2]]} rotation={rotation}>
        <boxGeometry args={[size[0] + 0.02, 0.03, size[2] + 0.02]} />
        <meshStandardMaterial color="#353560" roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
}

/* ── Structural Pillar ── */
function Pillar({ position, height = 3.5, radius = 0.08 }: {
  position: [number, number, number]; height?: number; radius?: number;
}) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, height, 12]} />
        <meshStandardMaterial color="#252550" roughness={0.25} metalness={0.75} />
      </mesh>
      {/* Base plate */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 2.5, 16]} />
        <meshStandardMaterial color="#303065" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Top accent ring */}
      <mesh position={[0, height - 0.1, 0]}>
        <torusGeometry args={[radius + 0.02, 0.01, 8, 16]} />
        <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.3} roughness={0.2} />
      </mesh>
    </group>
  );
}

/* ── Wall Display ── */
function WallDisplay({ position, rotation = [0, 0, 0], width = 1.5, height = 0.8, color = "#a78bfa", label = "" }: {
  position: [number, number, number]; rotation?: [number, number, number]; width?: number; height?: number; color?: string; label?: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const m = ref.current.material as THREE.MeshStandardMaterial;
    m.emissiveIntensity = 0.35 + Math.sin(state.clock.elapsedTime * 0.7 + position[0]) * 0.12;
  });
  return (
    <group position={position} rotation={rotation}>
      {/* Thick frame with beveled look */}
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[width + 0.08, height + 0.08, 0.04]} />
        <meshStandardMaterial color="#1a1a38" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Screen surface */}
      <mesh ref={ref}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} transparent opacity={0.5} roughness={0.15} />
      </mesh>
      {/* Status LED strip at bottom */}
      <mesh position={[0, -(height / 2) - 0.05, -0.01]}>
        <boxGeometry args={[width * 0.6, 0.015, 0.01]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      {label && (
        <Text position={[0, -(height / 2) - 0.12, 0.01]} fontSize={0.07} color={color}
          anchorX="center" anchorY="top" font={undefined} letterSpacing={0.12}>
          {label.toUpperCase()}
        </Text>
      )}
    </group>
  );
}

/* ── Command Console (large curved desk) ── */
function CommandConsole() {
  const screenRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!screenRef.current) return;
    const m = screenRef.current.material as THREE.MeshStandardMaterial;
    m.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 0.6) * 0.15;
  });
  return (
    <group position={[0, 0, -1.8]}>
      {/* Curved console desk */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[3.5, 0.06, 0.8]} />
        <meshStandardMaterial color="#1e1e48" roughness={0.25} metalness={0.65} />
      </mesh>
      {/* Console front edge glow */}
      <mesh position={[0, 0.4, 0.41]}>
        <boxGeometry args={[3.5, 0.06, 0.012]} />
        <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.5} transparent opacity={0.7} />
      </mesh>
      {/* Console side panels */}
      {[-1.75, 1.75].map((x, i) => (
        <mesh key={i} position={[x, 0.2, 0]} castShadow>
          <boxGeometry args={[0.06, 0.4, 0.8]} />
          <meshStandardMaterial color="#1a1a40" roughness={0.3} metalness={0.7} />
        </mesh>
      ))}
      {/* Large curved display behind console */}
      <mesh ref={screenRef} position={[0, 1.2, -0.3]}>
        <planeGeometry args={[3.2, 1.2]} />
        <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.5} transparent opacity={0.4} roughness={0.1} />
      </mesh>
      {/* Display frame */}
      <mesh position={[0, 1.2, -0.32]}>
        <boxGeometry args={[3.3, 1.3, 0.03]} />
        <meshStandardMaterial color="#151535" roughness={0.2} metalness={0.85} />
      </mesh>
      {/* Display stand pillars */}
      {[-1.2, 1.2].map((x, i) => (
        <mesh key={i} position={[x, 0.6, -0.3]}>
          <cylinderGeometry args={[0.025, 0.025, 1.2, 8]} />
          <meshStandardMaterial color="#252555" roughness={0.3} metalness={0.7} />
        </mesh>
      ))}
      {/* Status LED strip on console */}
      <mesh position={[0, 0.435, 0.35]}>
        <boxGeometry args={[2.8, 0.008, 0.008]} />
        <meshStandardMaterial color="#a3e635" emissive="#a3e635" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

/* ── Server Rack (for infra sector) ── */
function ServerRack({ position, color = "#6ee7b7" }: { position: [number, number, number]; color?: string }) {
  const ledRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ledRef.current) return;
    const m = ledRef.current.material as THREE.MeshStandardMaterial;
    m.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.3;
  });
  return (
    <group position={position}>
      {/* Rack body */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.5, 1.4, 0.35]} />
        <meshStandardMaterial color="#151535" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Front panel detail lines */}
      {[0.2, 0.5, 0.8, 1.1].map((y, i) => (
        <mesh key={i} position={[0, y, 0.18]}>
          <boxGeometry args={[0.42, 0.02, 0.005]} />
          <meshStandardMaterial color="#252555" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
      {/* LED indicators */}
      <mesh ref={ledRef} position={[0.18, 0.9, 0.185]}>
        <boxGeometry args={[0.03, 0.03, 0.005]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.18, 0.7, 0.185]}>
        <boxGeometry args={[0.03, 0.03, 0.005]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

/* ── Ceiling Light Strip (brighter, wider) ── */
function CeilingLight({ position, length = 3, color = "#ffffff", width = 0.2 }: {
  position: [number, number, number]; length?: number; color?: string; width?: number;
}) {
  return (
    <group position={position}>
      {/* Light housing */}
      <mesh>
        <boxGeometry args={[length, 0.04, width + 0.1]} />
        <meshStandardMaterial color="#20204a" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Emissive surface */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[length - 0.1, 0.01, width]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.8} />
      </mesh>
      <rectAreaLight width={length} height={width} intensity={2} color={color}
        position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]} />
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
    m.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
  });
  return (
    <group position={[mx, my, mz]}>
      {/* Table surface */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[1.4, 1.4, 0.05, 48]} />
        <meshPhysicalMaterial color="#1e1e50" roughness={0.08} metalness={0.7}
          clearcoat={0.9} clearcoatRoughness={0.08} transparent opacity={0.9} />
      </mesh>
      {/* Inner tech ring on table */}
      <mesh position={[0, 0.41, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 0.75, 48]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.41, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.15, 48]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      {/* Central pedestal */}
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.12, 0.2, 0.38, 16]} />
        <meshStandardMaterial color="#252558" roughness={0.25} metalness={0.8} />
      </mesh>
      {/* Floor ring */}
      <mesh ref={ringRef} position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 1.8, 48]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      {/* Holographic projector */}
      <mesh position={[0, 0.55, 0]}>
        <coneGeometry args={[0.15, 0.25, 16, 1, true]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.4}
          transparent opacity={0.1} roughness={0.05} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 0.8, 0]} color="#fbbf24" intensity={0.5} distance={4} decay={2} />
      {/* Chairs around table */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const cx = Math.cos(angle) * 2;
        const cz = Math.sin(angle) * 2;
        return (
          <group key={i} position={[cx, 0, cz]} rotation={[0, -angle + Math.PI, 0]}>
            {/* Seat */}
            <mesh position={[0, 0.28, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.04, 12]} />
              <meshStandardMaterial color="#1a1a40" roughness={0.4} metalness={0.5} />
            </mesh>
            {/* Back */}
            <mesh position={[0, 0.45, -0.12]}>
              <boxGeometry args={[0.25, 0.3, 0.03]} />
              <meshStandardMaterial color="#1a1a40" roughness={0.4} metalness={0.5} />
            </mesh>
            {/* Leg */}
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.28, 6]} />
              <meshStandardMaterial color="#303060" roughness={0.3} metalness={0.6} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ── Ceiling Beam Structure ── */
function CeilingBeams() {
  const beamColor = "#1a1a42";
  return (
    <group>
      {/* Main longitudinal beams */}
      {[-4, 0, 4].map(x => (
        <mesh key={`lb-${x}`} position={[x, 3.8, 1]}>
          <boxGeometry args={[0.1, 0.15, 16]} />
          <meshStandardMaterial color={beamColor} roughness={0.3} metalness={0.6} />
        </mesh>
      ))}
      {/* Cross beams */}
      {[-4, -1, 2, 5].map(z => (
        <mesh key={`cb-${z}`} position={[0, 3.8, z]}>
          <boxGeometry args={[10, 0.1, 0.1]} />
          <meshStandardMaterial color={beamColor} roughness={0.3} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/* ══════════════════════════════════════════════════ */
/* ── MAIN EXPORT ── */
/* ══════════════════════════════════════════════════ */

export function OfficeFloor() {
  return (
    <group>
      <FloorPlane />

      {/* ── Sector Floors ── */}
      <SectorFloor position={[0, 0, -1]} size={[5.5, 3.5]} color={SECTOR_META.command.color} elevated />
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
      <SectorLabel position={[0, 2.8, -2.2]} label={SECTOR_META.command.label} color={SECTOR_META.command.color} />
      <SectorLabel position={[0, 2.8, 0.2]} label={SECTOR_META.operations.label} color={SECTOR_META.operations.color} />
      <SectorLabel position={[5.5, 2.8, -2.3]} label="Suporte" color={SECTOR_META.support.color} />
      <SectorLabel position={[-5.5, 2.8, -2.3]} label="Infra" color={SECTOR_META.support.color} />
      <SectorLabel position={[0, 2.8, -6.2]} label={SECTOR_META.meeting.label} color={SECTOR_META.meeting.color} />

      {/* ══ COMMAND CENTER ══ */}
      <CommandConsole />

      {/* ══ MEETING ROOM ══ */}
      <MeetingTable />
      <GlassPanel position={[-2.2, 1, -4.5]} size={[0.04, 2, 3.5]} />
      <GlassPanel position={[2.2, 1, -4.5]} size={[0.04, 2, 3.5]} />
      <GlassPanel position={[0, 1, -6.2]} rotation={[0, Math.PI / 2, 0]} size={[0.04, 2, 4.4]} />

      {/* ══ GLASS DIVIDERS ══ */}
      <GlassPanel position={[-4, 1, 1]} size={[0.04, 2, 7]} />
      <GlassPanel position={[4, 1, 1]} size={[0.04, 2, 7]} />

      {/* ══ STRUCTURAL PILLARS ══ */}
      <Pillar position={[-4, 0, -2.5]} />
      <Pillar position={[4, 0, -2.5]} />
      <Pillar position={[-4, 0, 4.5]} />
      <Pillar position={[4, 0, 4.5]} />
      <Pillar position={[-2.2, 0, -2.8]} height={3} radius={0.05} />
      <Pillar position={[2.2, 0, -2.8]} height={3} radius={0.05} />

      {/* ══ WALL DISPLAYS ══ */}
      <WallDisplay position={[0, 1.6, -2.7]} width={2.8} height={1.1} color="#a78bfa" label="Sistema Central" />
      <WallDisplay position={[-3.9, 1.5, 2.25]} rotation={[0, Math.PI / 2, 0]} width={2} height={0.8} color="#60a5fa" label="Operações" />
      <WallDisplay position={[3.9, 1.5, 2.25]} rotation={[0, -Math.PI / 2, 0]} width={2} height={0.8} color="#60a5fa" label="Pipeline" />
      <WallDisplay position={[6.9, 1.4, 0.5]} rotation={[0, -Math.PI / 2, 0]} width={1.4} height={0.65} color="#6ee7b7" label="Recursos" />
      <WallDisplay position={[-6.9, 1.4, 0.5]} rotation={[0, Math.PI / 2, 0]} width={1.4} height={0.65} color="#6ee7b7" label="Infra" />
      {/* Extra small display in meeting room */}
      <WallDisplay position={[0, 1.3, -6.1]} width={1.6} height={0.65} color="#fbbf24" label="Briefing" />

      {/* ══ SERVER RACKS (Infra sector) ══ */}
      <ServerRack position={[-5.8, 0, 2.5]} color="#6ee7b7" />
      <ServerRack position={[-5.2, 0, 2.5]} color="#6ee7b7" />
      <ServerRack position={[-5.8, 0, 3.5]} color="#34d399" />
      <ServerRack position={[-5.2, 0, 3.5]} color="#34d399" />

      {/* ══ SERVER RACKS (Support sector) ══ */}
      <ServerRack position={[5.2, 0, 3]} color="#6ee7b7" />
      <ServerRack position={[5.8, 0, 3]} color="#6ee7b7" />

      {/* ══ CEILING ══ */}
      <CeilingBeams />
      <CeilingLight position={[0, 3.7, -1]} length={4.5} color="#c4b5fd" width={0.25} />
      <CeilingLight position={[-2, 3.7, 2]} length={3.5} color="#93c5fd" width={0.2} />
      <CeilingLight position={[2, 3.7, 2]} length={3.5} color="#93c5fd" width={0.2} />
      <CeilingLight position={[0, 3.7, 3.5]} length={7} color="#93c5fd" width={0.2} />
      <CeilingLight position={[5.5, 3.7, 1]} length={2.2} color="#6ee7b7" width={0.18} />
      <CeilingLight position={[-5.5, 3.7, 1]} length={2.2} color="#6ee7b7" width={0.18} />
      <CeilingLight position={[0, 3.3, -4.5]} length={3.5} color="#fde68a" width={0.2} />

      {/* ── Subtle floor grid ── */}
      <gridHelper args={[20, 40, "#18184a", "#121240"]} position={[0, 0.004, 1]} />
    </group>
  );
}
