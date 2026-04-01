/**
 * Office 3D — 2D Minimap overlay
 * Shows a schematic top-down view of the office with agent positions.
 * Click sectors to navigate camera.
 */
import { useMemo } from "react";
import type { AgentView } from "@/domains/agents/types";
import { SECTOR_META, TIER_COLORS, STATUS_VISUAL, assignDesks } from "./OfficeLayout";
import type { OfficeSector } from "./OfficeLayout";

// Minimap coordinate mapping: 3D world → minimap pixels
// World X: -7 to 7  → minimap 0 to 180
// World Z: -6.5 to 5 → minimap 0 to 140
const MAP_W = 180;
const MAP_H = 140;
const worldToMap = (x: number, z: number): [number, number] => [
  ((x + 7) / 14) * MAP_W,
  ((z + 6.5) / 11.5) * MAP_H,
];

// Sector regions for clickable areas (approximate)
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
}

export function OfficeMinimap({ agents, meetingAgentIds, onSectorClick }: Props) {
  const deskMap = useMemo(() => assignDesks(agents), [agents]);
  const meetingSet = new Set(meetingAgentIds);

  return (
    <div className="absolute left-3 bottom-3 z-[55] select-none">
      <div className="bg-card/80 backdrop-blur-lg border border-border/40 rounded-lg overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-2.5 py-1 border-b border-border/20 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
          <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest">Mapa</span>
        </div>

        {/* Map area */}
        <div className="relative" style={{ width: MAP_W, height: MAP_H }}>
          {/* Background */}
          <div className="absolute inset-0 bg-[#0a0a1a]" />

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
              className="absolute rounded-sm transition-opacity hover:opacity-100 opacity-60 cursor-pointer"
              style={{
                left: s.x,
                top: s.y,
                width: s.w,
                height: s.h,
                backgroundColor: s.color,
                opacity: 0.08,
                border: `1px solid ${s.color}33`,
              }}
              title={SECTOR_META[s.sector].label}
            />
          ))}

          {/* Sector labels */}
          {SECTOR_REGIONS.map(sr => {
            const [mx, my] = worldToMap(sr.x, sr.z);
            return (
              <span
                key={sr.sector}
                className="absolute text-[7px] font-mono pointer-events-none"
                style={{
                  left: mx,
                  top: my,
                  transform: "translate(-50%, -50%)",
                  color: SECTOR_META[sr.sector].color,
                  opacity: 0.5,
                }}
              >
                {sr.label}
              </span>
            );
          })}

          {/* Agent dots */}
          {agents.map(agent => {
            const desk = deskMap.get(agent.id);
            if (!desk) return null;
            const [mx, my] = worldToMap(desk.position[0], desk.position[2]);
            const sv = STATUS_VISUAL[agent.status];
            const inMeeting = meetingSet.has(agent.id);

            return (
              <div
                key={agent.id}
                className="absolute"
                style={{
                  left: mx - 3,
                  top: my - 3,
                  width: 6,
                  height: 6,
                }}
                title={`${agent.name} — ${sv.label}`}
              >
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    backgroundColor: inMeeting ? SECTOR_META.meeting.color : sv.color,
                    boxShadow: agent.status === "active" ? `0 0 4px ${sv.color}` : undefined,
                  }}
                />
              </div>
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
        </div>
      </div>
    </div>
  );
}
