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

---

## Arquitetura

```
src/
├── domains/          # Camada de dados — fetchers real-first + fallback
├── hooks/            # useOrionData, useOrionStream (SSE), useDomainHealth, useAuth
├── components/
│   ├── auth/         # ProtectedRoute (com fallback modo aberto)
│   ├── filters/      # AdvancedFilters (tipo + status + período)
│   ├── orion/        # Primitivas visuais do design system
│   └── ...           # UI por domínio
├── integrations/
│   └── supabase/     # Cliente Supabase com detecção de configuração
├── pages/            # Rotas do painel
├── test/             # Testes automatizados (Vitest)
└── lib/              # Utilitários
```

**Padrão de dados:** `createRealFirstFetcher` — tenta API real primeiro, fallback honesto em caso de falha.  
**Estado global:** React Query + SSE stream (`useOrionStream`) + `DomainHealthStore`.  
**Auth:** `AuthProvider` com detecção honesta — modo aberto quando não configurado.

---

## Módulos — Status Real

### ✅ Concluídos (V1.1)

| Módulo | Rota | Domínio | Descrição |
|--------|------|---------|-----------|
| **Comando (Home)** | `/` | `home` | Dashboard executivo clicável — métricas, atenção, operações, agentes, saúde, briefing, weather, skills, builders |
| **Agentes** | `/agents` | `agents` | Lista + Centro de Controle Operacional (abas: Visão Geral, Configuração, Operação, Logs). Restart e toggle de estado |
| **Sessões** | `/sessions` | `sessions` | Sessões ativas com status derivado, tokens, progresso |
| **Operações** | `/operations` | `operations` | Kanban + timeline + seções por status |
| **Atividade** | `/activity` | `activity` | Feed de atividades + resumo |
| **Memória** | `/memory` | `memory` | Snapshots de memória + busca |
| **Alertas** | `/alerts` | `alerts` | Lista com severidade + resumo + **filtros avançados (tipo + período)** |
| **Cron** | `/cron` | `cron` | Jobs cron com status de saúde |
| **Sistema** | `/system` | `system` | Infra health — CPU/RAM/disco, uptime, serviços, cron health, sinais de estabilidade |
| **Arquivos** | `/files` | `files` | Navegador de arquivos |
| **Skills** | `/skills` | — | Catálogo de skills com detalhes expandidos |
| **Builders** | `/builders` | — | Central de execução — OpenClaw / Claude Code / AIOX |
| **Missões** | `/missions` | — | Dashboard de workflows com "Run Now" |
| **Timeline** | `/timeline` | `timeline` | Linha do tempo unificada + **filtros avançados (tipo + status + período)** |
| **Lembretes** | `/reminders` | `reminders` | Lembretes + notícias derivados |
| **Pipelines** | `/pipelines` | `pipelines` | Fluxos derivados de cron + operations, painel de detalhe + "Executar Agora" |
| **Configurações** | `/settings` | — | Status global, domínios live/fallback, diagnóstico SSE em tempo real |
| **Busca** | `/search` | — | Busca global |
| **Notificações** | TopBar | — | Centro derivado do cache React Query, deep-links para módulos |
| **Login** | `/login` | — | Email + senha, cadastro, reset. Estado honesto quando Supabase não configurado |
| **Office 3D** | `/office3d` | — | Visualização 3D com tooltip de hover e click-to-detail |

---

## Infraestrutura Transversal

| Componente | Status | Descrição |
|------------|--------|-----------|
| `AuthProvider` + `ProtectedRoute` | ✅ | Auth com modo aberto quando sem Supabase |
| `AdvancedFilters` | ✅ | Filtros reutilizáveis (tipo + status + date range) |
| `OrionLayout` | ✅ | Sidebar + TopBar (com user/logout) + StatusBar |
| `OrionDataWrapper` | ✅ | Loading/error/empty states padronizados |
| `DomainHealthStore` | ✅ | Saúde por domínio (live/stale/loading/offline) |
| `useOrionStream` (SSE) | ✅ | Stream real-time para cache React Query |
| `sseDiagnostics` | ✅ | Diagnóstico SSE — status, reconexões, log de eventos |
| `createRealFirstFetcher` | ✅ | Padrão real-first + fallback |
| `PageTransition` | ✅ | Transições animadas entre rotas |
| Skeletons por domínio | ✅ | Loading states específicos |
| Sheets de detalhe | ✅ | Painéis laterais por domínio |
| Testes automatizados | ✅ | Vitest — auth, client, filtros (base mínima) |

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

### V1.1 — Robustez (Abril 2026)

- ✅ Autenticação email + senha (Supabase externo, modo aberto honesto)
- ✅ Proteção de rotas com redirect para `/login`
- ✅ Indicador de usuário + logout na TopBar
- ✅ Filtros avançados multi-critério na Timeline (tipo + status + período)
- ✅ Filtros avançados na tela de Alertas (severidade + período)
- ✅ Componente `AdvancedFilters` reutilizável com date picker
- ✅ Base de testes automatizados (Vitest — 4 testes)
- ✅ Documentação de configuração Supabase externo

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

## Próximos Passos — V1.2

- [ ] Persistência de notificações (marcar como lida, histórico)
- [ ] Página `/reset-password` funcional para completar fluxo de auth
- [ ] Filtros avançados em Lembretes e Atividade
- [ ] Cobertura de testes expandida (componentes visuais, hooks)
- [ ] PWA / suporte offline básico
- [ ] i18n formal (UI em PT-BR mas sem framework dedicado)

---

*Última revisão: abril 2026 — V1.1*
