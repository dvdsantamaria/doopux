# CRM Backend Foundations
## Arquitectura: Node + React + Supabase

---

## Stack Tecnológico

| Capa | Tecnología | Uso |
|------|------------|-----|
| **Frontend** | React + Vite + Tailwind | Dashboard SPA |
| **Backend** | Node.js + Express | API REST |
| **Database** | Supabase (PostgreSQL) | Data layer |
| **Auth** | Supabase Auth | JWT + OAuth |
| **Storage** | Supabase Storage | Files, images |
| **Integrations** | Notion API, SendGrid, Slack | External services |
| **Deploy** | Docker + VM (AWS/DigitalOcean) | Production |

---

## Estructura de Carpetas

```
crm/
├── apps/
│   ├── web/                    # React Frontend
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   ├── pages/          # Route pages
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── stores/         # Zustand stores
│   │   │   ├── lib/            # Utils, api client
│   │   │   └── types/          # TypeScript types
│   │   ├── public/
│   │   └── package.json
│   │
│   └── api/                    # Node.js Backend
│       ├── src/
│       │   ├── routes/         # API routes
│       │   ├── controllers/    # Business logic
│       │   ├── middleware/     # Auth, validation
│       │   ├── services/       # External APIs
│       │   ├── jobs/           # Background tasks
│       │   └── lib/            # Utils, config
│       └── package.json
│
├── packages/
│   ├── shared-types/           # Types compartidos
│   ├── database/               # Supabase client, migrations
│   └── eslint-config/          # Config compartida
│
├── docker-compose.yml
├── Dockerfile
└── turbo.json                  # Monorepo config
```

---

## Database Schema (Supabase)

### Tablas Principales

