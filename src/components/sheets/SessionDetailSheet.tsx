import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Cpu, Clock, Hash, Key, Flame, Pause, CheckCircle2, XCircle, User, Wrench, MessageSquare } from "lucide-react";
import { apiUrl } from "@/domains/api";
import type { SessionView, SessionStatus } from "@/domains/sessions/types";

const statusConfig: Record<SessionStatus, { label: string; dot: string; icon: React.ElementType }> = {
  running: { label: "Em execução", dot: "status-online", icon: Flame },
  paused: { label: "Pausada", dot: "status-warning", icon: Pause },
  completed: { label: "Concluída", dot: "bg-primary/50", icon: CheckCircle2 },
  failed: { label: "Falha", dot: "status-critical", icon: XCircle },
};

interface SessionMessage {
  id: string;
  type: "user" | "assistant" | "tool_use" | string;
  content: string;
  timestamp: string;
  model?: string;
  toolName?: string;
}

interface Props {
  session: SessionView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionDetailSheet({ session, open, onOpenChange }: Props) {
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !session) {
      setMessages([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(apiUrl(`/sessions?id=${session.id}`))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setMessages(data.messages || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [open, session?.id]);

  // Auto-scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!session) return null;
  const cfg = statusConfig[session.status];
  const StatusIcon = cfg.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-foreground text-base">{session.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Status bar */}
          <div className="flex items-center gap-3 text-sm">
            <StatusIcon className="h-4 w-4 text-muted-foreground" />
            <div className={`status-dot ${cfg.dot}`} />
            <span className="font-mono">{cfg.label}</span>
            <span className="text-xs font-mono text-muted-foreground/50 ml-auto">{session.progress}%</span>
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><Bot className="h-3 w-3" /> {session.agent}</div>
            <div className="flex items-center gap-1.5"><Cpu className="h-3 w-3" /> {session.model}</div>
            <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {session.startedAt}</div>
            <div className="flex items-center gap-1.5"><Hash className="h-3 w-3 shrink-0" /> <span className="truncate font-mono">{session.id.slice(0, 8)}</span></div>
          </div>

          {/* Tokens */}
          <div className="rounded-lg border border-border/40 bg-surface-2 p-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-sm font-bold text-foreground">{session.inputTokens.toLocaleString()}</p>
                <p className="text-[10px] font-mono text-muted-foreground/40">Input</p>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{session.outputTokens.toLocaleString()}</p>
                <p className="text-[10px] font-mono text-muted-foreground/40">Output</p>
              </div>
              <div>
                <p className="text-sm font-bold text-primary">{session.totalTokens.toLocaleString()}</p>
                <p className="text-[10px] font-mono text-muted-foreground/40">Total</p>
              </div>
            </div>
          </div>

          {/* Messages section */}
          <div className="rounded-lg border border-border/40 bg-surface-2">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30">
              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/50" />
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">
                Mensagens {!loading && messages.length > 0 && `(${messages.length})`}
              </h4>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-16 w-4/5 ml-auto" />
                <Skeleton className="h-12 w-2/3" />
              </div>
            ) : error ? (
              <div className="p-4 text-center text-xs text-destructive font-mono">{error}</div>
            ) : messages.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground/50">
                Nenhuma mensagem encontrada
              </div>
            ) : (
              <div ref={scrollRef} className="max-h-[400px] overflow-y-auto p-3 space-y-2">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MessageBubble({ message }: { message: SessionMessage }) {
  const time = new Date(message.timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  if (message.type === "tool_use") {
    return (
      <div className="flex justify-center my-1">
        <div className="flex items-center gap-1.5 rounded-md border border-border/30 bg-muted/30 px-3 py-1.5 max-w-[90%]">
          <Wrench className="h-3 w-3 text-muted-foreground/50 shrink-0" />
          <span className="text-[11px] font-mono text-muted-foreground/70 truncate">
            {message.toolName || "tool"}
          </span>
          <span className="text-[10px] text-muted-foreground/30 ml-auto shrink-0">{time}</span>
        </div>
      </div>
    );
  }

  const isUser = message.type === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 ${
          isUser
            ? "bg-primary/15 border border-primary/20"
            : "bg-muted/40 border border-border/30"
        }`}
      >
        <div className="flex items-center gap-1.5 mb-1">
          {isUser ? (
            <User className="h-3 w-3 text-primary/60" />
          ) : (
            <Bot className="h-3 w-3 text-muted-foreground/60" />
          )}
          <span className="text-[10px] font-mono text-muted-foreground/40">
            {isUser ? "user" : message.model || "assistant"}
          </span>
          <span className="text-[10px] text-muted-foreground/30 ml-auto">{time}</span>
        </div>
        <p className="text-xs text-foreground/80 whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </p>
      </div>
    </div>
  );
}
