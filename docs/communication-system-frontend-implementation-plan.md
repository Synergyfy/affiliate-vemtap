# VEMTAP Communication & Follow-up System — Frontend Implementation Plan

**Owner:** Frontend (apps/web)
**Status:** Draft for review
**Depends on:** Backend contract alignment (§4, §19)
**Scope:** Next.js 15 app under `apps/web`. Backend (apps/api) is out of scope but the contract this UI expects is specified so both sides can develop in parallel.

---

## 1. How to read this document

Every section ends with a `▶ Deliverables` checklist. The plan is written to be implemented in **milestone order** (§17), so you can ship Phase 1 without waiting for the whole feature.

A traceability map (§3) links every requirement in the product brief to a concrete frontend deliverable. If a requirement has no deliverable listed, it is either (a) a backend/automation concern surfaced in UI only, or (b) flagged as an open question (§19).

---

## 2. Goal & non-negotiable product principles

> **Once a business is added to the system, VEMTAP should know its sales status and help the Sales Team follow up through WhatsApp and SMS without relying on memory.**

Non-negotiables (these shape every UI decision):

| # | Principle | What it means in the UI |
|---|-----------|------------------------|
| P1 | **No fake WhatsApp sends** | VEMTAP prepares the recipient + message, opens WhatsApp, the user actually sends, then marks it sent. We must never mark a WhatsApp message as sent that the user didn't send. |
| P2 | **No secret WhatsApp Web automation** | No scraping, no auto-click. Clear separation between `Open WhatsApp → user sends → Mark as Sent`. |
| P3 | **Status drives the journey** | The communication actions offered for a contact are derived from its status. Interested → follow-up. Subscribed/Customer → never see "subscribe" messaging. Not Interested → journal stops (policy is admin-controlled). |
| P4 | **Communication is separate from sales info** | A contact has both a Sales Status (`Interested`) and Communication info (`WhatsApp: 1 sent`, `SMS: not yet`, `Next follow-up: 21 Aug`). Both are always visible together. |
| P5 | **Avoid over-messaging** | Frequency guardrails are enforced before any marketing message: warn/exclude contacts that would be over-messaged, never silently spam. |
| P6 | **Subscription overrides everything** | When a lead becomes a Customer/Subscribed, pending sales messages are cancelled and the Customer Journey begins. This must be visible and acknowledged in UI. |
| P7 | **One Communication Engine, two channels** | WhatsApp and SMS are the same data structures with different delivery behaviour. Do not fork the UI into two unrelated features. |
| P8 | **SMS is paid** | Admin controls when/how often/what for. Cost warnings and a pause switch are first-class UI. |

---

## 3. Feature map (brief section → deliverable)

| Brief § | Requirement | Frontend deliverable | Phase |
|---------|-------------|----------------------|-------|
| §1 | Business submission fields | Already covered by `LeadCaptureForm` / market mapping capture. **Gap:** ensure `phone`, `contactName`, `status`, `date contacted` are captured. Task: verify + backfill UI if missing. | 1 |
| §2 | Lead status list + status controls journey | Reuse `LeadStatus`; render status-driven communication options. Status value set is **configurable** (see `MarketMappingAdminConfig` precedent) — feed from settings endpoint. | 1 |
| §3 | Sales info + communication info shown together | `ContactCommunicationSummary` block embedded in lead detail + contacts table columns. | 1 |
| §4,5,6,7 | WhatsApp assisted sending + queue | `WhatsAppTab`, `WhatsAppQueuePage`, `QueueRunner` component. | 1 |
| §8 | WhatsApp history | `MessageHistoryTimeline` per contact + sent-messages list. | 1 |
| §9 | SMS send directly from platform | `SmsTab`, `SmsComposerModal`, schedule + send. | 2 |
| §10 | SMS automation on events | `AutomationSequences` (rule builder UI) — engine is backend; UI is rule CRUD + visibility of what each trigger does. | 3 |
| §11 | 160-char limit enforced | `SmsCharCounter` util + composer validation (checked after variable substitution). | 2 |
| §12 | Admin Communication Overview | `CommunicationOverviewTab` + stat cards. | 1 |
| §13 | WhatsApp & SMS channel hubs | `WhatsAppTab`, `SmsTab` with sub-views (create/queue/pending/sent/history). | 1/2 |
| §14 | Audience selection (status/salesperson/location/date) | `AudienceBuilder` reusable component with live count. | 1 |
| §15 | Message templates CRUD + active/archive | `TemplatesTab`, `TemplateModal`, list/cards. | 1 |
| §16 | Personalisation variables later + count after replace | `TemplateVariableInsert` toolbar + `substituteVariables()` util + char counter on resolved text. | 2 |
| §17 | Automated SMS sequences (rules) | `AutomationSequences` UI + rule cards. | 3 |
| §18 | WhatsApp uses same rules → pending task | Same rule engine surfaces as WhatsApp queue items ("Follow-up Due") → connects to queue runner. | 3 |
| §19 | Promotions / campaigns | `CampaignsTab`, `CampaignModal`, campaign status control. | 3 |
| §20 | Frequency rules | `CommunicationSettings` (frequency config UI) + over-messaging warning in audience/composer. | 3 |
| §21 | Subscription override | `SubscriptionOverrideBanner` + auto-cancel of pending items (via API) + invalidation of lead + communication queries. | 2 |
| §22 | Customer journey | `CustomerJourney` config UI (sequence editor) + journey stage tags on customer contacts. | 3 |
| §23 | Not-interested policy | Admin-controlled toggle in `CommunicationSettings` (`QUIET` vs `RE_ENGAGEMENT`). | 3 |
| §24 | Communication history on every contact | `CommunicationSection` in `LeadDetailsDrawer` + ded. contacts drawer. | 1 |
| §25 | Sales team view | `/dashboard/communication` "Today's Follow-ups" with WhatsApp queue integration. | 1 |
| §26 | Admin reporting | `CommunicationReports` tab (WhatsApp/SMS/Conversion metrics). | 3 |
| §27 | Overall system flow | Guaranteed by unified data model (§5) + query invalidation graph (§7.5). | ALL |

---

## 4. Proposed API contract (for backend alignment)

