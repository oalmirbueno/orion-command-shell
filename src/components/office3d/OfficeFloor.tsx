/**
 * Office 3D — Premium Architectural Environment
 * Light, legible, material-rich office with clear sector identity.
 * Mid-tone palette, no dark silhouettes, minimal glow.
 */
import { useMemo } from "react";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { SECTOR_META, MEETING_POSITION } from "./OfficeLayout";

/* ══════════════════════════════════════════════════ */
/* ── PRIMITIVES ── */
/* ══════════════════════════════════════════════════ */

function SectorLabel({ position, label, color }: { position: [number, number, number]; label: string; color: string }) {
  return (
    <Billboard position={position} follow lockX={false} lockY={false} lockZ={false}>
      <Text fontSize={0.15} color={color} anchorX="center" anchorY="bottom"
        outlineWidth={0.02} outlineColor="#2a2a4a" font={undefined} letterSpacing={0.1}>
        {label.toUpperCase()}
      </Text>
    </Billboard>
  );
}

/* ── Procedural tile texture — light architectural tiles ── */
function useTileTexture() {
  return useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Light warm-grey base
    ctx.fillStyle = "#4a4a68";
    ctx.fillRect(0, 0, size, size);

    // 4x4 tiles with subtle variation
    const ts = size / 4;
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        const b = 68 + Math.floor(Math.random() * 12);
        ctx.fillStyle = `rgb(${b - 4}, ${b - 4}, ${b + 8})`;
        ctx.fillRect(x * ts + 1.5, y * ts + 1.5, ts - 3, ts - 3);
      }
    }

    // Grout — slightly darker
    ctx.strokeStyle = "#3a3a58";
    ctx.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(i * ts, 0); ctx.lineTo(i * ts, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * ts); ctx.lineTo(size, i * ts); ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 5);
    return tex;
  }, []);
}

/* ── Floor ── */
function FloorPlane() {
  const tileMap = useTileTexture();
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 1]} receiveShadow>
      <planeGeometry args={[22, 20]} />
      <meshPhysicalMaterial map={tileMap} roughness={0.4} metalness={0.18}
        clearcoat={0.1} clearcoatRoughness={0.5} />
    </mesh>
  );
}

/* ── Sector Floor ── */
function SectorFloor({ position, size, color, elevated = false }: {
  position: [number, number, number]; size: [number, number]; color: string; elevated?: boolean;
}) {
  if (elevated) {
    return (
      <mesh position={[position[0], 0.02, position[2]]} castShadow receiveShadow>
        <boxGeometry args={[size[0], 0.04, size[1]]} />
        <meshStandardMaterial color="#454568" roughness={0.35} metalness={0.3} />
      </mesh>
    );
  }
  // Non-elevated: use a thin box instead of a coplanar plane to avoid z-fighting
  return (
    <mesh position={[position[0], 0.005, position[2]]}>
      <boxGeometry args={[size[0], 0.01, size[1]]} />
      <meshStandardMaterial color={color} transparent opacity={0.12} roughness={0.7} />
    </mesh>
  );
}

/* ── Sector border ── */
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
      <lineBasicMaterial color={color} transparent opacity={0.22} />
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
        <meshPhysicalMaterial color="#a0b0c8" transparent opacity={0.1} roughness={0.03} metalness={0.05}
          clearcoat={1} clearcoatRoughness={0.03} />
      </mesh>
      {[size[1] / 2, -size[1] / 2].map((yOff, i) => (
        <mesh key={i} position={[position[0], position[1] + yOff, position[2]]} rotation={rotation}>
          <boxGeometry args={[size[0] + 0.02, 0.04, size[2] + 0.02]} />
          <meshStandardMaterial color="#6a6a88" roughness={0.2} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Pillar — lighter metal ── */
function Pillar({ position, height = 3, radius = 0.07 }: {
  position: [number, number, number]; height?: number; radius?: number;
}) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, height, 16]} />
        <meshStandardMaterial color="#5a5a78" roughness={0.2} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 2.2, 16]} />
        <meshStandardMaterial color="#606080" roughness={0.3} metalness={0.5} />
      </mesh>
    </group>
  );
}

