/**
 * Office 3D — Floor, walls, sector labels, and meeting table
 */
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { SECTOR_META, MEETING_POSITION } from "./OfficeLayout";

function SectorLabel({ position, label, color }: { position: [number, number, number]; label: string; color: string }) {
  return (
    <Billboard position={position} follow lockX={false} lockY={false} lockZ={false}>
      <Text fontSize={0.22} color={color} anchorX="center" anchorY="bottom" outlineWidth={0.02} outlineColor="#000000" font={undefined}>
        {label}
      </Text>
    </Billboard>
  );
}

function FloorPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 1]} receiveShadow>
      <planeGeometry args={[16, 14]} />
      <meshStandardMaterial color="#0c0c18" roughness={0.9} metalness={0.1} />
    </mesh>
  );
}

function SectorFloor({ position, size, color }: { position: [number, number, number]; size: [number, number]; color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.001, position[2]]}>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} transparent opacity={0.06} roughness={0.95} />
    </mesh>
  );
}

function MeetingTable() {
  const [mx, my, mz] = MEETING_POSITION;
  return (
    <group position={[mx, my, mz]}>
      {/* Table surface */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[1.2, 1.2, 0.06, 32]} />
        <meshStandardMaterial color="#1a1a3a" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Table leg */}
      <mesh position={[0, 0.175, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.35, 8]} />
        <meshStandardMaterial color="#252545" roughness={0.5} metalness={0.5} />
      </mesh>
      {/* Glow ring */}
      <mesh position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.15, 1.25, 32]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function WallSegment({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);
  const cx = (from[0] + to[0]) / 2;
  const cz = (from[2] + to[2]) / 2;
  
  return (
    <mesh position={[cx, 0.6, cz]} rotation={[0, angle, 0]}>
      <boxGeometry args={[0.04, 1.2, length]} />
      <meshStandardMaterial color="#1a1a30" transparent opacity={0.3} roughness={0.8} />
    </mesh>
  );
}

export function OfficeFloor() {
  return (
    <group>
      <FloorPlane />
      
      {/* Sector floor highlights */}
      <SectorFloor position={[0, 0, -1]} size={[5, 3]} color={SECTOR_META.command.color} />
      <SectorFloor position={[0, 0, 2.25]} size={[9, 4]} color={SECTOR_META.operations.color} />
      <SectorFloor position={[5, 0, 1.25]} size={[2.5, 6.5]} color={SECTOR_META.support.color} />
      <SectorFloor position={[-5, 0, 1.25]} size={[2.5, 6.5]} color={SECTOR_META.support.color} />
      <SectorFloor position={[0, 0, -4.5]} size={[4, 3]} color={SECTOR_META.meeting.color} />
      
      {/* Sector labels */}
      <SectorLabel position={[0, 2.2, -1.8]} label={SECTOR_META.command.label} color={SECTOR_META.command.color} />
      <SectorLabel position={[0, 2.2, 0.5]} label={SECTOR_META.operations.label} color={SECTOR_META.operations.color} />
      <SectorLabel position={[5, 2.2, -2]} label="Suporte" color={SECTOR_META.support.color} />
      <SectorLabel position={[-5, 2.2, -2]} label="Infra" color={SECTOR_META.support.color} />
      <SectorLabel position={[0, 2.2, -5.5]} label={SECTOR_META.meeting.label} color={SECTOR_META.meeting.color} />

      {/* Meeting table */}
      <MeetingTable />
      
      {/* Subtle wall outlines for meeting room */}
      <WallSegment from={[-2, 0, -6]} to={[2, 0, -6]} />
      <WallSegment from={[-2, 0, -6]} to={[-2, 0, -3]} />
      <WallSegment from={[2, 0, -6]} to={[2, 0, -3]} />

      {/* Grid lines on floor */}
      <gridHelper args={[16, 32, "#1a1a2e", "#12122a"]} position={[0, 0.002, 1]} />
    </group>
  );
}