> Frontend can develop fully against the mock layer (§15) in parallel. Endpoints below are the contract the UI targets. Exact paths are negotiable — but **data shapes are not**, they must match §5 types.

### 4.1 New endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/communication/overview` | Overview stats (§12) |
| `GET` | `/communication/audience/estimate` | Given filters, returns `{ count, overMessagingCount }` |
| `GET` | `/communication/templates` | List templates (`?channel=&status=&page=`) |
| `POST` | `/communication/templates` | Create template |
| `PATCH` | `/communication/templates/:id` | Edit / activate / deactivate / archive (status field) |
| `DELETE` | `/communication/templates/:id` | Delete template |
| `GET` | `/communication/queues` | WhatsApp queues (`?status=ACTIVE`) |
| `POST` | `/communication/queues` | Create queue from audience + message body/template |
| `GET` | `/communication/queues/:id` | Queue detail incl. items (paginated chunk) |
| `POST` | `/communication/queues/:id/pause` `/resume` `/cancel` | Queue lifecycle |
| `POST` | `/communication/queues/:queueId/items/:itemId/open` | Record "prepared/opened WhatsApp" |
| `POST` | `/communication/queues/:queueId/items/:itemId/sent` | Record "marked as sent" (only after open) |
| `POST` | `/communication/queues/:queueId/items/:itemId/skip` | Skip item |
| `GET` | `/communication/messages` | Message log (`?channel=&status=&leadId=&dateFrom=&dateTo=&page=`) |
| `POST` | `/communication/messages` | Manually send SMS (immediate) or create scheduled |
| `PATCH` | `/communication/messages/:id` | Cancel scheduled / retry failed |
| `GET` | `/leads/:id/communication` | Per-contact communication summary + history (§24) |
| `GET` | `/communication/campaigns` / `POST` / `PATCH /:id` | Campaign CRUD |
| `GET` | `/communication/rules` / `POST` / `PATCH /:id` / `DELETE /:id` | Automation rules CRUD |
| `GET` | `/communication/settings` / `PATCH` | Frequency limits, SMS enable, not-interested policy |
| `GET` | `/communication/status-options` | Configurable lead-status list + labels (pipeline for §2) |

### 4.2 Events (websocket)

Namespace `/communication` (mirror `useNotificationSocket.ts`):

| Event | Payload | UI reaction |
|-------|---------|-------------|
| `communication:queue-updated` | `{ queueId, completedItems, totalItems, status }` | Update progress bars, advance queue runner |
| `communication:message-status` | `{ messageId, status }` | Update status badges, toasts, refetch overview |
| `communication:sms-delivery` | `{ messageId, status: 'DELIVERED' | 'FAILED' }` | Update sent/failed lists |

### 4.3 Response envelope

Reuse the existing `PaginatedResponse<T>` / `Meta` envelopes (`types/api.ts:167-177`). Stats endpoints return plain objects.

---

## 5. Data model — new TypeScript types

**New file:** `apps/web/types/communication.ts` (mirrors `types/sales-pipeline.ts` conventions: string-literal unions + exported label/colour lookup maps).

```ts
import { Lead, LeadStatus } from './api';

export type CommunicationChannel = 'WHATSAPP' | 'SMS';

// WhatsApp assisted-send lifecycle
export type WhatsAppItemStatus = 'PENDING' | 'OPENED' | 'SENT' | 'SKIPPED' | 'FAILED';

// SMS lifecycle
export type SmsMessageStatus =
  | 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';

export type QueueStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type TemplateStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'ARCHIVED';
export type RuleTarget = 'LEAD' | 'CUSTOMER';          // lead nurture vs customer journey
export type ChannelTarget = CommunicationChannel;

export interface TemplateVariable {
  token: string;        // '[Business Name]'
  valueOf: keyof Lead;  // 'businessName'
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: CommunicationChannel;
  body: string;                        // may contain [Business Name] etc.
  description?: string;
  variables: TemplateVariable[];       // parsed by the frontend, saved for validation
  status: TemplateStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AudienceFilter {
  statuses?: LeadStatus[];
  salespeople?: string[];              // user ids
  locations?: string[];                // area names
  dateAdded?: { range: 'today' | 'week' | 'month' | 'custom'; from?: string; to?: string };
  hasPhone?: boolean;
  excludeSubscribed?: boolean;         // default true for marketing sends
  excludeNotInterested?: boolean;      // bound to not-interested policy
}

export interface AudienceEstimate {
  count: number;
  overMessagingCount: number;          // excluded by frequency guardrail
  warnings: string[];
}

export interface CommunicationQueueItem {
  id: string;
  queueId: string;
  lead: Lead;                          // embedded → gives businessName, phone, contactName, agent
  order: number;
  status: WhatsAppItemStatus;
  waLink: string;                      // prepared https://wa.me/...?...  URL
  message: string;                     // resolved (variables substituted) message
  openedAt?: string;
  sentAt?: string;
}

export interface CommunicationQueue {
  id: string;
  name: string;
  channel: 'WHATSAPP';
  message: string;                     // resolved message body
  templateId?: string;
  totalItems: number;
  completedItems: number;              // SENT + SKIPPED
  status: QueueStatus;
  items: CommunicationQueueItem[];     // chunked by pagination
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundMessage {
  id: string;
  leadId: string;
  lead?: Pick<Lead, 'id' | 'businessName' | 'phone' | 'contactName' | 'location'>;
  channel: CommunicationChannel;
  templateId?: string;
  body: string;
  status: SmsMessageStatus | WhatsAppItemStatus;
  scheduledAt?: string;
  sentAt?: string;
  externalId?: string;                 // SMS provider / Wa message id
  sentBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  audience: AudienceFilter;
  channels: CommunicationChannel[];
  templateIds: string[];
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  target: RuleTarget;                  // LEAD (nurture) or CUSTOMER (journey)
  trigger:
    | { type: 'STATUS_CHANGED'; toStatus: LeadStatus }
    | { type: 'STATUS_STILL_AFTER_DAYS'; status: LeadStatus; waitDays: number; andNotSubscribed: boolean }
    | { type: 'SUBSCRIBED' };
  channel: CommunicationChannel;
  templateId: string;
  enabled: boolean;
}

export interface CommunicationSettings {
  smsEnabled: boolean;                 // master switch (cost control)
  smsProviderConfigured: boolean;
  marketingPaused: boolean;            // global kill-switch
  frequencyMaxPerWindow: number;       // e.g. 2
  frequencyWindowDays: number;         // e.g. 7
  notInterestedPolicy: 'QUIET' | 'RE_ENGAGEMENT';
  autoSmsOnStatus: LeadStatus | null;  // e.g. INTERESTED → send ack SMS
  defaultSenderLabel?: string;
}

export interface LeadCommunication {
  leadId: string;
  salesStatus: LeadStatus;
  whatsapp: { sentCount: number; pendingCount: number; lastSent?: string };
  sms: { sentCount: number; pendingCount: number; lastSent?: string; nextScheduled?: string };
  history: OutboundMessage[];          // newest first
}

export interface CommunicationOverview {
  totalContacts: number;
  whatsappEligible: number;
  whatsappPending: number;
  whatsappSent: number;
  smsSent: number;
  smsPending: number;
  smsFailed: number;
  scheduledMessages: number;
  activeCampaigns: number;
}
```

