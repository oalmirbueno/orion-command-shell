/**
 * Office 3D — Main Scene
 * Premium command center with rich lighting and environment.
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
  state: "loading" | "error" | "empty"; error?: string | null; onRetry?: () => void;
}) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#252545]">
      <div className="text-center space-y-3">
        {state === "loading" && (
          <><Loader2 className="h-6 w-6 text-primary/40 animate-spin mx-auto" />
          <p className="text-xs font-mono text-muted-foreground/40">Inicializando escritório…</p></>
        )}
        {state === "error" && (
          <><AlertTriangle className="h-6 w-6 text-status-error/60 mx-auto" />
          <p className="text-xs font-mono text-muted-foreground/60">Falha ao carregar dados</p>
          {error && <p className="text-[10px] text-muted-foreground/40 max-w-xs">{error}</p>}
          {onRetry && <button onClick={onRetry} className="text-xs text-primary hover:text-primary/80 transition-colors">Tentar novamente</button>}</>
        )}
        {state === "empty" && (
          <><WifiOff className="h-6 w-6 text-muted-foreground/30 mx-auto" />
          <p className="text-xs font-mono text-muted-foreground/40">Nenhum agente disponível</p></>
        )}
      </div>
    </div>
  );
}

/* ── Main Canvas ── */
export function SceneCanvas({
  onAgentClick, onAgentHover, meetingAgentIds, floorFilter, cameraTarget, cameraDistance,
}: {
  onAgentClick?: (agent: AgentView) => void;
  onAgentHover?: (agent: AgentView | null, screenPos?: { x: number; y: number }) => void;
  meetingAgentIds?: string[];
  /** Lista de IDs visíveis. Se omitido, mostra todos. */
  floorFilter?: string[];
  cameraTarget?: [number, number, number];
  cameraDistance?: number;
}) {
  const { data: agents, state, error, refetch } = useOrionData<AgentView[]>({
    key: "agents-page", fetcher: fetchAgents, refreshInterval: 30_000,
  });

  const allAgents = agents || [];
  // Mantém posições de mesa estáveis baseadas em TODOS os agentes,
  // independente do andar selecionado.
  const deskMap = useMemo(() => assignDesks(allAgents), [allAgents]);
  const visibleSet = floorFilter ? new Set(floorFilter) : null;
  const agentList = visibleSet ? allAgents.filter(a => visibleSet.has(a.id)) : allAgents;
  const meetingIds = new Set(meetingAgentIds || []);
  const meetingPositions = useMemo(() => getMeetingPositions(meetingIds.size), [meetingIds.size]);

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
        pairs.push({ from: orchDesk.position, to: otherDesk.position, color: TIER_COLORS[orch.tier],
          active: other.status === "active" && other.sessions > 0 });
      });
    });
    return pairs;
  }, [agentList, deskMap]);

  // Squad connections: agents linked via dependsOn/feeds form squads
  const squadPairs = useMemo(() => {
    const pairs: { from: [number, number, number]; to: [number, number, number]; active: boolean }[] = [];
    const seen = new Set<string>();
    agentList.forEach(agent => {
      const aDesk = deskMap.get(agent.id);
      if (!aDesk) return;
      const linkedIds = [...(agent.dependsOn || []), ...(agent.feeds || [])];
      linkedIds.forEach(otherId => {
        const key = [agent.id, otherId].sort().join("-");
        if (seen.has(key)) return;
        seen.add(key);
        const bDesk = deskMap.get(otherId);
        if (!bDesk) return;
        const otherAgent = agentList.find(a => a.id === otherId);
        const isActive = agent.status === "active" || (otherAgent?.status === "active");
        pairs.push({ from: aDesk.position, to: bDesk.position, active: isActive });
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
      camera={{ position: [0, 8.5, 12], fov: 42 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 2.0 }}
      onCreated={({ gl }) => { gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; }}
    >
      {/* Bright architectural background */}
      <color attach="background" args={["#3a3a5c"]} />
      <fog attach="fog" args={["#3a3a5c", 25, 55]} />

      {/* ════ LIGHTING — bright, premium office ════ */}
      <hemisphereLight args={["#bbbbdd", "#707090", 1.2]} />
      <ambientLight intensity={1.2} color="#e8e8ff" />

      {/* Key light */}
      <directionalLight position={[8, 14, 8]} intensity={1.1} castShadow
        shadow-mapSize={2048} shadow-bias={-0.0003} color="#f5f5ff"
        shadow-camera-left={-12} shadow-camera-right={12}
        shadow-camera-top={12} shadow-camera-bottom={-10}
        shadow-camera-near={1} shadow-camera-far={35} />

      {/* Fill — left */}
      <directionalLight position={[-8, 10, -4]} intensity={0.6} color="#d8d8f0" />

      {/* Top fill */}
      <directionalLight position={[0, 15, 0]} intensity={0.5} color="#e0e0f8" />

      {/* Sector accents */}
      <pointLight position={[0, 3.5, -1.5]} intensity={0.25} color="#a78bfa" distance={8} decay={2} />
      <pointLight position={[-2, 3, 2.5]} intensity={0.2} color="#60a5fa" distance={10} decay={2} />
      <pointLight position={[2, 3, 2.5]} intensity={0.2} color="#60a5fa" distance={10} decay={2} />
      <pointLight position={[0, 2.5, -4.5]} intensity={0.25} color="#fbbf24" distance={5} decay={2} />
      <pointLight position={[5.5, 2.5, 1.5]} intensity={0.15} color="#6ee7b7" distance={4} decay={2} />
      <pointLight position={[-5.5, 2.5, 1.5]} intensity={0.15} color="#6ee7b7" distance={4} decay={2} />

      {/* ════ ENVIRONMENT ════ */}
      <OfficeFloor />

      {/* ════ AGENTS ════ */}
      {agentList.map(agent => {
        const desk = deskMap.get(agent.id);
        if (!desk) return null;
        const inMeeting = meetingIds.has(agent.id);
        let mPos: [number, number, number] | undefined;
        if (inMeeting) { mPos = meetingPositions[meetingIdx]; meetingIdx++; }
        return <AgentDesk key={agent.id} agent={agent} desk={desk} inMeeting={inMeeting}
          meetingPos={mPos} onClick={onAgentClick} onHover={onAgentHover} />;
      })}

      {/* ════ FLOW CONNECTIONS (orchestrator → agents) ════ */}
      {connectionPairs.map((cp, i) => (
        <FlowConnection key={`orch-${i}`} from={cp.from} to={cp.to} color={cp.color}
          active={cp.active} particleCount={cp.active ? 2 : 0} />
      ))}

      {/* ════ SQUAD CONNECTIONS (dependsOn/feeds) ════ */}
      {squadPairs.map((sp, i) => (
        <FlowConnection key={`squad-${i}`} from={sp.from} to={sp.to}
          color="#f59e0b" active={sp.active} particleCount={sp.active ? 3 : 0} />
      ))}

      {/* ════ CAMERA ════ */}
      <OrbitControls enableDamping dampingFactor={0.05}
        minDistance={Math.max(3, (cameraDistance ?? 14) - 8)}
        maxDistance={Math.max((cameraDistance ?? 14) + 8, 24)}
        maxPolarAngle={Math.PI / 2.15} autoRotate autoRotateSpeed={0.1}
        target={cameraTarget ?? [0, 0.5, 0.5]} />
    </Canvas>
  );
}
