# CRM: Client Journey & Delivery System
## Planificación del Flujo Completo

---

## Visión General

Sistema CRM que gestiona el ciclo de vida completo de un cliente potencial:

```
Website → Lead → Quote → Acceptance → Project → Completion → Success Case
```

### Etapas Principales (6 Esenciales)

| Etapa | Estado | Objetivo |
|-------|--------|----------|
| 1. Website Intake | `new_lead` | Capturar consulta limpia desde web |
| 2. Quoting | `quoted` | Armar y enviar propuesta formal |
| 3. Acceptance | `accepted` | Cliente acepta quote firmemente |
| 4. Project Creation | `in_progress` | Transformar quote en proyecto |
| 5. Completion | `delivered` | Entrega final y cierre |
| 6. Success Case | `published` | Publicar como caso de éxito |

---

## 1. Website Intake (Lead Capture)

### Formulario Web
```
POST /api/leads
{
  "source": "website",
  "contact": {
    "name": "string",
    "email": "string",
    "company": "string?",
    "phone": "string?"
  },
  "project": {
    "service_type": "web_dev | ux_design | seo | ai_automation | strategy",
    "description": "string",
    "budget_range": "5k-10k | 10k-25k | 25k-50k | 50k+",
    "timeline": "asap | 1-2months | 3-6months | flexible"
  },
  "client_profile": {
    "company_size": "startup | smb | enterprise | non_profit",
    "industry": "string?",
    "current_website": "url?"
  },
  "utm": {
    "source": "string?",
    "medium": "string?",
    "campaign": "string?"
  }
}
```

### Acciones Automáticas
- [ ] Crear lead en Supabase con status `new`
- [ ] Enviar notificación a Slack #leads
- [ ] Crear entrada en Notion (Lead Database)
- [ ] Enviar email de confirmación al cliente
- [ ] Asignar lead score inicial basado en budget + timeline

### Estado en DB
```typescript
interface Lead {
  id: uuid
  status: 'new' | 'qualified' | 'unqualified' | 'quoted'
  source: 'website' | 'referral' | 'outreach' | 'social'
  contact: ContactInfo
  project: ProjectIntent
  qualification?: LeadQualification
  created_at: timestamp
  assigned_to?: uuid // user_id
}
```

---

## 2. Lead Qualification

### Dashboard de Qualification
Campo rápido para clasificar:

```typescript
interface LeadQualification {
  decision: 'hot' | 'warm' | 'cold' | 'not_fit'
  reason: string?
  needs_discovery: boolean
  estimated_value: number?
  priority: 'high' | 'medium' | 'low'
  qualified_by: uuid
  qualified_at: timestamp
}
```

### Acciones por decisión

| Decisión | Siguiente Paso | Acción |
|----------|----------------|--------|
| `hot` | Discovery Call | Crear evento Calendly, email template |
| `warm` | Follow-up | Task para contactar en X días |
| `cold` | Nurture | Agregar a newsletter, tag en Notion |
| `not_fit` | Archive | Mover a "Not a fit", opción de referir |

---

## 3. Quote Builder

### Estructura de Quote
```typescript
interface Quote {
  id: uuid
  lead_id: uuid
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
  
  // Metadata
  quote_number: string // Q-2025-001
  valid_until: date
  
  // Contenido
  services: QuoteService[]
  stages: QuoteStage[]
  options: QuoteOption[]
  terms: QuoteTerms
  
  // Precios
  pricing: {
    subtotal: number
    discount?: number
    discount_reason?: string
    tax?: number
    total: number
    currency: 'USD' | 'AUD' | 'EUR'
  }
  
  // Timelines
  estimated_duration: string // "6-8 weeks"
  start_date?: date
  
  // Relaciones
  created_by: uuid
  sent_at?: timestamp
  accepted_at?: timestamp
}

interface QuoteService {
  id: uuid
  name: string
  description: string
  category: 'discovery' | 'design' | 'development' | 'seo' | 'maintenance'
  price: number
  is_optional: boolean
  selected: boolean
}

interface QuoteStage {
  id: uuid
  name: string
  description: string
  deliverables: string[]
  duration: string // "2 weeks"
  price: number
  dependencies: uuid[] // otros stage_ids
}
```

### Quote Templates
Pre-armados para servicios comunes:
- **Web Development Standard** (Discovery → Design → Build → Launch)
- **SEO Growth Package** (Audit → Optimization → Content → Monitoring)
- **UX Audit** (Research → Analysis → Recommendations)
- **AI Automation** (Discovery → Workflow Design → Implementation)

