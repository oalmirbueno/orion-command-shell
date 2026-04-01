/**
 * Office 3D — Main Scene (premium command center)
 * Enhanced lighting, environment, and integration with operations data.
 */

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchAgents } from "@/domains/agents/fetcher";
import type { AgentView } from "@/domains/agents/types";
import * as THREE from "three";
import { AlertTriangle, Loader2, WifiOff } from "lucide-react";
import { OfficeFloor } from "./OfficeFloor";
import { AgentDesk } from "./AgentDesk";
import { FlowConnection } from "./OfficeConnections";
import { assignDesks, TIER_COLORS } from "./OfficeLayout";
import { getMeetingPositions } from "./MeetingRoom";

/* ── Overlay states ── */
export function SceneOverlay({ state, error, onRetry }: {
  state: "loading" | "error" | "empty";
  error?: string | null;
  onRetry?: () => void;
}) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#08081a]">
      <div className="text-center space-y-3">
        {state === "loading" && (
          <>
            <Loader2 className="h-6 w-6 text-primary/40 animate-spin mx-auto" />
            <p className="text-xs font-mono text-muted-foreground/40">Inicializando escritório…</p>
          </>
        )}
        {state === "error" && (
          <>
            <AlertTriangle className="h-6 w-6 text-status-error/60 mx-auto" />
            <p className="text-xs font-mono text-muted-foreground/60">Falha ao carregar dados</p>
            {error && <p className="text-[10px] text-muted-foreground/40 max-w-xs">{error}</p>}
            {onRetry && (
              <button onClick={onRetry} className="text-xs text-primary hover:text-primary/80 transition-colors">Tentar novamente</button>
            )}
          </>
        )}
        {state === "empty" && (
          <>
            <WifiOff className="h-6 w-6 text-muted-foreground/30 mx-auto" />
            <p className="text-xs font-mono text-muted-foreground/40">Nenhum agente disponível</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main Canvas ── */
export function SceneCanvas({
  onAgentClick,
  onAgentHover,
  meetingAgentIds,
}: {
  onAgentClick?: (agent: AgentView) => void;
  onAgentHover?: (agent: AgentView | null, screenPos?: { x: number; y: number }) => void;
  meetingAgentIds?: string[];
}) {
  const { data: agents, state, error, refetch } = useOrionData<AgentView[]>({
    key: "agents-page",
    fetcher: fetchAgents,
    refreshInterval: 30_000,
  });

  const agentList = agents || [];
  const deskMap = useMemo(() => assignDesks(agentList), [agentList]);

  const meetingIds = new Set(meetingAgentIds || []);
  const meetingPositions = useMemo(() => getMeetingPositions(meetingIds.size), [meetingIds.size]);

  // Connection pairs: orchestrator → others
  const connectionPairs = useMemo(() => {
    const pairs: { from: [number, number, number]; to: [number, number, number]; color: string; active: boolean }[] = [];
    const orchs = agentList.filter(a => a.tier === "orchestrator");
    orchs.forEach(orch => {
      const orchDesk = deskMap.get(orch.id);
      if (!orchDesk) return;
      agentList.forEach(other => {
        if (other.tier === "orchestrator") return;
        const otherDesk = deskMap.get(other.id);
        if (!otherDesk) return;
        pairs.push({
          from: orchDesk.position,
          to: otherDesk.position,
          color: TIER_COLORS[orch.tier],
          active: other.status === "active" && other.sessions > 0,
        });
      });
    });
    return pairs;
  }, [agentList, deskMap]);

  if (state === "loading" || state === "error" || state === "empty") {
    return <SceneOverlay state={state} error={error} onRetry={refetch} />;
  }

  let meetingIdx = 0;

  return (
    <Canvas
      shadows
      camera={{ position: [0, 9, 11], fov: 45 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      {/* Background gradient feel */}
      <color attach="background" args={["#0a0a20"]} />
      <fog attach="fog" args={["#0a0a20", 16, 35]} />

      {/* ── Premium Lighting Setup ── */}
      {/* Ambient fill - warmer, brighter */}
      <ambientLight intensity={0.35} color="#b0b0d0" />

      {/* Key light - main directional */}
      <directionalLight
        position={[8, 12, 6]}
        intensity={0.5}
        castShadow
        shadow-mapSize={2048}
        shadow-bias={-0.001}
        color="#c4c4ff"
      />

      {/* Fill light from opposite side */}
      <directionalLight position={[-6, 8, -4]} intensity={0.2} color="#a0a0ff" />

      {/* Command center accent */}
      <pointLight position={[0, 5, -1]} intensity={0.4} color="#a78bfa" distance={10} decay={2} />

      {/* Operations area fill */}
      <pointLight position={[0, 4, 2.5]} intensity={0.3} color="#60a5fa" distance={12} decay={2} />

      {/* Meeting room warm light */}
      <pointLight position={[0, 3, -4.5]} intensity={0.3} color="#fbbf24" distance={6} decay={2} />

      {/* Support area accent lights */}
      <pointLight position={[5.5, 3, 1]} intensity={0.2} color="#6ee7b7" distance={5} decay={2} />
      <pointLight position={[-5.5, 3, 1]} intensity={0.2} color="#6ee7b7" distance={5} decay={2} />

      {/* Rim/back light for depth */}
      <pointLight position={[0, 6, -8]} intensity={0.15} color="#8080ff" distance={15} decay={2} />

      {/* ── Office Environment ── */}
      <OfficeFloor />

      {/* ── Agents ── */}
      {agentList.map(agent => {
        const desk = deskMap.get(agent.id);
        if (!desk) return null;
        const inMeeting = meetingIds.has(agent.id);
        let mPos: [number, number, number] | undefined;
        if (inMeeting) {
          mPos = meetingPositions[meetingIdx];
          meetingIdx++;
        }
        return (
          <AgentDesk
            key={agent.id}
            agent={agent}
            desk={desk}
            inMeeting={inMeeting}
            meetingPos={mPos}
            onClick={onAgentClick}
            onHover={onAgentHover}
          />
        );
      })}

      {/* ── Connection Lines ── */}
      {connectionPairs.map((cp, i) => (
        <FlowConnection key={i} from={cp.from} to={cp.to} color={cp.color} active={cp.active} particleCount={cp.active ? 2 : 0} />
      ))}

      {/* ── Camera Controls ── */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={22}
        maxPolarAngle={Math.PI / 2.15}
        autoRotate
        autoRotateSpeed={0.12}
        target={[0, 0.5, 1]}
      />
    </Canvas>
  );
}