```sql
-- LEADS
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status lead_status DEFAULT 'new',
  source lead_source NOT NULL,
  
  -- Contact info
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_company TEXT,
  contact_phone TEXT,
  
  -- Project intent
  service_type service_type,
  project_description TEXT,
  budget_range budget_range,
  timeline timeline_option,
  
  -- Client profile
  company_size company_size,
  industry TEXT,
  current_website TEXT,
  
  -- UTM tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Qualification
  qualification_status qualification_status,
  qualification_reason TEXT,
  estimated_value DECIMAL(10,2),
  priority priority_level DEFAULT 'medium',
  
  -- Relations
  assigned_to UUID REFERENCES auth.users(id),
  notion_page_id TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- QUOTES
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  status quote_status DEFAULT 'draft',
  
  quote_number TEXT UNIQUE NOT NULL, -- Q-2025-001
  valid_until DATE,
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  discount_reason TEXT,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  currency currency_code DEFAULT 'USD',
  
  -- Timeline
  estimated_duration TEXT,
  start_date DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  -- Public URL
  public_token TEXT UNIQUE
);

-- QUOTE SERVICES
CREATE TABLE quote_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category service_category,
  price DECIMAL(10,2) NOT NULL,
  is_optional BOOLEAN DEFAULT false,
  selected BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- QUOTE STAGES
CREATE TABLE quote_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  deliverables TEXT[],
  duration TEXT,
  price DECIMAL(10,2) NOT NULL,
  dependencies UUID[], -- array de quote_stages.id
  sort_order INTEGER DEFAULT 0
);

-- PROJECTS
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id),
  lead_id UUID REFERENCES leads(id),
  status project_status DEFAULT 'kickoff',
  
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_company TEXT,
  
  -- Financial
  total_value DECIMAL(10,2) NOT NULL,
  invoiced_amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Timeline
  start_date DATE,
  target_end_date DATE,
  actual_end_date DATE,
  
  -- Team
  project_manager UUID REFERENCES auth.users(id),
  team_members UUID[],
  
  -- External links
  notion_page_id TEXT,
  drive_folder_id TEXT,
  github_repo TEXT,
  staging_url TEXT,
  production_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECT STAGES
CREATE TABLE project_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  status stage_status DEFAULT 'pending',
  
  -- Dates
  start_date DATE,
  target_date DATE,
  completed_date DATE,
  
  -- Content
  internal_notes TEXT,
  client_feedback TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STAGE TASKS
CREATE TABLE stage_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID REFERENCES project_stages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  assigned_to UUID REFERENCES auth.users(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUCCESS CASES
CREATE TABLE success_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  status success_case_status DEFAULT 'pending',
  
  -- Assets
  final_website_url TEXT,
  screenshots TEXT[],
  before_screenshot TEXT,
  metrics_summary TEXT,
  
  -- Story
  client_name TEXT,
  industry TEXT,
  challenge TEXT,
  solution TEXT,
  results TEXT,
  
  -- Testimonial
  testimonial_quote TEXT,
  testimonial_author TEXT,
  testimonial_role TEXT,
  testimonial_photo TEXT,
  can_publish_testimonial BOOLEAN DEFAULT false,
  can_use_logo BOOLEAN DEFAULT false,
  
  -- Publishing
  publish_ready BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  published_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITY LOG
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type entity_type NOT NULL, -- 'lead', 'quote', 'project'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'status_changed'
  changes JSONB,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENUMS
CREATE TYPE lead_status AS ENUM ('new', 'qualified', 'unqualified', 'quoted', 'converted', 'lost');
CREATE TYPE lead_source AS ENUM ('website', 'referral', 'outreach', 'social', 'partner');
CREATE TYPE service_type AS ENUM ('web_dev', 'ux_design', 'seo', 'ai_automation', 'strategy', 'maintenance');
CREATE TYPE budget_range AS ENUM ('under_5k', '5k_10k', '10k_25k', '25k_50k', '50k_plus', 'not_sure');
CREATE TYPE timeline_option AS ENUM ('asap', '1_2months', '3_6months', 'flexible');
CREATE TYPE company_size AS ENUM ('startup', 'smb', 'enterprise', 'non_profit', 'individual');
CREATE TYPE qualification_status AS ENUM ('hot', 'warm', 'cold', 'not_fit');
CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired');
CREATE TYPE service_category AS ENUM ('discovery', 'design', 'development', 'seo', 'content', 'maintenance');
CREATE TYPE currency_code AS ENUM ('USD', 'AUD', 'EUR', 'GBP');
CREATE TYPE project_status AS ENUM ('kickoff', 'discovery', 'design', 'build', 'review', 'delivered', 'completed', 'on_hold', 'cancelled');
CREATE TYPE stage_status AS ENUM ('pending', 'in_progress', 'review', 'completed', 'blocked');
CREATE TYPE success_case_status AS ENUM ('pending', 'in_review', 'ready', 'published', 'archived');
CREATE TYPE entity_type AS ENUM ('lead', 'quote', 'project', 'success_case');
```

### Row Level Security (RLS)

```sql
-- Leads: team members can see all, edit assigned
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view all leads"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team can create leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Can update own or unassigned leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid() OR assigned_to IS NULL);

-- Projects: similar pattern
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "PMs can update their projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (project_manager = auth.uid());
```

---

## API Endpoints

### Leads
```
POST   /api/leads                 # Create (webhook from website)
GET    /api/leads                 # List with filters
GET    /api/leads/:id             # Get single
PATCH  /api/leads/:id             # Update
PATCH  /api/leads/:id/qualify     # Qualify lead
POST   /api/leads/:id/convert     # Convert to quote
DELETE /api/leads/:id             # Archive

# Query params
GET /api/leads?status=new&assigned_to=me&priority=high
```

### Quotes
```
POST   /api/quotes                # Create from lead
GET    /api/quotes                # List
GET    /api/quotes/:id            # Get (auth)
GET    /api/quotes/public/:token  # Public view (no auth)
PATCH  /api/quotes/:id            # Update
POST   /api/quotes/:id/send       # Send to client
POST   /api/quotes/:id/duplicate  # Clone quote
POST   /api/quotes/public/:token/accept  # Client acceptance
```

