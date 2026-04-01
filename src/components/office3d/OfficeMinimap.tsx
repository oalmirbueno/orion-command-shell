/**
 * Office 3D — 2D Minimap overlay
 * Shows schematic top-down view with agent positions, squad lines, and click-to-focus.
 */
import { useMemo } from "react";
import type { AgentView } from "@/domains/agents/types";
import { SECTOR_META, TIER_COLORS, STATUS_VISUAL, assignDesks } from "./OfficeLayout";
import type { OfficeSector } from "./OfficeLayout";

const MAP_W = 180;
const MAP_H = 140;
const worldToMap = (x: number, z: number): [number, number] => [
  ((x + 7) / 14) * MAP_W,
  ((z + 6.5) / 11.5) * MAP_H,
];

const SECTOR_REGIONS: { sector: OfficeSector; x: number; z: number; label: string }[] = [
  { sector: "command",    x: 0,    z: -1,   label: "CMD" },
  { sector: "operations", x: 0,    z: 2.25, label: "OPS" },
  { sector: "support",    x: 5.5,  z: 1,    label: "SUP" },
  { sector: "meeting",    x: 0,    z: -4.5, label: "MTG" },
];

interface Props {
  agents: AgentView[];
  meetingAgentIds: string[];
  onSectorClick?: (sector: OfficeSector) => void;
  onAgentClick?: (agent: AgentView) => void;
}

export function OfficeMinimap({ agents, meetingAgentIds, onSectorClick, onAgentClick }: Props) {
  const deskMap = useMemo(() => assignDesks(agents), [agents]);
  const meetingSet = new Set(meetingAgentIds);

  // Derive squad lines from dependsOn/feeds
  const squadLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; active: boolean }[] = [];
    const seen = new Set<string>();
    agents.forEach(agent => {
      const aDesk = deskMap.get(agent.id);
      if (!aDesk) return;
      const linkedIds = [...(agent.dependsOn || []), ...(agent.feeds || [])];
      linkedIds.forEach(otherId => {
        const key = [agent.id, otherId].sort().join("-");
        if (seen.has(key)) return;
        seen.add(key);
        const bDesk = deskMap.get(otherId);
        if (!bDesk) return;
        const [x1, y1] = worldToMap(aDesk.position[0], aDesk.position[2]);
        const [x2, y2] = worldToMap(bDesk.position[0], bDesk.position[2]);
        const other = agents.find(a => a.id === otherId);
        const active = agent.status === "active" || (other?.status === "active");
        lines.push({ x1, y1, x2, y2, active });
      });
    });
    return lines;
  }, [agents, deskMap]);

  return (
    <div className="absolute left-3 bottom-3 z-[55] select-none">
      <div className="bg-card/80 backdrop-blur-lg border border-border/40 rounded-lg overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-2.5 py-1 border-b border-border/20 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
          <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest">Mapa</span>
          {squadLines.length > 0 && (
            <span className="text-[7px] font-mono text-amber-400/50 ml-auto">{squadLines.filter(l => l.active).length} squads</span>
          )}
        </div>

        {/* Map area */}
        <div className="relative" style={{ width: MAP_W, height: MAP_H }}>
          <div className="absolute inset-0 bg-[#0a0a1a]" />

          {/* SVG layer for squad lines */}
          <svg className="absolute inset-0 pointer-events-none" width={MAP_W} height={MAP_H}>
            {squadLines.map((l, i) => (
              <line
                key={i}
                x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke="#f59e0b"
                strokeWidth={l.active ? 1.2 : 0.5}
                strokeOpacity={l.active ? 0.6 : 0.15}
                strokeDasharray={l.active ? undefined : "2 2"}
              />
            ))}
          </svg>

          {/* Sector highlights */}
          {[
            { x: 25, y: 32, w: 70, h: 30, color: SECTOR_META.command.color, sector: "command" as OfficeSector },
            { x: 15, y: 68, w: 120, h: 40, color: SECTOR_META.operations.color, sector: "operations" as OfficeSector },
            { x: 140, y: 25, w: 30, h: 80, color: SECTOR_META.support.color, sector: "support" as OfficeSector },
            { x: 10, y: 25, w: 30, h: 80, color: SECTOR_META.support.color, sector: "support" as OfficeSector },
            { x: 45, y: 5, w: 55, h: 28, color: SECTOR_META.meeting.color, sector: "meeting" as OfficeSector },
          ].map((s, i) => (
            <button
              key={i}
              onClick={() => onSectorClick?.(s.sector)}
              className="absolute rounded-sm transition-opacity hover:opacity-100 cursor-pointer"
              style={{
                left: s.x, top: s.y, width: s.w, height: s.h,
                backgroundColor: s.color, opacity: 0.08,
                border: `1px solid ${s.color}33`,
              }}
              title={SECTOR_META[s.sector].label}
            />
          ))}

          {/* Sector labels */}
          {SECTOR_REGIONS.map(sr => {
            const [mx, my] = worldToMap(sr.x, sr.z);
            return (
              <span key={sr.sector} className="absolute text-[7px] font-mono pointer-events-none"
                style={{ left: mx, top: my, transform: "translate(-50%, -50%)", color: SECTOR_META[sr.sector].color, opacity: 0.5 }}>
                {sr.label}
              </span>
            );
          })}

          {/* Agent dots — clickable */}
          {agents.map(agent => {
            const desk = deskMap.get(agent.id);
            if (!desk) return null;
            const [mx, my] = worldToMap(desk.position[0], desk.position[2]);
            const sv = STATUS_VISUAL[agent.status];
            const inMeeting = meetingSet.has(agent.id);
            const hasSquad = (agent.dependsOn?.length || 0) + (agent.feeds?.length || 0) > 0;

            return (
              <button
                key={agent.id}
                onClick={() => onAgentClick?.(agent)}
                className="absolute cursor-pointer group"
                style={{ left: mx - 5, top: my - 5, width: 10, height: 10 }}
                title={`${agent.name} — ${sv.label}\nClique para focar`}
              >
                {/* Squad ring */}
                {hasSquad && agent.status === "active" && (
                  <div className="absolute inset-[-2px] rounded-full border border-amber-400/40 animate-pulse" />
                )}
                <div
                  className="absolute inset-[2px] rounded-full transition-transform group-hover:scale-150"
                  style={{
                    backgroundColor: inMeeting ? SECTOR_META.meeting.color : sv.color,
                    boxShadow: agent.status === "active" ? `0 0 4px ${sv.color}` : undefined,
                  }}
                />
              </button>
            );
          })}

          {/* Meeting table dot */}
          <div
            className="absolute w-2 h-2 rounded-full border"
            style={{
              left: worldToMap(0, -4.5)[0] - 4,
              top: worldToMap(0, -4.5)[1] - 4,
              borderColor: SECTOR_META.meeting.color + "40",
              backgroundColor: meetingAgentIds.length > 0 ? SECTOR_META.meeting.color + "30" : "transparent",
            }}
          />
        </div>

        {/* Legend */}
        <div className="px-2.5 py-1.5 border-t border-border/20 flex gap-3">
          {(["active", "idle", "offline"] as const).map(s => (
            <div key={s} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_VISUAL[s].color }} />
              <span className="text-[7px] font-mono text-muted-foreground/40">{STATUS_VISUAL[s].label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-amber-400/50 rounded" />
            <span className="text-[7px] font-mono text-muted-foreground/40">Squad</span>
          </div>
        </div>
      </div>
    </div>
  );
}