**Label / colour maps** (same shape as `LEAD_QUALITY_LABELS` / `LEAD_QUALITY_COLORS` at `types/sales-pipeline.ts:169`):

```ts
export const CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  WHATSAPP: 'WhatsApp', SMS: 'SMS',
};
export const CHANNEL_COLORS: Record<CommunicationChannel, { bg: string; text: string; border: string }> = {
  WHATSAPP: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  SMS: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
};
export const WHATSAPP_STATUS_LABELS: Record<WhatsAppItemStatus, string> = { ... };
export const WHATSAPP_STATUS_COLORS: Record<WhatsAppItemStatus, { bg: string; text: string; border: string }> = { ... };
export const SMS_STATUS_LABELS / SMS_STATUS_COLORS: ...
export const QUEUE_STATUS_LABELS / CAMPAIGN_STATUS_LABELS / TEMPLATE_STATUS_LABELS: ...
```

▶ **Deliverables:** create `types/communication.ts` with all interfaces + label/colour maps.

---

## 6. Routing & navigation

### 6.1 Admin section

New top-level admin section **Communication** with a shared tab bar (pattern: `components/dashboard/operations/TabNavigation.tsx` `layoutId="activeTab"` underline).

```
app/admin/communication/
├── layout-less pages (each imports AdminLayout + CommunicationNav)
├── page.tsx                          # Overview (§12)
├── whatsapp/page.tsx                 # WhatsApp hub
├── whatsapp/queue/[queueId]/page.tsx # Queue runner working screen
├── sms/page.tsx                      # SMS hub
├── templates/page.tsx                # Template manager
├── campaigns/page.tsx                # Promotions
├── sequences/page.tsx                # Automation rules + customer journey
├── reports/page.tsx                  # Communication performance (§26)
└── settings/page.tsx                 # Frequency / cost / policy controls
```

- Register in `adminSidebarItems` in `components/admin/AdminLayout.tsx:28`:
  ```ts
  { name: 'Communication', icon: MessageSquareText, href: '/admin/communication' },
  ```
  Suggested position: directly after **Harvest Contacts** (it communicates with those contacts) and before **Affiliates**.
- Header breadcrumb/title auto-resolves via `adminSidebarItems.find(...)` (the header already does this for top-level items — sub-pages will show `Admin Panel`, so add a fallback title map or detect `pathname.startsWith('/admin/communication')`).

### 6.2 Sales team section

New page under the sales dashboard (works for AGENT / AFFILIATE / SALES_EXECUTIVE / SUPERVISOR / MANAGER — same role logic as `/dashboard/sales/follow-ups`):

```
app/dashboard/communication/
└── page.tsx   # "Today's Follow-ups" — WhatsApp due + SMS scheduled + statuses
```

Keep the existing pipeline-based `/dashboard/sales/follow-ups` page untouched; the new page is the **communication**-driven companion. Both link to each other.

▶ **Deliverables:** `AdminLayout` sidebar entry; new admin route folders; sales route folder.

---

## 7. Service layer — hooks

**New files:**
- `apps/web/services/useCommunicationHooks.ts` — all queries/mutations (the single module, per convention).
- `apps/web/services/useCommunicationSocket.ts` — websocket bridge (mirrors `useNotificationSocket.ts`).
- `apps/web/lib/communication-mock.ts` — typed mock data (only if hooks opt into `IS_MOCK`).

**Style rules (from codebase):**
- React Query v5. `useQuery` for reads, `useMutation` + `queryClient.invalidateQueries` for writes.
- `const IS_MOCK = process.env.NEXT_PUBLIC_ADMIN_MOCK === 'true'` at top of module (see `useSalesPipeline.ts:14`).
- Nested `queryKey` arrays with params (`['communication', 'overview']`, `['communication', 'queues', id]`).
- Import `api` from `./api` and unwrap `.data`, or use `@/lib/api-client` (`api.get` returns `T` directly).

### 7.1 Query hooks

```ts
// Overview
export function useCommunicationOverview() {
  return useQuery({
    queryKey: ['communication', 'overview'],
    queryFn: async () => {
      if (IS_MOCK) return mockOverview();
      return api.get('/communication/overview');
    },
  });
}

// Templates
export function useTemplates(params?: { channel?: CommunicationChannel; status?: TemplateStatus }) {
  return useQuery({
    queryKey: ['communication', 'templates', params],
    queryFn: async () => {
      if (IS_MOCK) return mockTemplates(params);
      return api.get('/communication/templates', { params });
    },
  });
}

// Audience estimate (debounced by callers via useDebounce)
export function useAudienceEstimate(filters: AudienceFilter | null) {
  return useQuery({
    queryKey: ['communication', 'audience', filters],
    enabled: !!filters,
    queryFn: async () => {
      if (IS_MOCK) return mockAudienceEstimate(filters!);
      return api.post('/communication/audience/estimate', filters);
    },
  });
}

// WhatsApp queues
export function useQueues(params?: { status?: QueueStatus }) { /* ['communication','queues',params] */ }
export function useQueue(id: string | undefined) {
  return useQuery({
    queryKey: ['communication', 'queue', id],
    enabled: !!id,
    queryFn: async () => { ... GET /communication/queues/:id ... },
  });
}

// Message log / per-contact history
export function useCommunicationMessages(params?: { channel?: CommunicationChannel; status?: string; page?: number }) { /* ['communication','messages',params] */ }
export function useLeadCommunication(leadId: string | undefined) { /* ['communication','lead',leadId], enabled: !!leadId */ }

// Campaigns / rules / settings
export function useCampaigns() { /* ['communication','campaigns'] */ }
export function useAutomationRules() { /* ['communication','rules'] */ }
export function useCommunicationSettings() { /* ['communication','settings'] */ }
```