### Projects
```
POST   /api/projects              # Create from accepted quote
GET    /api/projects              # List
GET    /api/projects/:id          # Get with stages
PATCH  /api/projects/:id          # Update
PATCH  /api/projects/:id/stage    # Update current stage
POST   /api/projects/:id/complete # Mark as completed

# Stages
POST   /api/projects/:id/stages/:stage_id/complete
POST   /api/projects/:id/stages/:stage_id/tasks
PATCH  /api/projects/:id/stages/:stage_id/tasks/:task_id
```

### Success Cases
```
GET    /api/success-cases         # List (public)
GET    /api/success-cases/:id     # Get
PATCH  /api/success-cases/:id     # Update (admin)
POST   /api/success-cases/:id/publish
GET    /api/success-cases/featured # For homepage
```

### Dashboard
```
GET    /api/dashboard/stats       # KPIs
GET    /api/dashboard/pipeline    # Pipeline view
GET    /api/dashboard/activity    # Recent activity
```

---

## Notion Integration

### Sync Strategy
```typescript
// services/notion.service.ts
class NotionService {
  // Cuando se crea un lead en web
  async createLeadEntry(lead: Lead) {
    const page = await notion.pages.create({
      parent: { database_id: process.env.NOTION_LEADS_DB_ID },
      properties: {
        'Name': { title: [{ text: { content: lead.contact.name } }] },
        'Email': { email: lead.contact.email },
        'Company': { rich_text: [{ text: { content: lead.contact.company } }] },
        'Service': { select: { name: lead.project.service_type } },
        'Budget': { select: { name: lead.project.budget_range } },
        'Status': { select: { name: 'New' } },
        'Priority': { select: { name: lead.qualification?.priority || 'medium' } },
        'CRM Link': { url: `${process.env.CRM_URL}/leads/${lead.id}` }
      }
    });
    return page.id;
  }

  // Webhook de Notion → actualizar en CRM
  async handleNotionWebhook(payload: NotionWebhook) {
    const { page_id, properties } = payload;
    const lead = await db.leads.findByNotionId(page_id);
    
    if (properties.Status?.select?.name === 'Qualified') {
      await db.leads.update(lead.id, {
        status: 'qualified',
        qualification_status: 'warm'
      });
    }
  }
}
```

### Webhook Setup
```javascript
// routes/notion.webhook.js
router.post('/webhook/notion', async (req, res) => {
  const signature = req.headers['notion-signature'];
  
  if (!verifyNotionSignature(signature, req.body)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  await notionService.handleNotionWebhook(req.body);
  res.json({ received: true });
});
```

---

## Frontend Architecture

### State Management (Zustand)
```typescript
// stores/leads.store.ts
interface LeadsState {
  leads: Lead[];
  selectedLead: Lead | null;
  filters: LeadFilters;
  
  // Actions
  fetchLeads: (filters?: LeadFilters) => Promise<void>;
  createLead: (data: CreateLeadInput) => Promise<Lead>;
  qualifyLead: (id: string, data: QualificationInput) => Promise<void>;
  convertToQuote: (id: string) => Promise<Quote>;
}

export const useLeadsStore = create<LeadsState>((set, get) => ({
  leads: [],
  selectedLead: null,
  filters: {},
  
  fetchLeads: async (filters) => {
    const leads = await api.leads.list(filters);
    set({ leads, filters: filters || {} });
  },
  
  // ... más actions
}));
```

### Route Structure
```
/                    → Dashboard
/leads               → Leads list
/leads/:id           → Lead detail
/quotes              → Quotes list
/quotes/:id          → Quote builder/view
/quotes/public/:token → Public quote (no auth)
/projects            → Projects list
/projects/:id        → Project dashboard
/success-cases       → Success cases admin
/settings            → Config
```

