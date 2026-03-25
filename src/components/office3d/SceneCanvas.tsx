/**
 * Orion Office 3D — Core Scene
 * 
 * Viewport WebGL integrado ao Mission Control.
 * Renderiza a representação espacial dos agentes e suas conexões.
 */

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, Float, Text, Billboard } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

/* ── Agent Node 3D ── */

interface AgentNode3DProps {
  position: [number, number, number];
  label: string;
  tier: "orchestrator" | "core" | "support";
  active?: boolean;
}

function AgentNode({ position, label, tier, active = true }: AgentNode3DProps) {
  const color = tier === "orchestrator" ? "#a78bfa" : tier === "core" ? "#60a5fa" : "#6ee7b7";
  const scale = tier === "orchestrator" ? 1.2 : tier === "core" ? 0.9 : 0.7;
  const emissive = active ? color : "#333";

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group position={position}>
        {/* Core shape */}
        <mesh castShadow>
          <octahedronGeometry args={[scale * 0.35, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={active ? 0.4 : 0.05}
            roughness={0.3}
            metalness={0.6}
            transparent
            opacity={active ? 0.9 : 0.35}
          />
        </mesh>

        {/* Glow ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[scale * 0.5, scale * 0.55, 32]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.25 : 0.05} side={THREE.DoubleSide} />
        </mesh>

        {/* Label */}
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <Text
            position={[0, scale * 0.6, 0]}
            fontSize={0.18}
            color="white"
            anchorX="center"
            anchorY="bottom"
            font="/fonts/inter-medium.woff"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {label}
          </Text>
        </Billboard>

        {/* Base glow */}
        {active && (
          <pointLight color={color} intensity={0.6} distance={3} decay={2} />
        )}
      </group>
    </Float>
  );
}

/* ── Connection lines ── */

function ConnectionLine({ from, to, color = "#ffffff" }: { from: [number, number, number]; to: [number, number, number]; color?: string }) {
  const points = useMemo(() => {
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 0.3,
      (from[2] + to[2]) / 2,
    ];
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to),
    ]).getPoints(20);
  }, [from, to]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.15} />
    </line>
  );
}

/* ── Scene layout data ── */

const agents: AgentNode3DProps[] = [
  { position: [0, 2.5, 0], label: "Orion", tier: "orchestrator", active: true },
  { position: [-2.5, 0.8, -1], label: "Coder", tier: "core", active: true },
  { position: [0, 0.8, -2], label: "Planner", tier: "core", active: true },
  { position: [2.5, 0.8, -1], label: "Reviewer", tier: "core", active: true },
  { position: [-3, -0.8, 1], label: "Memory", tier: "support", active: true },
  { position: [-1, -0.8, 2], label: "Browser", tier: "support", active: false },
  { position: [1.5, -0.8, 2], label: "Files", tier: "support", active: true },
  { position: [3.2, -0.8, 1], label: "Shell", tier: "support", active: false },
];

const connections: [number, number][] = [
  [0, 1], [0, 2], [0, 3], // Orion → core
  [1, 4], [1, 5], // Coder → Memory, Browser
  [2, 4], // Planner → Memory
  [3, 6], [3, 7], // Reviewer → Files, Shell
  [1, 6], // Coder → Files
];

/* ── Main Canvas ── */

export function SceneCanvas() {
  return (
    <Canvas
      shadows
      camera={{ position: [6, 5, 6], fov: 45 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#0a0a0f"]} />
      <fog attach="fog" args={["#0a0a0f", 10, 25]} />

      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 8, 5]} intensity={0.4} castShadow />
      <pointLight position={[0, 4, 0]} intensity={0.3} color="#a78bfa" />

      {/* Grid */}
      <Grid
        position={[0, -1.5, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.3}
        cellColor="#1a1a2e"
        sectionSize={5}
        sectionThickness={0.6}
        sectionColor="#252540"
        fadeDistance={15}
        infiniteGrid
      />

      {/* Agents */}
      {agents.map((a, i) => (
        <AgentNode key={i} {...a} />
      ))}

      {/* Connections */}
      {connections.map(([fromIdx, toIdx], i) => (
        <ConnectionLine
          key={i}
          from={agents[fromIdx].position}
          to={agents[toIdx].position}
          color={agents[fromIdx].tier === "orchestrator" ? "#a78bfa" : "#60a5fa"}
        />
      ))}

      {/* Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={4}
        maxDistance={16}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </Canvas>
  );
}