### 7.2 Mutation hooks

```ts
export function useCreateOrUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id?: string } & Partial<MessageTemplate>) =>
      data.id ? api.patch(`/communication/templates/${data.id}`, data)
              : api.post('/communication/templates', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communication', 'templates'] });
      qc.invalidateQueries({ queryKey: ['communication', 'settings'] });
    },
  });
}

export function useCreateWhatsAppQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; filters: AudienceFilter; templateId?: string; message: string }) =>
      api.post('/communication/queues', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communication', 'queues'] });
      qc.invalidateQueries({ queryKey: ['communication', 'overview'] });
    },
  });
}

export function useQueueItemAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ queueId, itemId, action }: { queueId: string; itemId: string; action: 'open' | 'sent' | 'skip' }) =>
      api.post(`/communication/queues/${queueId}/items/${itemId}/${action}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communication', 'queue'] });
      qc.invalidateQueries({ queryKey: ['communication', 'overview'] });
    },
  });
}

export function useSendSms() {
  /* POST /communication/messages; invalidate ['communication','messages'], ['communication','overview'], ['communication','lead'] */
}
export function useCampaignMutations() { /* create/update/pause/end/archive */ }
export function useRuleMutations() { /* CRUD on ['communication','rules'] */ }
export function useUpdateCommunicationSettings() { /* PATCH; invalidate ['communication','settings','overview'] */ }
```

### 7.3 Queue position persistence

Long queues must survive refresh. Keep it on the client:

```ts
const QUEUE_RESUME_KEY = 'vemtap:queue:resume';   // lib/communication-storage.ts
export function saveQueuePosition(queueId: string, itemId: string) { localStorage.setItem(QUEUE_RESUME_KEY, JSON.stringify({ queueId, itemId })); }
export function getQueuePosition() { ... }
export function clearQueuePosition() { ... }
```

On queue page mount: if URL has no `?item=`, read resume position → if the stored item is still `PENDING`, focus it; otherwise advance to the first remaining `PENDING` item.

### 7.4 Invalidation graph

The following keys are invalidated together on any write so all screens stay consistent (mirror existing multi-key invalidation in `useCreateLead`):

```
['communication','overview']
['communication','queues'] / ['communication','queue', id]
['communication','messages']
['communication','lead', leadId]
['communication','templates']        (template edits)
['communication','campaigns']
['communication','rules']
['communication','settings']
['leads'] / ['leads-stats'] / ['sales-pipeline']   (when status changes affect journeys)
```

▶ **Deliverables:** hook module, socket bridge, mock module, storage util, invalidation constants.

---

## 8. Shared utilities

**New file:** `apps/web/lib/communication.ts` (+ co-located tests).

| Util | Signature | Notes |
|------|-----------|-------|
| `normalizePhoneToE164(phone)` | `(phone: string) => string` | `080...` → `23480...`. Currently duplicated across files (`contacts/page.tsx:165`, `SalesPipelineCard.tsx`). Promote once here. |
| `buildWhatsAppLink(phone, message)` | `(phone, message) => string` | `https://wa.me/${e164}?text=${encodeURIComponent(message)}` |
| `openWhatsApp(link)` | `(link) => void` | `window.open(link, '_blank', 'noopener')` — the **only** place that opens WhatsApp; SE policy P2 lives here. |
| `parseTemplateVariables(body)` | `(body: string) => TemplateVariable[]` | Regex-tokenise `[Business Name]`, `[Contact Name]`, `[Area]`, `[Agent Name]` (fall back to `[Lead Phone]` etc.). |
| `substituteVariables(body, lead)` | `(body, Partial<Lead>) => string` | Replaces every token with the lead's value; leaves unknown tokens intact. |
| `countSmsCharacters(text)` | `(text) => { chars: number; parts: number; over: boolean }` | GSM-7 basic set → limit 160/part; non-GSM-7 (unicode/emoji) → 70/part. `over = chars > 160 || parts > 1` for the starter rule. |
| `estimateSmsCost(message, unitCost?)` | `(message, unitCost?) => number | null` | Display-only; `null` when provider pricing unknown. |
| `formatRelativeDate` / `formatDateTime` | reuse `date` helpers | For history/history badges. |

**SMS counter behaviour** (P8, §11):
- Show `Characters: 137 / 160` live under composer.
- When the resolved body exceeds 160 → red state + inline error `Message exceeds the 160-character limit.` and the **Activate/Send/Schedule buttons are disabled**.
- The count is computed on `substituteVariables(body, firstSelectedLead)` when audience has ≥1 contact.

▶ **Deliverables:** `lib/communication.ts` + `lib/communication.test.ts` (or `__tests__`), removal of the duplicated `formatWhatsAppUrl` in favour of the shared util.

---

## 9. Component architecture

**New folder:** `apps/web/components/communication/` (shared) and `apps/web/components/admin/communication/` (admin-only). Keep the admin/sales separation the codebase already uses.

### 9.1 Shared building blocks

