/**
 * AdvancedFilters — Filtros multi-critério reutilizáveis.
 * Suporta tipo, status e período (date range).
 */
import { useState } from "react";
import { Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface FilterOption {
  key: string;
  label: string;
}

export interface FilterState {
  type: string;
  status: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

interface Props {
  types: FilterOption[];
  statuses: FilterOption[];
  value: FilterState;
  onChange: (f: FilterState) => void;
  resultCount: number;
}

function ChipGroup({ options, selected, onSelect }: { options: FilterOption[]; selected: string; onSelect: (k: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onSelect(o.key)}
          className={cn(
            "text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md border transition-colors",
            selected === o.key
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-transparent text-muted-foreground/50 border-border/30 hover:border-border/60 hover:text-muted-foreground/70"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function AdvancedFilters({ types, statuses, value, onChange, resultCount }: Props) {
  const [dateOpen, setDateOpen] = useState<"from" | "to" | null>(null);

  const hasDateFilter = value.dateFrom || value.dateTo;
  const hasAnyFilter = value.type !== "all" || value.status !== "all" || hasDateFilter;

  const clearAll = () => onChange({ type: "all", status: "all", dateFrom: undefined, dateTo: undefined });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Filter className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />

        {/* Type chips */}
        <ChipGroup options={types} selected={value.type} onSelect={(k) => onChange({ ...value, type: k })} />

        <div className="w-px h-5 bg-border/20 mx-1" />

        {/* Status chips */}
        <ChipGroup options={statuses} selected={value.status} onSelect={(k) => onChange({ ...value, status: k })} />

        <div className="flex-1" />

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <Popover open={dateOpen === "from"} onOpenChange={(o) => setDateOpen(o ? "from" : null)}>
            <PopoverTrigger asChild>
              <button className={cn(
                "text-[10px] font-mono px-2 py-1 rounded border transition-colors flex items-center gap-1",
                value.dateFrom
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-transparent text-muted-foreground/40 border-border/30 hover:border-border/50"
              )}>
                <CalendarIcon className="h-3 w-3" />
                {value.dateFrom ? format(value.dateFrom, "dd/MM", { locale: ptBR }) : "De"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={value.dateFrom}
                onSelect={(d) => { onChange({ ...value, dateFrom: d }); setDateOpen(null); }}
                disabled={(d) => (value.dateTo ? d > value.dateTo : false) || d > new Date()}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground/30 text-[10px]">—</span>

          <Popover open={dateOpen === "to"} onOpenChange={(o) => setDateOpen(o ? "to" : null)}>
            <PopoverTrigger asChild>
              <button className={cn(
                "text-[10px] font-mono px-2 py-1 rounded border transition-colors flex items-center gap-1",
                value.dateTo
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-transparent text-muted-foreground/40 border-border/30 hover:border-border/50"
              )}>
                <CalendarIcon className="h-3 w-3" />
                {value.dateTo ? format(value.dateTo, "dd/MM", { locale: ptBR }) : "Até"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={value.dateTo}
                onSelect={(d) => { onChange({ ...value, dateTo: d }); setDateOpen(null); }}
                disabled={(d) => (value.dateFrom ? d < value.dateFrom : false) || d > new Date()}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Clear + count */}
        {hasAnyFilter && (
          <button onClick={clearAll} className="text-[10px] font-mono text-muted-foreground/40 hover:text-foreground transition-colors flex items-center gap-1">
            <X className="h-3 w-3" /> Limpar
          </button>
        )}

        <span className="text-[10px] font-mono text-muted-foreground/30">
          {resultCount} resultado{resultCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