/* ── Wall Display ── */
function WallDisplay({ position, rotation = [0, 0, 0], width = 1.5, height = 0.8, color = "#a78bfa", label = "" }: {
  position: [number, number, number]; rotation?: [number, number, number]; width?: number; height?: number; color?: string; label?: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <mesh position={[0, 0, -0.025]} castShadow>
        <boxGeometry args={[width + 0.1, height + 0.1, 0.04]} />
        <meshStandardMaterial color="#3a3a58" roughness={0.15} metalness={0.75} />
      </mesh>
      {/* Screen */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15}
          transparent opacity={0.5} roughness={0.1} />
      </mesh>
      {label && (
        <Text position={[0, -(height / 2) - 0.08, 0.01]} fontSize={0.06} color={color}
          anchorX="center" anchorY="top" font={undefined} letterSpacing={0.08} fillOpacity={0.5}>
          {label.toUpperCase()}
        </Text>
      )}
    </group>
  );
}

/* ── Command Console ── */
function CommandConsole() {
  return (
    <group position={[0, 0, -1.8]}>
      {/* Console desk */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.5, 0.07, 0.85]} />
        <meshPhysicalMaterial color="#484870" roughness={0.15} metalness={0.5}
          clearcoat={0.3} clearcoatRoughness={0.25} />
      </mesh>
      {/* Front accent */}
      <mesh position={[0, 0.4, 0.43]}>
        <boxGeometry args={[3.5, 0.07, 0.012]} />
        <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.15} transparent opacity={0.4} />
      </mesh>
      {/* Side panels */}
      {[-1.75, 1.75].map((x, i) => (
        <mesh key={i} position={[x, 0.2, 0]} castShadow>
          <boxGeometry args={[0.07, 0.42, 0.85]} />
          <meshStandardMaterial color="#404065" roughness={0.2} metalness={0.55} />
        </mesh>
      ))}
      {/* Large display */}
      <mesh position={[0, 1.2, -0.3]}>
        <planeGeometry args={[3.2, 1.2]} />
        <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.15}
          transparent opacity={0.4} roughness={0.08} />
      </mesh>
      {/* Display frame */}
      <mesh position={[0, 1.2, -0.33]} castShadow>
        <boxGeometry args={[3.35, 1.32, 0.04]} />
        <meshStandardMaterial color="#3a3a58" roughness={0.12} metalness={0.8} />
      </mesh>
      {/* Stand pillars */}
      {[-1.2, 1.2].map((x, i) => (
        <mesh key={i} position={[x, 0.6, -0.3]}>
          <cylinderGeometry args={[0.03, 0.03, 1.2, 8]} />
          <meshStandardMaterial color="#5a5a78" roughness={0.2} metalness={0.65} />
        </mesh>
      ))}
      {/* Status LED */}
      <mesh position={[0, 0.44, 0.38]}>
        <boxGeometry args={[1.6, 0.005, 0.005]} />
        <meshStandardMaterial color="#a3e635" emissive="#a3e635" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