| Component | File | Purpose |
|-----------|------|---------|
| `ChannelBadge` | `components/communication/ChannelBadge.tsx` | WhatsApp/SMS pill using `CHANNEL_COLORS`. |
| `MessageStatusBadge` | `components/communication/MessageStatusBadge.tsx` | Pill for any message/queue status using label/colour maps. |
| `AudienceBuilder` | `components/communication/AudienceBuilder.tsx` | Filter editor + live estimate (§10.3). Props: `{ filters, onChange, compact? }`. |
| `MessageComposer` | `components/communication/MessageComposer.tsx` | Textarea + variable insert chips + char counter + template quick-pick + preview (for first contact). Props: `{ channel, value, onChange, onPickTemplate, resolveLead, disabled }`. |
| `MessageHistoryTimeline` | `components/communication/MessageHistoryTimeline.tsx` | Vertical timeline of `OutboundMessage[]`; icon per channel, status badge, timestamp, body, sender. |
| `ContactCommunicationSummary` | `components/communication/ContactCommunicationSummary.tsx` | WhatsApp + SMS counts / last / next schedule (spec §3, §24). Props: `{ data: LeadCommunication }`. |
| `SubscriptionOverrideBanner` | `components/communication/SubscriptionOverrideBanner.tsx` | Shown when a contact is Customer/Subscribed: “Lead communication stopped; customer welcome sent.” (§21) |
| `OverMessagingNotice` | `components/communication/OverMessagingNotice.tsx` | “N contacts excluded to respect frequency limits.” from `AudienceEstimate.warnings`. (§20) |
| `StatCard` | `components/communication/StatCard.tsx` | One shared stat card so Overview and Reporting stay consistent (the codebase inlines these — introducing one within this feature is acceptable and reduces 9 duplicated blocks; keep the exact visual vocabulary from `contacts/page.tsx:530`). |
| `CommunicationNav` | `components/communication/CommunicationNav.tsx` | Tab bar for the `/admin/communication/*` sub-pages (pattern: `TabNavigation.tsx`). |

### 9.2 Admin-specific

| Component | File | Purpose |
|-----------|------|---------|
| `OverviewTab` | `admin/communication/OverviewTab.tsx` | Stat grid + “action rails” (Start WhatsApp follow-up, Compose SMS, Manage templates, Campaigns). |
| `WhatsAppTab` | `admin/communication/WhatsAppTab.tsx` | Audience + composer → create queue; list of pending/past queues; quick links to runner. |
| `QueueRunner` | `admin/communication/QueueRunner.tsx` | The working screen core (§10.4): current item card + progress + side rail. |
| `SmsTab` | `admin/communication/SmsTab.tsx` | Audience + composer + schedule/send; sent/failed/scheduled lists. |
| `SmsComposerModal` | `admin/communication/SmsComposerModal.tsx` | Modal wrapped around `MessageComposer` for quick single/multi sends. |
| `SchedulePicker` | `admin/communication/SchedulePicker.tsx` | date + time inputs (`<input type="date|time">` convention) + “later” presets; validation that `scheduledAt > now`. |
| `TemplateList` / `TemplateCard` | `admin/communication/TemplateList.tsx` / `TemplateCard.tsx` | Grid/cards with channel, body preview, status pill, actions (Activate/Deactivate/Archive/Edit). |
| `TemplateModal` | `admin/communication/TemplateModal.tsx` | Create/edit template (name, channel, `MessageComposer`, variable discovery). |
| `CampaignCard` / `CampaignModal` | `admin/communication/CampaignCard.tsx` / `CampaignModal.tsx` | Campaign list + create/edit incl. `AudienceBuilder`, channels, templates, date range, status control. |
| `RuleCard` / `RuleModal` | `admin/communication/RuleCard.tsx` / `RuleModal.tsx` | Automation rule editor (`trigger` builder, target, channel, template, wait days). |
| `SequencesTab` | `admin/communication/SequencesTab.tsx` | Lead-nurture rules + Customer Journey stages (grouped, ordered). |
| `CampaignsTab` | `admin/communication/CampaignsTab.tsx` | Campaign grid + status toggles. |
| `SmsSettingsPanel` | `admin/communication/SmsSettingsPanel.tsx` | Master switch, provider status, frequency limits, not-interested policy. |
| `ReportsTab` | `admin/communication/ReportsTab.tsx` | Metrics + hand-rolled SVG trends (follow `ObservabilityChart.tsx`, **not** recharts — it is unused). |

### 9.3 Integration edits (existing files)

| File | Change |
|------|--------|
| `components/leads/LeadDetailsDrawer.tsx` | Add `ContactCommunicationSummary` + `MessageHistoryTimeline` + `SubscriptionOverrideBanner` in a “Communication” section. |
| `app/admin/contacts/page.tsx` | Add WhatsApp/SMS/last-contact columns to the table (from `LeadCommunication` or piggyback on existing row data); reuse shared `buildWhatsAppLink`. |
| `app/dashboard/sales/follow-ups/page.tsx` | Add a link/section to `/dashboard/communication`; optionally surface WhatsApp-due items. |
| `components/admin/AdminLayout.tsx` | Sidebar entry (§6). |
| `app/layout.tsx` | Mount `CommunicationSocketBridge` (role-gated to admin/sales via existing auth context). |

▶ **Deliverables:** all components above with the exact props listed; integration edits.

---

## 10. Screen-by-screen UX specification

### 10.1 `/admin/communication` — Overview (§12)

- **Stat grid (9 cards):** Total contacts · WhatsApp eligible · WhatsApp follow-ups pending · WhatsApp sent · SMS sent · SMS pending · Failed SMS · Scheduled messages · Active campaigns. Use `useCommunicationOverview` + shared `StatCard`.
- **Action rails (make the system actionable, not passive):**
  - “Start WhatsApp Follow-up” → `/admin/communication/whatsapp`
  - “Compose SMS” → `/admin/communication/sms`
  - “Manage Templates” → `/admin/communication/templates`
  - “Create Campaign” → `/admin/communication/campaigns`
- **Sections below:** Active queues (mini progress bars), Recent sent messages, Failed SMS (with retry).
- Empty states follow the existing convention (muted icon + title + helper + CTA).

### 10.2 `/admin/communication/whatsapp` — WhatsApp hub

Three stacked blocks / tabs (`Tabs` via `CommunicationNav`-style local state):
1. **Create follow-up:** `AudienceBuilder` + `MessageComposer` (WhatsApp channel) + template quick-pick → **[Start WhatsApp Follow-up]** → creates queue → navigates to `/whatsapp/queue/[queueId]`.
   - Show **“47 contacts selected”** chip from the estimate before enabling the start button.
   - Over-messaging notice from estimate warnings.
2. **Pending queues:** cards with progress (`completedItems/totalItems`), status pill, resume button → queue runner.
3. **Sent messages:** paginated list (`useCommunicationMessages({ channel: 'WHATSAPP' })`) with `MessageHistoryTimeline` per row expand.

