/**
 * Orion Office 3D — Core Scene (dados reais)
 *
 * Consome agentes via useOrionData e renderiza nós 3D com status operacional.
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Float, Text, Billboard } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchAgents } from "@/domains/agents/fetcher";
import type { AgentView, AgentTier } from "@/domains/agents/types";
import { AlertTriangle, Loader2, WifiOff } from "lucide-react";

/* ── Layout helpers ── */

const TIER_COLORS: Record<AgentTier, string> = {
  orchestrator: "#a78bfa",
  core: "#60a5fa",
  support: "#6ee7b7",
};

function computePositions(agents: AgentView[]): [number, number, number][] {
  // Place orchestrator at top, others in a ring below
  return agents.map((a, i) => {
    if (a.tier === "orchestrator") return [0, 2.5, 0] as [number, number, number];
    const nonOrch = agents.filter(x => x.tier !== "orchestrator");
    const idx = nonOrch.indexOf(a);
    const total = nonOrch.length || 1;
    const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
    const radius = a.tier === "core" ? 2.8 : 3.8;
    const y = a.tier === "core" ? 0.8 : -0.6;
    return [Math.cos(angle) * radius, y, Math.sin(angle) * radius] as [number, number, number];
  });
}

/* ── Agent Node 3D ── */

function AgentNode3D({ position, agent, onClick, onHover }: {
  position: [number, number, number];
  agent: AgentView;
  onClick?: (agent: AgentView) => void;
  onHover?: (agent: AgentView | null, screenPos?: { x: number; y: number }) => void;
}) {
  const color = TIER_COLORS[agent.tier] || TIER_COLORS.support;
  const baseScale = agent.tier === "orchestrator" ? 1.2 : agent.tier === "core" ? 0.9 : 0.7;
  const active = agent.status !== "offline";
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);

  // Animate hover glow
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const targetEmissive = hovered ? 1.2 : (agent.status === "active" ? 0.6 : active ? 0.3 : 0.05);
    mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * Math.min(delta * 8, 1);

    const targetScale = hovered ? baseScale * 1.15 : baseScale;
    const s = meshRef.current.scale.x;
    const newS = s + (targetScale - s) * Math.min(delta * 10, 1);
    meshRef.current.scale.setScalar(newS / baseScale); // normalize since geometry already uses baseScale

    if (ringRef.current) {
      const rMat = ringRef.current.material as THREE.MeshBasicMaterial;
      const targetOp = hovered ? 0.5 : (active ? 0.25 : 0.05);
      rMat.opacity += (targetOp - rMat.opacity) * Math.min(delta * 8, 1);
    }
    if (outerRingRef.current) {
      const oMat = outerRingRef.current.material as THREE.MeshBasicMaterial;
      oMat.opacity += ((hovered ? 0.35 : 0) - oMat.opacity) * Math.min(delta * 8, 1);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group position={position}>
        <mesh
          ref={meshRef}
          castShadow
          onClick={(e) => { e.stopPropagation(); onClick?.(agent); }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
            const { clientX, clientY } = e as unknown as { clientX: number; clientY: number };
            onHover?.(agent, { x: clientX, y: clientY });
          }}
          onPointerMove={(e) => {
            const { clientX, clientY } = e as unknown as { clientX: number; clientY: number };
            onHover?.(agent, { x: clientX, y: clientY });
          }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; onHover?.(null); }}
        >
          <octahedronGeometry args={[baseScale * 0.35, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={active ? color : "#333"}
            emissiveIntensity={agent.status === "active" ? 0.6 : active ? 0.3 : 0.05}
            roughness={0.3}
            metalness={0.6}
            transparent
            opacity={active ? 0.9 : 0.35}
          />
        </mesh>

        {/* Glow ring */}
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseScale * 0.5, baseScale * 0.55, 32]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.25 : 0.05} side={THREE.DoubleSide} />
        </mesh>

        {/* Hover outer glow ring (always rendered, animated via useFrame) */}
        <mesh ref={outerRingRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseScale * 0.6, baseScale * 0.68, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0} side={THREE.DoubleSide} />
        </mesh>

        {/* Name label */}
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <Text
            position={[0, baseScale * 0.65, 0]}
            fontSize={0.18}
            color="white"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {agent.name}
          </Text>
        </Billboard>

        {/* Status/task subtitle */}
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <Text
            position={[0, baseScale * 0.65 - 0.22, 0]}
            fontSize={0.1}
            color={agent.status === "active" ? "#a3e635" : agent.status === "idle" ? "#fbbf24" : "#6b7280"}
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.015}
            outlineColor="#000000"
          >
            {agent.status === "active" ? (agent.currentTask !== "Sem tarefa ativa" ? agent.currentTask.slice(0, 28) : "Ativo") : agent.status === "idle" ? "Idle" : "Offline"}
          </Text>
        </Billboard>

        {active && (
          <pointLight color={color} intensity={agent.status === "active" ? 0.8 : 0.4} distance={3} decay={2} />
        )}
      </group>
    </Float>
  );
}

