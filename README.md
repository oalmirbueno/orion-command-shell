# Orion Mission Control

Painel de comando operacional para o ecossistema Orion/OpenClaw.  
Stack: React 18 · Vite 5 · TypeScript · Tailwind CSS · shadcn/ui · React Query · Recharts · Supabase (externo)

**Produção:** `orion.aceleriq.online`  
**Repo:** `oalmirbueno/orion-command-shell`

---

## Configuração — Supabase Externo

O Mission Control suporta autenticação via Supabase configurado manualmente.  
Sem as variáveis, o painel opera em **modo aberto** com banner informativo.

```env
# .env (ou .env.local)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | Para auth | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Para auth | Chave anon/pública do Supabase |
| `VITE_API_BASE_URL` | Produção | URL base da API OpenClaw (default: `/api`) |

**Funcionalidades ativadas com Supabase:**
- Login/cadastro com email + senha
- Reset de senha por email
- Proteção de rotas (redirect para `/login`)
- Indicador de usuário + logout na TopBar
- Persistência de notificações (marcar como lida, dispensar)

**Migration de notificações:** `docs/migrations/001_notifications.sql`

---

## Arquitetura

```
src/
├── domains/          # Camada de dados — fetchers real-first + fallback
├── hooks/            # useOrionData, useOrionStream (SSE), useDomainHealth, useAuth
├── services/         # notificationStore, domainAnalytics (persistência + métricas)
├── components/
│   ├── auth/         # ProtectedRoute (com fallback modo aberto)
│   ├── filters/      # AdvancedFilters (tipo + status + período)
│   ├── orion/        # Primitivas visuais do design system
│   └── ...           # UI por domínio
├── integrations/
│   └── supabase/     # Cliente Supabase com detecção de configuração
├── pages/            # Rotas do painel
├── test/             # Testes automatizados (Vitest — 19 testes)
└── lib/              # Utilitários
```

**Padrão de dados:** `createRealFirstFetcher` — tenta API real primeiro, fallback honesto em caso de falha.  
**Estado global:** React Query + SSE stream (`useOrionStream`) + `DomainHealthStore` + `DomainAnalyticsStore`.  
**Auth:** `AuthProvider` com detecção honesta — modo aberto quando não configurado.  
**Resiliência:** Error boundaries por módulo — falha isolada não derruba o painel.

---

## Módulos — Status Real

### ✅ Concluídos (V1.2)

| Módulo | Rota | Domínio | Descrição |
|--------|------|---------|-----------|
| **Comando (Home)** | `/` | `home` | Dashboard executivo — métricas, atenção, operações, agentes, saúde, briefing com tendências, weather, skills, builders, **gargalos** |
| **Agentes** | `/agents` | `agents` | Lista + Centro de Controle Operacional. Restart e toggle de estado |
| **Sessões** | `/sessions` | `sessions` | Sessões ativas com status derivado, tokens, progresso |
| **Operações** | `/operations` | `operations` | Kanban + timeline + seções por status |
| **Atividade** | `/activity` | `activity` | Feed + resumo + **filtros avançados** |
| **Memória** | `/memory` | `memory` | Snapshots de memória + busca |
| **Alertas** | `/alerts` | `alerts` | Lista com severidade + resumo + **filtros avançados** |
| **Cron** | `/cron` | `cron` | Jobs cron com status de saúde |
| **Sistema** | `/system` | `system` | Infra health — CPU/RAM/disco, uptime, serviços, cron health |
| **Arquivos** | `/files` | `files` | Navegador de arquivos |
| **Skills** | `/skills` | — | Catálogo de skills com detalhes expandidos |
| **Builders** | `/builders` | — | Central de execução — OpenClaw / Claude Code / AIOX |
| **Missões** | `/missions` | — | Dashboard de workflows com "Run Now" |
| **Timeline** | `/timeline` | `timeline` | Linha do tempo unificada + **filtros avançados** |
| **Lembretes** | `/reminders` | `reminders` | Lembretes + notícias + **filtros avançados** |
| **Pipelines** | `/pipelines` | `pipelines` | Fluxos derivados de cron + operations, detalhe + "Executar Agora" |
| **Configurações** | `/settings` | — | Status global, domínios, diagnóstico SSE com **histórico de reconexões** |
| **Busca** | `/search` | — | Busca global |
| **Notificações** | TopBar | — | Centro com **read/dismiss persistente**, deep-links, indicador de modo |
| **Login** | `/login` | — | Email + senha, cadastro, reset |
| **Office 3D** | `/office3d` | — | Visualização 3D com tooltip de hover e click-to-detail |

---

## Infraestrutura Transversal

| Componente | Status | Descrição |
|------------|--------|-----------|
| `AuthProvider` + `ProtectedRoute` | ✅ | Auth com modo aberto quando sem Supabase |
| `ErrorBoundary` | ✅ | Catch isolado por módulo — falha não propaga |
| `AdvancedFilters` | ✅ | Filtros reutilizáveis em **4 módulos** (Timeline, Alerts, Activity, Reminders) |
| `NotificationStore` | ✅ | Persistência híbrida (Supabase + memória) — read/dismiss |
| `DomainAnalyticsStore` | ✅ | Métricas de latência/erro por domínio — sparklines e tendências |
| `OrionLayout` | ✅ | Sidebar + TopBar (com user/logout) + StatusBar |
| `OrionDataWrapper` | ✅ | Loading/error/empty states padronizados |
| `DomainHealthStore` | ✅ | Saúde por domínio (live/stale/loading/offline) |
| `useOrionStream` (SSE) | ✅ | Stream real-time para cache React Query |
| `sseDiagnostics` | ✅ | Diagnóstico SSE — status, uptime, **reconnect history**, **last error** |
| `createRealFirstFetcher` | ✅ | Padrão real-first + fallback |
| Testes automatizados | ✅ | Vitest — **19 testes** (auth, client, filtros, notificações, SSE, error boundary) |

---

## Domínios de Builders

| Domínio | Descrição | Fonte |
|---------|-----------|-------|
| **OpenClaw** | Orquestração — agentes do ecossistema | `/api/agents` |
| **Claude Code** | Ambientes Anthropic — sessões de desenvolvimento | `/api/sessions` |
| **AIOX** | Squads do filesystem — automações operacionais | `/api/builders/aiox-squads` |

---

## Fontes de Dados Reais

| Endpoint | Consumido por |
|----------|---------------|
| `/api/agents` | Agents, Builders (OpenClaw), Home |
| `/api/sessions` | Sessions, Builders (Claude Code), Timeline |
| `/api/cron` | Cron, Missions, Pipelines, Timeline, Reminders |
| `/api/cron/run` | Pipelines (execução manual), Missions |
| `/api/cron/runs/:id` | Pipelines (histórico de execuções) |
| `/api/alerts` | Alerts, Timeline, Reminders, Notificações |
| `/api/operations` | Operations, Pipelines, Timeline, Reminders |
| `/api/activity` | Activity, Reminders |
| `/api/system/stats` | System, Home, Settings (ping) |
| `/api/memory` | Memory |
| `/api/files` | Files |
| `/api/builders/aiox-squads` | Builders (AIOX) |
| `/api/home` | Home (agregado) |
| `/api/stream` | SSE real-time (todos os domínios) |

---

## Changelog

### V1.2 — Robustez + Inteligência Operacional (Abril 2026)

**Bloco A — Robustez Técnica:**
- ✅ Persistência de notificações — `NotificationStore` híbrido (Supabase quando configurado, memória como fallback). Marcar como lida, dispensar, contagem de não-lidas. Migration SQL pronta.
- ✅ React Router future flags — `v7_startTransition` e `v7_relativeSplatPath` ativadas. 0 warnings no build.
- ✅ Error boundaries por módulo — todas as 19 rotas protegidas com catch isolado. Falha em um domínio não derruba outros.
- ✅ SSE reconnect observability — uptime, último erro, histórico de reconexões e buffer de eventos no Settings.
- ✅ Cobertura de testes ampliada — de 4 para **19 testes** (NotificationStore, SSE Diagnostics, ErrorBoundary, Auth, Filtros).

**Bloco B — Inteligência Operacional:**
- ✅ Analytics de gargalos — `DomainAnalyticsStore` acumula latência e erros por domínio em cada fetch. Widget no dashboard com sparklines de tendência.
- ✅ Filtros avançados expandidos — Atividade (tipo + prioridade + período) e Lembretes (status + origem + período). Total: 4 módulos com filtros.
- ✅ Briefing executivo enriquecido — faixa de resumo com domínios live, latência global e indicadores de tendência (↑↓→).

**Fix crítico:**
- ✅ Corrigido loop infinito no Dashboard causado por `useSyncExternalStore` + `getSnapshot` sem memoização no `NotificationStore`.

### V1.1 — Robustez (Abril 2026)

- ✅ Autenticação email + senha (Supabase externo, modo aberto honesto)
- ✅ Proteção de rotas com redirect para `/login`
- ✅ Indicador de usuário + logout na TopBar
- ✅ Filtros avançados multi-critério na Timeline e Alertas
- ✅ Componente `AdvancedFilters` reutilizável com date picker
- ✅ Base de testes automatizados (Vitest — 4 testes)

### V1.0 — Command Center (Março–Abril 2026)

- 19 módulos operacionais completos
- Dashboard clicável com deep-links
- SSE real-time + React Query
- Design system Orion com tokens semânticos
- Pipelines derivados de cron + operations
- Office 3D com hover tooltip + click-to-detail
- Notificações funcionais derivadas do cache
- Settings com diagnóstico SSE em tempo real

---

## Próximos Passos — V1.3

- [ ] Página `/reset-password` funcional para completar fluxo de auth
- [ ] Persistência real de notificações via tabela Supabase (executar migration)
- [ ] Cobertura de testes expandida — componentes visuais, hooks, fetchers
- [ ] PWA / suporte offline básico
- [ ] i18n formal (UI em PT-BR mas sem framework dedicado)
- [ ] Filtros avançados em Sessions e Operations

---

*Última revisão: abril 2026 — V1.2*