### 10.3 `AudienceBuilder` (reusable) — §14

- Filter groups (accordion or segmented rows):
  - **Status** — multi-select chips. Options come from `/communication/status-options` (configurable, as returned), labelled with maps.
  - **Salesperson** — multi-select of active agents/affiliates.
  - **Location/Area** — multi-select locations.
  - **Date added** — preset pills (Today / This week / This month / Custom), custom shows two `<input type="date">`.
  - Toggles: “Only contacts with phone”, “Exclude subscribed/customers” (default ON for marketing), “Exclude not-interested” (bound to policy).
- **Live estimate:** `useAudienceEstimate` (debounced 400ms via existing `useDebounce`). Renders `Contacts selected: N` (prominent) + `Would be excluded by frequency rules: M` (amber) + textual warnings.
- Structure is a form state object typed as `AudienceFilter`, lifted to parent; `AudienceBuilder` is controlled.

### 10.4 `/admin/communication/whatsapp/queue/[queueId]` — Queue Runner (§6–7)

Layout: left = working card, right = remaining items rail (hidden on mobile, stack below).

**Working card (the “current item”):**
```
2 of 47 remaining
[Progress bar: 4/47 completed]
───────────────
ABC Restaurant                    [Interested]
080XXXXXXXX (tap to copy)
Salesperson: John · Apo
───────────────
Message ready:
  "Hi, thanks again for your interest in VEMTAP..."
[Copy]  [Open WhatsApp]     ← opens wa.me link (P2)
[✓ Mark as Sent]  [Skip]
```
- Card shows the **first `PENDING` item**; after `Open WhatsApp` is clicked, call `open` action → status `OPENED` → **[Mark as Sent]** enabled (was disabled). This enforces **P1: you cannot mark sent without opening**.
- After `Mark as Sent` → `sent` action → optimistic advance to next item; persist resume position.
- `Skip` → `skip` action (records nothing as sent), advance.
- Finish state: confetti-free but celebratory card “All done — 47 contacts worked through” + “View sent messages” + “Start another follow-up” links.
- Refresh-safe: on mount, resume to first `PENDING` (or stored position if still pending) — §7.3.
- Shows queue status pill + Pause/Cancel (admin only) when `ACTIVE`.

**Sales-team entry:** same runner is driven from `/dashboard/communication` for the sales user’s own queues (“WhatsApp follow-up due” items), identical component.

### 10.5 `/admin/communication/sms` — SMS hub (§9–11)

Blocks:
1. **Compose & send:** `AudienceBuilder` + `MessageComposer` (SMS) with live counter (`137 / 160`) + cost estimate + `SchedulePicker` → **[Send Now]** or **[Schedule]**.
   - Buttons disabled if `countSmsCharacters(...).over`, audience is 0, SMS disabled, or provider not configured (each with a tooltip explaining why).
   - Scheduling validation: `scheduledAt > now`, and if a rule/sequence would also fire in the same window for the same contact, show the over-messaging notice.
2. **Scheduled:** list with “Cancel” action.
3. **Sent (Delivered/Pending):** paginated with status badges & retry for failed.
4. **Failed:** filterable; “Retry” triggers `PATCH /communication/messages/:id`.

### 10.6 `/admin/communication/templates` — Template manager (§15–16)

- Grid of `TemplateCard`s grouped/filterable by channel & status.
- `TemplateModal` create/edit: name, channel, body via `MessageComposer`, variable insert chips (`[Business Name] [Contact Name] [Area] [Agent Name]`), live char counter (**SMS only, after variable substitution**), and auto-discovered variables preview.
- Row actions: Activate / Deactivate / Archive / Edit / Delete (delete requires confirm via `ConfirmationModal`-style modal; archive is the soft path).
- Search box + channel filter pills.

### 10.7 `/admin/communication/campaigns` — Promotions (§19)

- Campaign cards: name, status pill, audience summary (N selected), channels chips, date range, template bodies, progress (for active campaigns).
- Create/edit `CampaignModal`: `AudienceBuilder` + channel checkboxes + template multi-select (filtered by channel) + start/end `SchedulePicker` + status.
- Status control: Activate (requires start date reached or imminent + audience > 0 + ≥1 template), Pause, End, Archive.

### 10.8 `/admin/communication/sequences` — Automation (§17, §18, §22, §23)

Two groups (tabs or sections):
1. **Lead Nurture Rules** (`AutomationRule[]` target `LEAD`):
   - Card per rule: trigger (e.g. “When status becomes Interested”, “Still Interested & not subscribed after 2 days”), channel, template, enabled toggle.
   - Editor: trigger builder → condition builder (`status`, `waitDays`, `andNotSubscribed`) → channel → template → save.
   - Visual note: rules targeting WhatsApp create **queue items / pending tasks**, rules targeting SMS send automatically.
2. **Customer Journey** (target `CUSTOMER`): ordered stages — Welcome → Activation → Tips → Feature Education → Referral → Renewal Reminder → Win-back. Each stage: wait days + channel + template. Reorder via up/down or `@dnd-kit` (already a dependency). Stage tags show on customer contacts.
3. Not-interested policy toggle lives in Settings (§10.9), shown here as a hint link.

### 10.9 `/admin/communication/settings` — Controls (§20, §23, §9/§11 cost)

- **Global:** `SMS enabled` (master), `Marketing paused` (kill-switch with amber banner state on all pages), provider status chip.
- **Frequency:** `frequencyMaxPerWindow` + `frequencyWindowDays` number inputs (e.g. max 2 messages per 7 days) with a sanity example below (“John in Apo will hear from you at most twice a week”).
- **Not-interested policy:** radio `QUIET` (no further marketing) vs `RE_ENGAGEMENT` (low-frequency re-engagement later).
- **Auto-SMS on status:** dropdown (e.g. on `INTERESTED`, send ack) — respects master switch.
- Every change: optimistic update + `showToast` confirmation; `PATCH /communication/settings`.

### 10.10 `/admin/communication/reports` — Performance (§26)

- WhatsApp block: queued / sent / pending / marked-as-sent counts.
- SMS block: sent / delivered / failed / replies (when supported).
- Conversion block: leads contacted → subscribed; conversion after communication.
- Trend line via hand-rolled SVG (`ObservabilityChart` pattern) — date range pills (7d/30d/90d).

