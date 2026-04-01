/**
 * Office 3D — Premium Environment (Refined)
 * Sophisticated command-center with physical materials, warm lighting,
 * reduced FX, and premium architectural mass.
 */
import { useRef } from "react";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { SECTOR_META, MEETING_POSITION } from "./OfficeLayout";

/* ══════════════════════════════════════════════════ */
/* ── PRIMITIVES ── */
/* ══════════════════════════════════════════════════ */

function SectorLabel({ position, label, color }: { position: [number, number, number]; label: string; color: string }) {
  return (
    <Billboard position={position} follow lockX={false} lockY={false} lockZ={false}>
      <Text fontSize={0.16} color={color} anchorX="center" anchorY="bottom" outlineWidth={0.025} outlineColor="#12122a" font={undefined} letterSpacing={0.1}>
        {label.toUpperCase()}
      </Text>
    </Billboard>
  );
}

/* ── Floor ── */
function FloorPlane() {
  return (
    <group>
      {/* Primary floor — warmer, lighter base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 1]} receiveShadow>
        <planeGeometry args={[22, 20]} />
        <meshStandardMaterial color="#1e1e3a" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Polished overlay — subtle reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 1]}>
        <planeGeometry args={[22, 20]} />
        <meshPhysicalMaterial
          color="#262648"
          roughness={0.35}
          metalness={0.3}
          clearcoat={0.15}
          clearcoatRoughness={0.5}
          transparent
          opacity={0.35}
        />
      </mesh>
      {/* Floor tile lines — subtle grid pattern for materiality */}
      <gridHelper args={[20, 20, "#2a2a52", "#222244"]} position={[0, 0.003, 1]} />
      <gridHelper args={[20, 80, "#1e1e42", "#1a1a3c"]} position={[0, 0.004, 1]} />
    </group>
  );
}

/* ── Sector Floor — solid, no animation ── */
function SectorFloor({ position, size, color, elevated = false }: {
  position: [number, number, number]; size: [number, number]; color: string; elevated?: boolean;
}) {
  const y = elevated ? 0.04 : 0.003;
  return (
    <group>
      {elevated && (
        <mesh position={[position[0], 0.02, position[2]]}>
          <boxGeometry args={[size[0], 0.04, size[1]]} />
          <meshStandardMaterial color="#22224a" roughness={0.35} metalness={0.45} />
        </mesh>
      )}
      {/* Sector tint — very subtle, no emissive animation */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], y, position[2]]}>
        <planeGeometry args={size} />
        <meshStandardMaterial color={color} transparent opacity={0.06} roughness={0.8} />
      </mesh>
    </group>
  );
}

/* ── Sector border — clean thin line ── */
function SectorBorder({ position, size, color }: { position: [number, number, number]; size: [number, number]; color: string }) {
  const hw = size[0] / 2, hh = size[1] / 2, y = 0.006;
  const corners = [[-hw, y, -hh], [hw, y, -hh], [hw, y, hh], [-hw, y, hh], [-hw, y, -hh]]
    .map(([x, cy, z]) => new THREE.Vector3(x + position[0], cy, z + position[2]));
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={corners.length}
          array={new Float32Array(corners.flatMap(p => [p.x, p.y, p.z]))} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.18} />
    </line>
  );
}

/* ── Glass Panel — physical glass material ── */
function GlassPanel({ position, rotation = [0, 0, 0], size = [0.05, 2, 2] }: {
  position: [number, number, number]; rotation?: [number, number, number]; size?: [number, number, number];
}) {
  return (
    <group>
      <mesh position={position} rotation={rotation} castShadow>
        <boxGeometry args={size} />
        <meshPhysicalMaterial color="#8090b0" transparent opacity={0.08} roughness={0.05} metalness={0.1}
          clearcoat={1} clearcoatRoughness={0.05} />
      </mesh>
      {/* Metal frame top/bottom */}
      {[size[1] / 2, -size[1] / 2].map((yOff, i) => (
        <mesh key={i} position={[position[0], position[1] + yOff, position[2]]} rotation={rotation}>
          <boxGeometry args={[size[0] + 0.02, 0.035, size[2] + 0.02]} />
          <meshStandardMaterial color="#404068" roughness={0.25} metalness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Structural Pillar — clean metal ── */
function Pillar({ position, height = 3.5, radius = 0.08 }: {
  position: [number, number, number]; height?: number; radius?: number;
}) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, height, 16]} />
        <meshStandardMaterial color="#303058" roughness={0.2} metalness={0.75} />
      </mesh>
      {/* Base plate */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 2.5, 16]} />
        <meshStandardMaterial color="#383868" roughness={0.35} metalness={0.6} />
      </mesh>
      {/* Subtle accent ring at top — no emissive */}
      <mesh position={[0, height - 0.1, 0]}>
        <torusGeometry args={[radius + 0.02, 0.008, 8, 16]} />
        <meshStandardMaterial color="#505080" roughness={0.2} metalness={0.7} />
      </mesh>
    </group>
  );
}

