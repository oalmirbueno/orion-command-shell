/**
 * Orion Office 3D — Main Scene (rewritten for office layout)
 * Uses real agent data with desk-based layout, sectors, and meeting room.
 */

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchAgents } from "@/domains/agents/fetcher";
import type { AgentView } from "@/domains/agents/types";
import { AlertTriangle, Loader2, WifiOff } from "lucide-react";
import { OfficeFloor } from "./OfficeFloor";
import { AgentDesk } from "./AgentDesk";
import { ConnectionLine } from "./OfficeConnections";
import { assignDesks, TIER_COLORS } from "./OfficeLayout";
import { getMeetingPositions } from "./MeetingRoom";

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
            <p className="text-xs font-mono text-muted-foreground/40">Carregando escritório…</p>
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
  const meetingPositions = useMemo(
    () => getMeetingPositions(meetingIds.size),
    [meetingIds.size]
  );

  // Connection pairs: orchestrator → all others
  const connectionPairs = useMemo(() => {
    const pairs: { from: [number, number, number]; to: [number, number, number]; color: string }[] = [];
    const orchs = agentList.filter(a => a.tier === "orchestrator");
    const others = agentList.filter(a => a.tier !== "orchestrator");
    orchs.forEach(orch => {
      const orchDesk = deskMap.get(orch.id);
      if (!orchDesk) return;
      others.forEach(other => {
        const otherDesk = deskMap.get(other.id);
        if (!otherDesk) return;
        pairs.push({
          from: orchDesk.position,
          to: otherDesk.position,
          color: TIER_COLORS[orch.tier],
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
      camera={{ position: [0, 10, 10], fov: 45 }}
      style={{ background: "transparent" }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#08081a"]} />
      <fog attach="fog" args={["#08081a", 14, 30]} />

      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 10, 5]} intensity={0.35} castShadow shadow-mapSize={1024} />
      <pointLight position={[0, 6, 0]} intensity={0.15} color="#a78bfa" />
      <pointLight position={[0, 3, -4.5]} intensity={0.15} color="#fbbf24" />

      <OfficeFloor />

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

      {connectionPairs.map((cp, i) => (
        <ConnectionLine key={i} from={cp.from} to={cp.to} color={cp.color} opacity={0.07} />
      ))}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.2}
        autoRotate
        autoRotateSpeed={0.15}
        target={[0, 0, 1]}
      />
    </Canvas>
  );
}
