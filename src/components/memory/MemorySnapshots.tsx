import {
  Brain, User, Target, Settings, Shield, GitBranch,
  ChevronRight, Clock, Tag, Layers,
} from "lucide-react";

type MemoryCategory = "context" | "decision" | "learning" | "profile" | "config" | "incident";

interface MemorySnapshot {
  id: string;
  title: string;
  category: MemoryCategory;
  summary: string;
  context: string;
  capturedAt: string;
  capturedAgo: string;
  source: string;
  tags: string[];
  relevance: "high" | "medium" | "low";
}

const MOCK_SNAPSHOTS: MemorySnapshot[] = [
  {
    id: "m-01", title: "Perfil operacional do cliente Acme Corp",
    category: "profile", capturedAt: "09:42", capturedAgo: "5min ago", source: "Classifier-01",
    summary: "Cliente enterprise, 340 funcionários, setor tech B2B. Ciclo de compra longo (90d avg). Decision makers: CTO e VP Engineering. Último contato: proposta de expansão de licenças.",
    context: "Capturado durante classificação do batch #4821. Consolidação de 14 interações anteriores.",
    tags: ["enterprise", "b2b", "expansion"], relevance: "high",
  },
  {
    id: "m-02", title: "Padrão de falha recorrente no Data Pipeline",
    category: "incident", capturedAt: "09:38", capturedAgo: "9min ago", source: "Health Monitor",
    summary: "Latência P95 ultrapassa 150ms quando volume de ingestão excede 50k eventos/min. Ocorrência: 3x nos últimos 7 dias. Causa raiz provável: buffer de memória do worker saturado.",
    context: "Correlação identificada automaticamente entre picos de volume e degradação de performance.",
    tags: ["pipeline", "latency", "recurring"], relevance: "high",
  },
  {
    id: "m-03", title: "Decisão: modelo GPT-4o para classificação de leads",
    category: "decision", capturedAt: "09:15", capturedAgo: "32min ago", source: "Mission Control",
    summary: "Após testes A/B com GPT-4o-mini, decidido manter GPT-4o para classificação por accuracy superior (97.3% vs 91.2%). Custo 3x maior compensado por redução de retrabalho manual.",
    context: "Decisão tomada pelo operador após análise de 3 batches comparativos.",
    tags: ["model-selection", "accuracy", "cost"], relevance: "medium",
  },
  {
    id: "m-04", title: "Contexto de negociação — Deal #7234",
    category: "context", capturedAt: "08:55", capturedAgo: "52min ago", source: "Summarizer-01",
    summary: "Prospect solicitou desconto de 20% para contrato anual. Histórico mostra que deals similares fecharam com 12-15% de desconto. Competitor ativo: Salesforce. Deadline do prospect: fim do trimestre.",
    context: "Extraído de thread de email com 8 mensagens. Sumarização automática.",
    tags: ["deal", "negotiation", "discount"], relevance: "high",
  },
  {
    id: "m-05", title: "Aprendizado: retry policy ideal para APIs externas",
    category: "learning", capturedAt: "08:30", capturedAgo: "1h17 ago", source: "Enricher-01",
    summary: "Clearbit responde melhor com exponential backoff iniciando em 2s (vs 1s anterior). Rate limit de 100 req/min. LinkedIn API mais estável com batch de 10 requests vs individual. Economia de 40% em tokens.",
    context: "Aprendizado consolidado após 14 dias de operação contínua com ajustes incrementais.",
    tags: ["api", "retry", "optimization"], relevance: "medium",
  },
  {
    id: "m-06", title: "Configuração validada: thresholds de alerta",
    category: "config", capturedAt: "08:00", capturedAgo: "1h47 ago", source: "Monitor-01",
    summary: "Thresholds atuais: CPU > 80% (warning), > 95% (critical). RAM > 75% (warning), > 90% (critical). Latência P95 > 100ms (warning), > 200ms (critical). Validados contra últimos 30 dias de operação.",
    context: "Snapshot de configuração após health check matinal. Sem ajustes necessários.",
    tags: ["thresholds", "alerts", "config"], relevance: "low",
  },
  {
    id: "m-07", title: "Perfil comportamental — Segmento SMB",
    category: "profile", capturedAt: "07:30", capturedAgo: "2h17 ago", source: "Analyzer-01",
    summary: "Leads SMB convertem 2.3x mais rápido que enterprise mas com ticket médio 5x menor. Canal preferido: email (62%), seguido de chat (24%). Melhor horário de contato: 10-11h e 14-15h.",
    context: "Análise de padrões sobre 2.4k leads processados no último trimestre.",
    tags: ["smb", "conversion", "patterns"], relevance: "medium",
  },
  {
    id: "m-08", title: "Incidente resolvido: deploy v2.14.2 rollback",
    category: "incident", capturedAt: "07:00", capturedAgo: "2h47 ago", source: "Core Engine",
    summary: "Deploy v2.14.2 causou regressão no endpoint /api/classify. Rollback automático acionado em 2min. Root cause: dependência incompatível com Node 20.x. Fix aplicado no v2.14.3.",
    context: "Post-mortem automático gerado. Tempo de impacto: 4min. Zero perda de dados.",
    tags: ["deploy", "rollback", "postmortem"], relevance: "medium",
  },
];