/* ── Connection lines ── */

function ConnectionLine({ from, to, color = "#ffffff" }: {
  from: [number, number, number];
  to: [number, number, number];
  color?: string;
}) {
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

/* ── Overlay states (HTML, not WebGL) ── */

export function SceneOverlay({ state, error, onRetry }: {
  state: "loading" | "error" | "empty";
  error?: string | null;
  onRetry?: () => void;
}) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        {state === "loading" && (
          <>
            <Loader2 className="h-6 w-6 text-primary/40 animate-spin mx-auto" />
            <p className="text-xs font-mono text-muted-foreground/40">Carregando agentes…</p>
          </>
        )}
        {state === "error" && (
          <>
            <AlertTriangle className="h-6 w-6 text-status-error/60 mx-auto" />
            <p className="text-xs font-mono text-muted-foreground/60">Falha ao carregar dados</p>
            {error && <p className="text-[10px] text-muted-foreground/40 max-w-xs">{error}</p>}
            {onRetry && (
              <button onClick={onRetry} className="text-xs text-primary hover:text-primary/80 transition-colors">
                Tentar novamente
              </button>
            )}
          </>
        )}
        {state === "empty" && (
          <>
            <WifiOff className="h-6 w-6 text-muted-foreground/30 mx-auto" />
            <p className="text-xs font-mono text-muted-foreground/40">Nenhum agente disponível</p>
            <p className="text-[10px] text-muted-foreground/30">Aguardando conexão com API</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main Canvas ── */

export function SceneCanvas({ onAgentClick, onAgentHover }: { onAgentClick?: (agent: AgentView) => void; onAgentHover?: (agent: AgentView | null, screenPos?: { x: number; y: number }) => void }) {
  const { data: agents, state, error, refetch, source } = useOrionData<AgentView[]>({
    key: "agents-page",
    fetcher: fetchAgents,
    refreshInterval: 30_000,
  });

  if (state === "loading" || state === "error" || state === "empty") {
    return <SceneOverlay state={state} error={error} onRetry={refetch} />;
  }

  const agentList = agents || [];
  const positions = computePositions(agentList);

  // Connect orchestrator to all others, plus core↔support adjacencies
  const orchIdx = agentList.findIndex(a => a.tier === "orchestrator");
  const connectionPairs: [number, number][] = [];
  agentList.forEach((_, i) => {
    if (i !== orchIdx && orchIdx >= 0) connectionPairs.push([orchIdx, i]);
  });

  return (
    <Canvas
      shadows
      camera={{ position: [6, 5, 6], fov: 45 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#0a0a0f"]} />
      <fog attach="fog" args={["#0a0a0f", 10, 25]} />

      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 8, 5]} intensity={0.4} castShadow />
      <pointLight position={[0, 4, 0]} intensity={0.3} color="#a78bfa" />

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

      {agentList.map((agent, i) => (
        <AgentNode3D key={agent.id} agent={agent} position={positions[i]} onClick={onAgentClick} onHover={onAgentHover} />
      ))}

      {connectionPairs.map(([fromIdx, toIdx], i) => (
        <ConnectionLine
          key={i}
          from={positions[fromIdx]}
          to={positions[toIdx]}
          color={TIER_COLORS[agentList[fromIdx]?.tier] || "#60a5fa"}
        />
      ))}

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