### 10.11 `/dashboard/communication` — Sales team view (§25)

Simple, actionable:
- “Today's Follow-ups” cards: business name, status pill, communication info (WhatsApp due / SMS scheduled), **[Open WhatsApp]** (jobs into the queue runner) or “SMS scheduled — 21 Aug”.
- Segmented by channel/urgency: **WhatsApp due now** / **SMS scheduled** / **Follow-up required**.
- Keeps the sales user out of admin settings — no templates, rules, campaigns here.

---

## 11. Key end-to-end flows

### Flow A — Admin WhatsApp follow-up (Phase 1 MVP)
1. `/admin/communication` → **Start WhatsApp Follow-up**.
2. `AudienceBuilder`: statuses=`[INTERESTED]`, location=`[Apo]`, exclude subscribed ON → estimate “47 contacts selected”.
3. Pick template (or type message) → counter/preview resolves against first contact.
4. **[Start WhatsApp Follow-up]** → `POST /communication/queues` → navigate to runner.
5. Runner shows item 1 → reference check (`Phone` visible), **[Open WhatsApp]** → `open` action (recorded) → WhatsApp opens in new tab with prefilled `wa.me` link.
6. User sends in WhatsApp → back to VEMTAP → **[✓ Mark as Sent]** → `sent` action → history entry created → advance to item 2.
7. Progress bar updates; on complete show summary; every event visible in per-contact `MessageHistoryTimeline`.

### Flow B — SMS send/schedule (Phase 2)
1. `/admin/communication/sms` → audience + template (SMS) → counter `137/160`.
2. Schedule now → confirm cost estimate (provider pricing) → Send → status SENT/DELIVERED by event; schedule later → SCHEDULED, cancelable.
3. Delivery failure → FAILED list → Retry.

### Flow C — Subscription override (Phase 2)
1. A contact’s status changes to Customer/Subscribed (existing `useUpdateLead`/`useUpdatePipelineStage`).
2. Invalidation graph refreshes; `SubscriptionOverrideBanner` appears on the contact; pending queue/SMS items for that lead are cancelled by backend; welcome message scheduled.
3. Back-end confirmation surfaces as a toast (“Lead communication stopped · Welcome scheduled”).

### Flow D — Campaign (Phase 3)
1. Create campaign (audience + channels + templates + window) → ACTIVE.
2. Eligible-only dispatch: for WhatsApp → queue items created; for SMS → scheduled/sent by engine. Over-messaging auto-excludes.
3. Campaign progress live on card; End/Archive on expiry.

---

## 12. Validation & edge cases

- **Zod schemas** (`lib/communication-validation.ts`): `templateSchema` (name≥1, channel enum, body≥3, no over-limit SMS when channel=SMS), `campaignSchema` (end ≥ start, ≥1 channel, ≥1 template, audience not empty), `queueSchema` (message non-empty, audience not empty), `scheduleSchema` (`scheduledAt > now`).
- Inline field errors styled like existing forms (`Input` `error` prop); submit buttons show `isLoading` + `Loader2`.
- **Phone missing:** audience builder default-excludes; if user still reaches a row without phone, WhatsApp card shows disabled state “No phone number”.
- **Personally identifiable info:** phone numbers displayed in full on queue runner (needed to verify recipient), but masked in list rows unless expanded (detail drawer). Keep tasteful.
- **Empty audience:** start/send disabled with helper text.
- **Queue status concurrency:** disable actions on stale items (item fetched with status already `SENT`) — refetch + advance gracefully if another tab completed it (socket event handles this).

---

## 13. Real-time updates

`useCommunicationSocket.ts` mirrors `useNotificationSocket.ts`:

```ts
const socket = io(`${getSocketBaseUrl()}/communication`, { transports: ['websocket', 'polling'], withCredentials: true });
socket.on('communication:queue-updated', (payload) => {
  qc.invalidateQueries({ queryKey: ['communication', 'queue', payload.queueId] });
  qc.invalidateQueries({ queryKey: ['communication', 'queues'] });
  qc.invalidateQueries({ queryKey: ['communication', 'overview'] });
});
```

Mount via `components/CommunicationSocketBridge.tsx` in `app/layout.tsx` (also invalidates on `message-status` and `sms-delivery`). Guard by auth role so non-sales roles don’t open the socket.

---

## 14. Role-based access

| Capability | Admin / Super Admin | Affiliate / Agent | Line Manager / Sales Exec |
|------------|---------------------|-------------------|---------------------------|
| Overview, reports, settings, templates, campaigns, rules | ✅ | ❌ | ❌ |
| Create WhatsApp queue / run queue | ✅ (any queue) | ✅ (own leads) | ✅ (team leads) |
| Send / schedule SMS | ✅ | `per settings` | `per settings` |
| Mark WhatsApp sent | ✅ | ✅ (own) | ✅ (team) |
| Cancel / pause queue | ✅ | own only | own/team only |

Enforce at UI level (hide/disable) with the existing role pattern (`user?.role` checks + sidebar `showTo` arrays). Backend must enforce authoritatively.

---

## 15. Mock strategy

- Dev/test mode `NEXT_PUBLIC_ADMIN_MOCK === 'true'` (already gates auth + sales pipeline).
- `lib/communication-mock.ts` holds typed mock datasets: ~5 templates, 2 queues (one ACTIVE with 47 plausible items derived from lead-like fixtures), messages, 2 campaigns, 3 rules, settings.
- Hooks branch like `useSalesPipeline.ts:115`:
  ```ts
  if (IS_MOCK) return mockQueues(params);
  return api.get('/communication/queues', { params });
  ```
- Mutations mutate the module-level arrays so queue actions actually move statuses in mock mode (identical to the `useSalesPipeline` mock approach).
- E2E `authenticate(page, 'admin')` already works with mock mode.

---

## 16. Testing strategy