### Visualización
- URL pública: `/quotes/{quote_id}`
- PDF exportable
- Email con CTA claro de aceptación

---

## 4. Quote Acceptance

### Proceso de Aceptación
```
Cliente recibe email → Clica link → Ve quote → Clica "Accept Quote"
```

### Formulario de Aceptación
```typescript
interface QuoteAcceptance {
  quote_id: uuid
  accepted_by: {
    name: string
    email: string
    company: string
    role: string
  }
  acceptance_date: date
  project_start_preference: 'asap' | 'specific_date'
  preferred_start_date?: date
  additional_notes?: string
  
  // Legal
  terms_accepted: boolean
  ip_address: string
  user_agent: string
  
  // Firma
  signature?: string // SVG o imagen base64
}
```

### Acciones Automáticas al Aceptar
- [ ] Cambiar quote status → `accepted`
- [ ] Crear Project desde Quote (copiar services/stages)
- [ ] Crear invoice inicial (deposito 50%)
- [ ] Enviar email de bienvenida + contrato
- [ ] Crear carpeta en Google Drive / Notion
- [ ] Notificar equipo en Slack #projects
- [ ] Crear tareas iniciales en PM

---

## 5. Project Creation (from Accepted Quote)

### Transformación Automática
```typescript
// Quote → Project
interface Project {
  id: uuid
  quote_id: uuid
  lead_id: uuid
  
  status: ProjectStatus
  
  // Info copiada de Quote
  name: string // "Northgate Website Redesign"
  client: ClientInfo
  services: ProjectService[]
  stages: ProjectStage[]
  total_value: number
  
  // Timeline real
  start_date: date
  target_end_date: date
  actual_end_date?: date
  
  // Asignaciones
  project_manager: uuid
  team: TeamMember[]
  
  // Links externos
  notion_page_id?: string
  drive_folder_id?: string
  github_repo?: string
  staging_url?: string
  production_url?: string
}

type ProjectStatus = 
  | 'kickoff' 
  | 'discovery' 
  | 'design' 
  | 'build' 
  | 'review' 
  | 'delivered' 
  | 'completed'
```

### Estructura de Stages (Simple)
Cada proyecto tiene estas etapas por defecto:

| Stage | Orden | Checklist Default |
|-------|-------|-------------------|
| Kickoff | 0 | Brief, accesos, setup |
| Discovery | 1 | Research, requerimientos, propuesta |
| Design | 2 | Wireframes, UI, aprobación |
| Build | 3 | Desarrollo, contenido, testing |
| Review | 4 | QA, feedback, ajustes |
| Delivered | 5 | Deploy, handoff, docs |
| Completed | 6 | Cierre administrativo |

### Project Stage Tracking
```typescript
interface ProjectStage {
  id: uuid
  project_id: uuid
  name: string
  order: number
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'blocked'
  
  // Fechas
  start_date?: date
  target_date: date
  completed_date?: date
  
  // Tareas simples
  tasks: StageTask[]
  
  // Entregables
  deliverables: Deliverable[]
  
  // Comunicación
  client_feedback?: string
  internal_notes?: string
}

interface StageTask {
  id: uuid
  name: string
  completed: boolean
  assigned_to?: uuid
}
```

---

## 6. Project Completion & Sign Off

### Proceso de Cierre
```
Stage "Review" → Client approval → Stage "Delivered" → Admin closure → "Completed"
```

### Checklist de Cierre Obligatorio
- [ ] Deploy a producción confirmado
- [ ] Cliente confirmó entrega satisfactoria
- [ ] Documentación entregada (si aplica)
- [ ] Capacitación realizada (si aplica)
- [ ] Accesos transferidos
- [ ] Invoice final pagada
- [ ] Proyecto archivado (Google Drive)

### Sign Off Form
```typescript
interface ProjectSignOff {
  project_id: uuid
  completed_by: {
    name: string
    email: string
    company: string
  }
  completion_date: date
  
  // Confirmaciones
  deliverables_received: boolean
  quality_satisfactory: boolean
  ready_for_case_study: boolean
  
  // Testimonial opcional
  testimonial?: {
    rating: 1-5
    comment: string
    can_publish: boolean
    can_use_logo: boolean
  }
  
  // Results
  results_achieved?: string // "20% increase in conversions"
}
```