/* ── Wall Display — solid screens, minimal glow ── */
function WallDisplay({ position, rotation = [0, 0, 0], width = 1.5, height = 0.8, color = "#a78bfa", label = "" }: {
  position: [number, number, number]; rotation?: [number, number, number]; width?: number; height?: number; color?: string; label?: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Frame / housing */}
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[width + 0.1, height + 0.1, 0.05]} />
        <meshStandardMaterial color="#1a1a3a" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Screen surface — low emissive, solid */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} transparent opacity={0.4} roughness={0.15} />
      </mesh>
      {/* Thin status indicator at bottom */}
      <mesh position={[0, -(height / 2) - 0.04, -0.01]}>
        <boxGeometry args={[width * 0.5, 0.01, 0.008]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      {label && (
        <Text position={[0, -(height / 2) - 0.1, 0.01]} fontSize={0.065} color={color}
          anchorX="center" anchorY="top" font={undefined} letterSpacing={0.1} fillOpacity={0.6}>
          {label.toUpperCase()}
        </Text>
      )}
    </group>
  );
}

/* ── Command Console — physical desk, no pulsing ── */
function CommandConsole() {
  return (
    <group position={[0, 0, -1.8]}>
      {/* Console desk surface — thick, solid */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[3.5, 0.07, 0.85]} />
        <meshPhysicalMaterial color="#222250" roughness={0.2} metalness={0.6}
          clearcoat={0.3} clearcoatRoughness={0.3} />
      </mesh>
      {/* Front edge — subtle accent, not emissive */}
      <mesh position={[0, 0.4, 0.43]}>
        <boxGeometry args={[3.5, 0.07, 0.015]} />
        <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.25} transparent opacity={0.5} />
      </mesh>
      {/* Console side panels */}
      {[-1.75, 1.75].map((x, i) => (
        <mesh key={i} position={[x, 0.2, 0]} castShadow>
          <boxGeometry args={[0.07, 0.42, 0.85]} />
          <meshStandardMaterial color="#1e1e45" roughness={0.25} metalness={0.65} />
        </mesh>
      ))}
      {/* Large display — static, not pulsing */}
      <mesh position={[0, 1.2, -0.3]}>
        <planeGeometry args={[3.2, 1.2]} />
        <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.25} transparent opacity={0.35} roughness={0.1} />
      </mesh>
      {/* Display frame — thick metal */}
      <mesh position={[0, 1.2, -0.33]}>
        <boxGeometry args={[3.35, 1.32, 0.04]} />
        <meshStandardMaterial color="#1a1a3a" roughness={0.15} metalness={0.85} />
      </mesh>
      {/* Display stand pillars */}
      {[-1.2, 1.2].map((x, i) => (
        <mesh key={i} position={[x, 0.6, -0.3]}>
          <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
          <meshStandardMaterial color="#303060" roughness={0.25} metalness={0.7} />
        </mesh>
      ))}
      {/* Status LED — small, calm green */}
      <mesh position={[0, 0.44, 0.38]}>
        <boxGeometry args={[2, 0.006, 0.006]} />
        <meshStandardMaterial color="#a3e635" emissive="#a3e635" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