### Key Components
```
components/
├── layout/
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── Layout.tsx
├── leads/
│   ├── LeadCard.tsx
│   ├── LeadList.tsx
│   ├── LeadQualificationForm.tsx
│   └── LeadStatusBadge.tsx
├── quotes/
│   ├── QuoteBuilder.tsx
│   ├── QuotePreview.tsx
│   ├── ServiceLineItem.tsx
│   └── StageTimeline.tsx
├── projects/
│   ├── ProjectBoard.tsx
│   ├── StageColumn.tsx
│   ├── TaskItem.tsx
│   └── CompletionModal.tsx
└── ui/
    ├── Button.tsx
    ├── Card.tsx
    ├── Badge.tsx
    └── Modal.tsx
```

---

## Background Jobs

### Queue System (Bull + Redis)
```typescript
// jobs/queues.ts
export const emailQueue = new Queue('emails', redisConnection);
export const notionSyncQueue = new Queue('notion-sync', redisConnection);
export const successCaseQueue = new Queue('success-case', redisConnection);

// jobs/email.job.ts
emailQueue.process(async (job) => {
  const { type, to, data } = job.data;
  
  switch (type) {
    case 'lead_confirmation':
      await sendGrid.sendLeadConfirmation(to, data);
      break;
    case 'quote_sent':
      await sendGrid.sendQuoteEmail(to, data);
      break;
    case 'project_started':
      await sendGrid.sendProjectWelcome(to, data);
      break;
  }
});

// Trigger desde controller
await emailQueue.add('lead_confirmation', {
  to: lead.email,
  data: { name: lead.name }
});
```

### Scheduled Jobs
```typescript
// jobs/scheduler.ts
// Revisar quotes expirados diariamente
schedule('0 9 * * *', async () => {
  const expiredQuotes = await db.quotes.findExpired();
  
  for (const quote of expiredQuotes) {
    await db.quotes.update(quote.id, { status: 'expired' });
    await slack.notify(`Quote ${quote.number} expired`);
  }
});

// Follow-up de leads fríos
schedule('0 10 * * 1', async () => {
  const coldLeads = await db.leads.findCold(7); // 7+ days
  
  for (const lead of coldLeads) {
    await emailQueue.add('lead_nurture', { to: lead.email });
  }
});
```

---

## Docker & Deployment

### Dockerfile (API)
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - NOTION_TOKEN=${NOTION_TOKEN}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
      - SLACK_WEBHOOK=${SLACK_WEBHOOK}
    depends_on:
      - redis

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - api

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

### Deploy Script
```bash
#!/bin/bash
# deploy.sh

git pull origin main
docker-compose down
docker-compose build
docker-compose up -d

# Run migrations
docker-compose exec api npx supabase db push

# Clean up old images
docker image prune -f
```

---

## Environment Variables

```bash
# .env.example

# Database
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Auth
JWT_SECRET=your-jwt-secret

# Notion
NOTION_TOKEN=secret_xxx
NOTION_LEADS_DB_ID=xxx

# Email
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM=crm@doopux.com

# Slack
SLACK_WEBHOOK=https://hooks.slack.com/...

# Storage
SUPABASE_STORAGE_BUCKET=crm-assets

# App
NODE_ENV=production
CRM_URL=https://crm.doopux.com
API_URL=https://api.doopux.com
```

---

## Next Steps Checklist

### Phase 1: Foundation
- [ ] Setup monorepo (Turborepo)
- [ ] Configure Supabase project
- [ ] Create database schema
- [ ] Setup authentication
- [ ] Basic API structure

### Phase 2: Core Features
- [ ] Lead intake form (public)
- [ ] Leads dashboard
- [ ] Quote builder
- [ ] Quote public view
- [ ] Quote acceptance flow

### Phase 3: Project Management
- [ ] Project creation from quote
- [ ] Stage tracking board
- [ ] Task management
- [ ] Completion workflow

### Phase 4: Success Cases
- [ ] Success case trigger
- [ ] Asset capture UI
- [ ] Publishing workflow
- [ ] Portfolio integration

### Phase 5: Integrations
- [ ] Notion sync
- [ ] Email templates
- [ ] Slack notifications
- [ ] Calendar integration

### Phase 6: Deploy
- [ ] Docker setup
- [ ] VM provisioning
- [ ] SSL/Domain config
- [ ] Monitoring