---

## 7. Success Case Workflow (Trigger Automático)

### Cuando un proyecto pasa a `completed`
Se dispara automáticamente:

```typescript
interface SuccessCaseWorkflow {
  project_id: uuid
  status: 'pending' | 'in_review' | 'ready' | 'published'
  
  // Assets a recolectar
  assets: {
    final_website_url: string
    screenshots: string[] // URLs
    before_screenshot?: string
    metrics?: string // analytics data
  }
  
  // Story
  story: {
    client_name: string
    industry: string
    challenge: string // problema inicial
    solution: string // qué hicimos
    results: string // impacto medible
  }
  
  // Testimonial
  testimonial?: {
    quote: string
    author: string
    role: string
    photo?: string
  }
  
  // Publishing
  publish_ready: boolean
  published_at?: date
  published_url?: string
}
```

### Workflow de Publicación

```
Completed → Pending Review → Assets Captured → Story Written → Ready → Published
```

| Paso | Acción | Responsable |
|------|--------|-------------|
| 1 | Sistema crea Success Case entry automático | System |
| 2 | PM recolecta screenshots y URLs | Project Manager |
| 3 | Copywriter redacta caso de éxito | Marketing |
| 4 | Designer prepara visuals | Design |
| 5 | Review final y aprobación | Lead |
| 6 | Publicar en web + social | Marketing |
| 7 | Actualizar portfolio site | System |

### Integración con Website
Cuando `status === 'published'`:
- [ ] Auto-publicar en `/case-studies/{slug}`
- [ ] Actualizar home portfolio grid
- [ ] Post programado en LinkedIn
- [ ] Agregar a newsletter "Recent work"

---

## Diagrama de Estados (State Machine)

```
                    ┌─────────────┐
                    │   Website   │
                    │    Form     │
                    └──────┬──────┘
                           │
                           ▼
┌──────────┐        ┌─────────────┐      ┌─────────────┐
│ Archived │◄───────│     NEW     │─────►│  Qualified  │
│ (not fit)│        │    Lead     │      │   (hot)     │
└──────────┘        └──────┬──────┘      └──────┬──────┘
                           │                    │
                    ┌──────▼──────┐             │
                    │   Quote     │◄────────────┘
                    │   Builder   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌──────────┐
        │ Rejected│  │ Expired │  │ Accepted │
        └─────────┘  └─────────┘  └────┬─────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │ Project Created │
                              │   (in_progress) │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
            ┌───────────┐      ┌───────────┐      ┌───────────┐
            │ Discovery │─────►│  Design   │─────►│   Build   │
            └───────────┘      └───────────┘      └─────┬─────┘
                                                        │
                              ┌─────────────────────────┘
                              ▼
                       ┌───────────┐      ┌───────────┐
                       │  Review   │─────►│ Delivered │
                       └───────────┘      └─────┬─────┘
                                                 │
                                                 ▼
                                          ┌───────────┐
                                          │ Completed │
                                          └─────┬─────┘
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │ Success Case │
                                         │  Workflow    │
                                         └──────┬───────┘
                                                │
                                       ┌────────┼────────┐
                                       ▼        ▼        ▼
                                 ┌─────────┐ ┌─────┐ ┌─────────┐
                                 │Pending  │ │Ready│ │Published│
                                 │Review   │ └─────┘ └─────────┘
                                 └─────────┘
```

---

## Resumen: 6 Esenciales

### 1. Website Intake
- Formulario web → API → Supabase + Notion
- Notificación instantánea
- Lead scoring automático

### 2. Quoting
- Builder visual de quotes
- Templates reutilizables
- URL pública + PDF

### 3. Acceptance
- Formulario de aceptación con firma
- Transformación automática Quote → Project
- Invoice inicial generada

### 4. Project Creation
- Stages predefinidos (6 etapas)
- Checklists por stage
- Timeline y asignaciones

### 5. Completion Status
- Sign off formal del cliente
- Checklist de cierre obligatorio
- Validación de pago final

### 6. Success Case Workflow
- Trigger automático en completed
- Captura de assets y testimoniales
- Workflow de aprobación → publicación
- Auto-update en website

---

## Próximos Pasos

1. **Definir data models** (ver `02-backend-foundations.md`)
2. **Crear API endpoints** para cada etapa
3. **Construir UI** (React + Tailwind)
4. **Integrar Notion API** para leads
5. **Deploy en VM** con Docker