/* ── Server Rack — solid, minimal LED ── */
function ServerRack({ position, color = "#6ee7b7" }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      {/* Rack body */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.5, 1.4, 0.38]} />
        <meshStandardMaterial color="#1a1a3a" roughness={0.25} metalness={0.7} />
      </mesh>
      {/* Front panel lines */}
      {[0.2, 0.5, 0.8, 1.1].map((y, i) => (
        <mesh key={i} position={[0, y, 0.195]}>
          <boxGeometry args={[0.42, 0.015, 0.004]} />
          <meshStandardMaterial color="#303058" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
      {/* LED indicators — static, no pulse */}
      <mesh position={[0.18, 0.9, 0.2]}>
        <boxGeometry args={[0.025, 0.025, 0.004]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.18, 0.7, 0.2]}>
        <boxGeometry args={[0.025, 0.025, 0.004]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

/* ── Ceiling Light Strip — warmer, less intense ── */
function CeilingLight({ position, length = 3, color = "#e0e0ff", width = 0.2 }: {
  position: [number, number, number]; length?: number; color?: string; width?: number;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[length, 0.05, width + 0.12]} />
        <meshStandardMaterial color="#262650" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, -0.025, 0]}>
        <boxGeometry args={[length - 0.08, 0.008, width]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.7} />
      </mesh>
      <rectAreaLight width={length} height={width} intensity={1.5} color={color}
        position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
}

/* ── Meeting Table — solid, no holo pulse ── */
function MeetingTable() {
  const [mx, my, mz] = MEETING_POSITION;
  return (
    <group position={[mx, my, mz]}>
      {/* Table surface — solid, polished */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[1.4, 1.4, 0.06, 48]} />
        <meshPhysicalMaterial color="#252555" roughness={0.08} metalness={0.65}
          clearcoat={0.8} clearcoatRoughness={0.1} />
      </mesh>
      {/* Subtle inlay ring */}
      <mesh position={[0, 0.415, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 0.74, 48]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
      {/* Central pedestal — sturdy */}
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.15, 0.22, 0.38, 16]} />
        <meshStandardMaterial color="#303065" roughness={0.2} metalness={0.75} />
      </mesh>
      {/* Floor ring — static */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 1.75, 48]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
      {/* Chairs */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const cx = Math.cos(angle) * 2;
        const cz = Math.sin(angle) * 2;
        return (
          <group key={i} position={[cx, 0, cz]} rotation={[0, -angle + Math.PI, 0]}>
            <mesh position={[0, 0.28, 0]}>
              <cylinderGeometry args={[0.16, 0.16, 0.04, 12]} />
              <meshStandardMaterial color="#222250" roughness={0.35} metalness={0.5} />
            </mesh>
            <mesh position={[0, 0.46, -0.12]}>
              <boxGeometry args={[0.26, 0.32, 0.03]} />
              <meshStandardMaterial color="#222250" roughness={0.35} metalness={0.5} />
            </mesh>
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.28, 6]} />
              <meshStandardMaterial color="#383870" roughness={0.25} metalness={0.6} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ── Ceiling Beams ── */
function CeilingBeams() {
  return (
    <group>
      {[-4, 0, 4].map(x => (
        <mesh key={`lb-${x}`} position={[x, 3.8, 1]}>
          <boxGeometry args={[0.12, 0.18, 16]} />
          <meshStandardMaterial color="#222248" roughness={0.25} metalness={0.6} />
        </mesh>
      ))}
      {[-4, -1, 2, 5].map(z => (
        <mesh key={`cb-${z}`} position={[0, 3.8, z]}>
          <boxGeometry args={[10, 0.12, 0.12]} />
          <meshStandardMaterial color="#222248" roughness={0.25} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Baseboard / Wainscoting for walls ── */
function Baseboard({ position, length, rotation = [0, 0, 0] }: {
  position: [number, number, number]; length: number; rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[length, 0.08, 0.04]} />
      <meshStandardMaterial color="#2a2a55" roughness={0.3} metalness={0.6} />
    </mesh>
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

      {/* ══ BASEBOARDS ══ */}
      <Baseboard position={[-4, 0.04, -2.5]} length={7} rotation={[0, Math.PI / 2, 0]} />
      <Baseboard position={[4, 0.04, -2.5]} length={7} rotation={[0, Math.PI / 2, 0]} />

      {/* ══ WALL DISPLAYS ══ */}
      <WallDisplay position={[0, 1.6, -2.7]} width={2.8} height={1.1} color="#a78bfa" label="Sistema Central" />
      <WallDisplay position={[-3.9, 1.5, 2.25]} rotation={[0, Math.PI / 2, 0]} width={2} height={0.8} color="#60a5fa" label="Operações" />
      <WallDisplay position={[3.9, 1.5, 2.25]} rotation={[0, -Math.PI / 2, 0]} width={2} height={0.8} color="#60a5fa" label="Pipeline" />
      <WallDisplay position={[6.9, 1.4, 0.5]} rotation={[0, -Math.PI / 2, 0]} width={1.4} height={0.65} color="#6ee7b7" label="Recursos" />
      <WallDisplay position={[-6.9, 1.4, 0.5]} rotation={[0, Math.PI / 2, 0]} width={1.4} height={0.65} color="#6ee7b7" label="Infra" />
      <WallDisplay position={[0, 1.3, -6.1]} width={1.6} height={0.65} color="#fbbf24" label="Briefing" />

      {/* ══ SERVER RACKS ══ */}
      <ServerRack position={[-5.8, 0, 2.5]} color="#6ee7b7" />
      <ServerRack position={[-5.2, 0, 2.5]} color="#6ee7b7" />
      <ServerRack position={[-5.8, 0, 3.5]} color="#34d399" />
      <ServerRack position={[-5.2, 0, 3.5]} color="#34d399" />
      <ServerRack position={[5.2, 0, 3]} color="#6ee7b7" />
      <ServerRack position={[5.8, 0, 3]} color="#6ee7b7" />

      {/* ══ CEILING ══ */}
      <CeilingBeams />
      <CeilingLight position={[0, 3.7, -1]} length={4.5} color="#d4d0f0" width={0.25} />
      <CeilingLight position={[-2, 3.7, 2]} length={3.5} color="#b8cff0" width={0.2} />
      <CeilingLight position={[2, 3.7, 2]} length={3.5} color="#b8cff0" width={0.2} />
      <CeilingLight position={[0, 3.7, 3.5]} length={7} color="#b8cff0" width={0.2} />
      <CeilingLight position={[5.5, 3.7, 1]} length={2.2} color="#a7e8cb" width={0.18} />
      <CeilingLight position={[-5.5, 3.7, 1]} length={2.2} color="#a7e8cb" width={0.18} />
      <CeilingLight position={[0, 3.3, -4.5]} length={3.5} color="#fde68a" width={0.2} />
    </group>
  );
}