/* ── Server Rack ── */
function ServerRack({ position, color = "#6ee7b7" }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.5, 1.4, 0.38]} />
        <meshStandardMaterial color="#3a3a58" roughness={0.2} metalness={0.65} />
      </mesh>
      {[0.2, 0.5, 0.8, 1.1].map((y, i) => (
        <mesh key={i} position={[0, y, 0.195]}>
          <boxGeometry args={[0.42, 0.015, 0.004]} />
          <meshStandardMaterial color="#555578" roughness={0.35} metalness={0.45} />
        </mesh>
      ))}
      <mesh position={[0.18, 0.9, 0.2]}>
        <boxGeometry args={[0.02, 0.02, 0.004]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

/* ── Ceiling Light — slim, warm ── */
function CeilingLight({ position, length = 3, color = "#f0f0ff", width = 0.15 }: {
  position: [number, number, number]; length?: number; color?: string; width?: number;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[length, 0.03, width + 0.08]} />
        <meshStandardMaterial color="#505070" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0, -0.018, 0]}>
        <boxGeometry args={[length - 0.06, 0.006, width]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent opacity={0.6} />
      </mesh>
      <rectAreaLight width={length} height={width} intensity={2} color={color}
        position={[0, -0.03, 0]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
}

/* ── Meeting Table ── */
function MeetingTable() {
  const [mx, my, mz] = MEETING_POSITION;
  return (
    <group position={[mx, my, mz]}>
      {/* Table surface */}
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.4, 1.4, 0.06, 48]} />
        <meshPhysicalMaterial color="#505075" roughness={0.06} metalness={0.5}
          clearcoat={0.7} clearcoatRoughness={0.08} />
      </mesh>
      {/* Inlay ring */}
      <mesh position={[0, 0.415, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 0.73, 48]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      {/* Pedestal */}
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.15, 0.22, 0.38, 16]} />
        <meshStandardMaterial color="#555580" roughness={0.2} metalness={0.65} />
      </mesh>
      {/* Chairs */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(angle) * 2, 0, Math.sin(angle) * 2]} rotation={[0, -angle + Math.PI, 0]}>
            <mesh position={[0, 0.28, 0]}>
              <cylinderGeometry args={[0.16, 0.16, 0.04, 12]} />
              <meshStandardMaterial color="#484868" roughness={0.3} metalness={0.45} />
            </mesh>
            <mesh position={[0, 0.46, -0.12]}>
              <boxGeometry args={[0.26, 0.32, 0.03]} />
              <meshStandardMaterial color="#484868" roughness={0.3} metalness={0.45} />
            </mesh>
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.28, 6]} />
              <meshStandardMaterial color="#606088" roughness={0.2} metalness={0.55} />
            </mesh>
          </group>
        );
      })}
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
      <SectorLabel position={[0, 2.5, -2.2]} label={SECTOR_META.command.label} color={SECTOR_META.command.color} />
      <SectorLabel position={[0, 2.5, 0.2]} label={SECTOR_META.operations.label} color={SECTOR_META.operations.color} />
      <SectorLabel position={[5.5, 2.5, -2.3]} label="Suporte" color={SECTOR_META.support.color} />
      <SectorLabel position={[-5.5, 2.5, -2.3]} label="Infra" color={SECTOR_META.support.color} />
      <SectorLabel position={[0, 2.5, -6.2]} label={SECTOR_META.meeting.label} color={SECTOR_META.meeting.color} />

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

      {/* ══ PILLARS — lighter, thinner ══ */}
      <Pillar position={[-4, 0, -2.5]} />
      <Pillar position={[4, 0, -2.5]} />
      <Pillar position={[-4, 0, 4.5]} />
      <Pillar position={[4, 0, 4.5]} />

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

      {/* ══ CEILING LIGHTS (no heavy beams) ══ */}
      <CeilingLight position={[0, 3.5, -1]} length={4.5} color="#e8e0ff" width={0.2} />
      <CeilingLight position={[-2.5, 3.5, 2]} length={4} color="#d8e8ff" width={0.18} />
      <CeilingLight position={[2.5, 3.5, 2]} length={4} color="#d8e8ff" width={0.18} />
      <CeilingLight position={[0, 3.5, 3.5]} length={7} color="#d8e8ff" width={0.18} />
      <CeilingLight position={[5.5, 3.5, 1]} length={2.5} color="#d0f0e0" width={0.15} />
      <CeilingLight position={[-5.5, 3.5, 1]} length={2.5} color="#d0f0e0" width={0.15} />
      <CeilingLight position={[0, 3.2, -4.5]} length={3.5} color="#fff0d0" width={0.18} />
    </group>
  );
}