- **Unit (co-located or `__tests__`):** `countSmsCharacters` (GSM-7, unicode, over-limit, boundary 160/161), `substituteVariables` (missing lead values, unknown tokens left intact), `normalizePhoneToE164`, `buildWhatsAppLink` (encoding, spaces, `+`), `parseTemplateVariables`, zod schemas.
- **E2E (Playwright, `apps/web/e2e/`, follow `admin-dashboard.spec.ts` structure):**
  - `communication-overview.spec.ts` — overview stats + nav links load.
  - `whatsapp-queue-flow.spec.ts` — create queue from mock audience → runner shows first item → Open WhatsApp (assert `wa.me` link) → Mark as Sent (assert progress + disabled-before-open guard).
  - `sms-compose.spec.ts` — char counter blocks >160, template insert populates body.
  - `templates.spec.ts` — create → activate → archive.
  - `audience-builder.spec.ts` — filters update estimate count.
  - `subscription-override.spec.ts` — changing status to customer shows override banner + cancels pending items (mock).
- Add new spec tests to `package.json` scripts if a runner segment is introduced; otherwise extend existing `test:e2e`.

---

## 17. Milestones & delivery order

### Phase 1 — WhatsApp MVP (the highest-value slice)
Everything needed to run assisted WhatsApp follow-ups:
- Types, hooks, mocks, socket bridge placeholder.
- Sidebar + `CommunicationNav` + Overview + WhatsApp hub + queue runner.
- `AudienceBuilder` (status/location/salesperson/date), templates (WhatsApp only), per-contact history, contacts-table integration.
- Sales team `/dashboard/communication` page.
**Exit criteria:** an admin can select 47 Interested leads in Apo, run the queue, mark sends, and see history — demo-ready on mock data.

### Phase 2 — SMS
- SMS hub, composer + counter + schedule, message log (sent/failed/scheduled), cost warnings, master switch + provider status in settings.
- Subscription-override UX + invalidation; variable substitution + post-replacement counting.

### Phase 3 — Automation & campaigns
- Automation rules UI, campaigns, frequency guardrails (settings + over-messaging exclusion), customer journey config, not-interested policy, reports + SVG trends, full socket real-time.

### Non-sprint (backlog)
- SMS replies, WhatsApp Business API upgrade path (swap assisted → automated, no redesign — guaranteed by unified model), audience presets, bulk import.

---

## 18. Acceptance criteria (condensed)

1. **P1/P2:** In no code path can a WhatsApp message reach `SENT` without a preceding `OPENED` user action; the only side-effect to open WhatsApp is `buildWhatsAppLink` + `window.open`.
2. **P4:** Every contact surface shows sales status and communication info side by side.
3. **§11:** It is impossible to activate/send a >160-char SMS after variable substitution (button disabled + inline error).
4. **§21:** Subscribing/customer conversion visibly cancels pending leads comms and shows the override banner.
5. **§14:** Admin can select any audience combo and see a live count + over-messaging exclusions before sending.
6. **Queue resilience:** Refreshing mid-queue resumes at the first pending item; never auto-marks anything sent.
7. **Role gates:** Sales users never see admin-only screens; all role checks match backend expectations.
8. **§26:** Reports answer “is our follow-up converting?” with the WhatsApp/SMS/conversion metrics.
9. **Mock parity:** The entire feature is demoable without a backend via `NEXT_PUBLIC_ADMIN_MOCK=true`.
10. **Zero regressions:** existing admin + sales E2E suites still pass.

---

## 19. Open questions for backend / sales alignment

| # | Question | Impact |
|---|----------|--------|
| Q1 | **Lead status vocabulary:** spec’s `Follow-up Required`, `Subscribed`, `Expired`, `Lost/Closed` vs. existing `LeadStatus` (`NOT_YET/VISITED/CONTACTED/INTERESTED/NOT_INTERESTED/CUSTOMER/CONVERTED/LOST…`). Do we (a) map `Subscribed→CUSTOMER/CONVERTED`, `Expired→BusinessStatus.EXPIRED`, treat `Follow-up Required` as derived from pending follow-ups, or (b) introduce new configurable statuses via `/communication/status-options`? | Blocking for §2/AudienceBuilder. Recommend (a) + configurable labels; confirm with Sales. |
| Q2 | **Who may send SMS** (roles), and does it require per-send admin approval or credit check? | Gate + cost UI in §10.5/§14. |
| Q3 | SMS provider + per-message cost or monthly cap? Does the API return `cost` per message for the estimate? | Cost estimate + caps in Settings. |
| Q4 | WhatsApp queue item lifetime — can items expire (e.g. a lead becomes subscribed mid-queue)? Backend must cancel them; frontend just refetches. | Queue runner edge cases. |
| Q5 | Frequency guardrail scope — per contact across both channels (WhatsApp+SMS combined) or per channel? | §20 settings + estimate warnings. |
| Q6 | Does `/communication/status-options` also drive the existing `<Select>` used in lead capture forms, or only communication screens? | Reuse vs new select. |
| Q7 | Pagination strategy for the queue runner (chunked items) vs loading full 100-item queue. | Runner fetch approach. |
| Q8 | Timestamps timezone (store UTC, display Africa/Lagos?). | History display set globally. |

---

## 20. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Scope creep (schedule + campaigns + automation at once) | Phase cutover §17; each phase independently demoable. |
| Backend not ready | Full mock branch from day one; UI is contract-complete before backend exists. |
| 160-char rule mismatch with provider segmentation | Start strict single-part enforcement; keep `parts` in `countSmsCharacters` for later multi-part handling. |
| Long queues abandoned halfway | Resume persistence §7.3 + socket progress + “Continue” CTA on overview. |
| Over-messaging complaints | Guardrails default-on (2/7 days), kill-switch in Settings, warning surfaces at every send point. |
| Duplicate WhatsApp helpers drifting | Single util module (`lib/communication.ts`) used everywhere; delete local copies. |
| Recharts temptation | Stick to hand-rolled SVG trend (established convention); recharts remains unused. |

---

## 21. “Definition of done” for each PR

- Types + hooks added in the correct folders, exported names match plan.
- Mock branch included when the feature has UI without a live backend.
- `useToast` success flows + error handling (no silent failures).
- Loading/empty/error states on every fetch surface.
- `pnpm --filter @vemtap/web lint` and `pnpm --filter @vemtap/web build` pass.
- Relevant unit tests (utils/validation) + Playwright specs added or updated.
- Manual demo script (mock mode) included in the PR description.