const categoryConfig: Record<MemoryCategory, { icon: React.ElementType; label: string; color: string }> = {
  context: { icon: Brain, label: "Contexto", color: "bg-primary/10 text-primary border-primary/20" },
  decision: { icon: Target, label: "Decisão", color: "bg-status-warning/10 text-status-warning border-status-warning/20" },
  learning: { icon: Layers, label: "Aprendizado", color: "bg-status-online/10 text-status-online border-status-online/20" },
  profile: { icon: User, label: "Perfil", color: "bg-primary/10 text-primary border-primary/20" },
  config: { icon: Settings, label: "Configuração", color: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20" },
  incident: { icon: Shield, label: "Incidente", color: "bg-status-critical/10 text-status-critical border-status-critical/20" },
};

const relevanceConfig = {
  high: { border: "border-l-primary", label: "Alta relevância" },
  medium: { border: "border-l-muted-foreground/30", label: "Média" },
  low: { border: "border-l-border", label: "Baixa" },
};

function SnapshotCard({ snapshot }: { snapshot: MemorySnapshot }) {
  const cat = categoryConfig[snapshot.category];
  const rel = relevanceConfig[snapshot.relevance];
  const CatIcon = cat.icon;

  return (
    <div className={`rounded-xl border border-border/40 bg-card border-l-[3px] ${rel.border} hover:bg-accent/20 transition-colors cursor-pointer group`}>
      <div className="px-6 py-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <CatIcon className="h-5 w-5 text-muted-foreground/50 shrink-0" />
            <h3 className="text-base font-semibold text-foreground leading-snug">{snapshot.title}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <span className={`text-xs font-mono uppercase px-2 py-1 rounded border ${cat.color}`}>
              {cat.label}
            </span>
            <ChevronRight className="h-5 w-5 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors" />
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-foreground/65 leading-relaxed mb-4 ml-8">
          {snapshot.summary}
        </p>

        {/* Context note */}
        <div className="ml-8 px-4 py-3 rounded-lg bg-surface-2 border border-border/30 mb-4">
          <p className="text-xs text-muted-foreground/50 leading-relaxed italic">
            {snapshot.context}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between ml-8">
          <div className="flex items-center gap-2 flex-wrap">
            {snapshot.tags.map((tag) => (
              <span key={tag} className="text-xs font-mono px-2 py-1 rounded bg-surface-3 text-muted-foreground/50 border border-border/20">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground/40 shrink-0">
            <span>{snapshot.source}</span>
            <div className="h-4 w-px bg-border/30" />
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{snapshot.capturedAt}</span>
            </div>
            <span className="text-muted-foreground/25">{snapshot.capturedAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MemorySnapshots() {
  const categories = Array.from(new Set(MOCK_SNAPSHOTS.map(s => s.category)));

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Banco de Memória
        </h2>
        <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-xs font-mono text-primary font-medium">{MOCK_SNAPSHOTS.length} snapshots</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />

        <div className="flex items-center gap-2">
          {categories.map((cat) => {
            const cfg = categoryConfig[cat];
            return (
              <span key={cat} className={`text-xs font-mono uppercase px-3 py-1.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${cfg.color}`}>
                {cfg.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {MOCK_SNAPSHOTS.map((snapshot) => (
          <SnapshotCard key={snapshot.id} snapshot={snapshot} />
        ))}
      </div>
    </section>
  );
}
