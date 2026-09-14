# CA COPILOT — FINAL INTEGRATION SPECIFICATION

## IMPORTANT

This document is the authoritative implementation specification
for the final integration phase.

Read this ENTIRE document before modifying any code.

Do not:

- rebuild working architecture
- introduce mock data
- invent APIs
- modify working Make workflows unnecessarily
- replace Google Sheets
- expose secrets
- break existing functionality

The goal is to make the existing CA Copilot application
fully live and production-like by integrating the existing
frontend, backend, Google Sheets database, and Make workflows.

BEGIN BY AUDITING THE EXISTING CODEBASE.

You are now working on the FINAL PRODUCT INTEGRATION PHASE of my application.

PROJECT NAME:
CA Copilot — AI Client Work Intake & Compliance Assistant

IMPORTANT:
This is NOT a greenfield project.
Do NOT rebuild the application.
Do NOT replace the existing architecture.
Do NOT create mock/demo data.
Do NOT create fake APIs.
Do NOT redesign the backend architecture unnecessarily.
Do NOT replace working integrations with simulated behavior.

Your job is to take the EXISTING application, inspect it thoroughly, understand the existing implementation, and finish the integration so the dashboard becomes a genuinely LIVE working product.

==================================================

1. # PRODUCT PURPOSE

CA Copilot is an AI-powered client work intake, document intelligence, compliance-readiness and reminder assistant for a Chartered Accountant firm.

Core promise:

"Know what’s received.
Know what’s missing.
Know what’s wrong.
Know what needs attention."

The product should answer:

1. What should this client have submitted?
2. What did they actually submit?
3. Is what they submitted correct?
4. What is unresolved?
5. What should the CA/team do next?

Architecture principle:

AI interprets.
Rules decide.
CA approves.
System remembers/records.

CA Copilot is NOT intended to replace:

- Tally
- Excel
- Gmail
- GST portal
- Income Tax portal
- accounting software
- CA professional judgement

It is an AI operations layer on top of the CA firm's existing workflow.

================================================== 2. CURRENT ARCHITECTURE — DO NOT BREAK THIS
==================================================

The application already has:

FRONTEND:

- React 19
- Vite
- Tailwind
- Lucide
- Recharts
- Existing polished CA Copilot dashboard UI

BACKEND:

- Node/TypeScript backend
- API under /api/v1
- Repository abstraction
- MemoryRepository
- GoogleSheetsRepository
- GoogleSheetsUnitOfWork
- Business-rule layer
- Firm scoping
- Validation
- Audit logging

DATABASE:
Google Sheets workbook:

CA_Copilot_DB

There are EXACTLY 9 sheets.

DO NOT add another sheet unless there is a genuine schema requirement and you first explain why it is absolutely necessary.

Existing sheets:

1. FIRMS
2. CLIENTS
3. DOCUMENT_REQUIREMENTS
4. PERIOD_REQUIREMENTS
5. DOCUMENTS
6. ALERTS
7. REMINDERS
8. AUDIT_LOG
9. SETTINGS

The production repository mode is:

REPOSITORY_MODE=sheets

Default firm:

FIR-001

The existing Google Sheets integration is already working.

DO NOT replace Google Sheets with another database.

================================================== 3. LIVE FIRM DATA
==================================================

Current authoritative firm:

Firm ID:
FIR-001

Firm:
Vertex & Associates

Firm type:
Chartered Accountants

Timezone:
Asia/Kolkata

The CLIENTS sheet contains 10 synthetic clients.

The data currently exists in Google Sheets and must be treated as the source of truth.

Do NOT hardcode these clients into the frontend.

The frontend must retrieve them through the backend API.

================================================== 4. CURRENT LIVE BACKEND API
==================================================

Base:

/api/v1

Existing GET endpoints include:

GET /clients
GET /clients/:id
GET /documents
GET /documents/:id
GET /alerts
GET /reminders
GET /compliance
GET /dashboard
GET /inbox
GET /audit-log
GET /settings

Existing POST endpoints include:

POST /documents
POST /documents/:document_id/review
POST /reminders
POST /webhooks/document-intake
POST /webhooks/reminder-send

Existing PATCH endpoints include:

PATCH /documents/:document_id
PATCH /alerts/:id
PATCH /reminders/:id

Reminder actions include:

POST /reminders/:id/approve
POST /reminders/:id/send
POST /reminders/:id/cancel

The backend owns business rules.

The frontend must NOT duplicate important business logic that belongs in the backend.

================================================== 5. CRITICAL LIVE BACKEND RULES
==================================================

The backend already has strict firm scoping.

Every dashboard/API operation must respect:

FIR-001

Do NOT bypass firm scoping.

Do NOT introduce frontend-only filtering that creates the illusion of firm isolation.

The backend is authoritative.

The frontend displays backend results.

================================================== 6. CURRENT COMPLIANCE ENGINE
==================================================

The compliance engine is already live.

For August 2026 and FIR-001 there are:

50 requirement items
6 on track
44 missing
0 review
0 pending
4 not required

Current compliance:

12% on track

These values must come from the live API.

DO NOT hardcode "12%" or any of these numbers in the dashboard.

If Google Sheets changes, the dashboard must reflect the changed values.

================================================== 7. MAKE AUTOMATION — WORKFLOW 1
==================================================

Workflow 1 is already built and tested.

Name:

CA Copilot Document Intake

Current flow:

1. Gmail — Watch Emails
2. Gmail — List Attachments
3. Google Drive — Archive Attachment
4. Google Drive — Get File Checksum
5. Google Drive — Upload a File
   - conversion enabled to Google Docs
6. Google Drive — Make an API Call
   - exports converted Google Doc as text/plain
7. Make AI Toolkit — Classify Document
8. HTTP → CA Copilot Backend
9. Temporary file cleanup

Purpose:

Incoming client email
→ attachment
→ archive
→ checksum
→ text extraction
→ AI classification
→ backend
→ Google Sheets
→ dashboard

The workflow has already successfully processed a real test email.

The classifier successfully extracted:

client_company_name
document_type
applicable_period
financial_year
confidence

Example successful classification:

Client:
Quantum Bridge Technologies Private Limited

Document:
Sales Register

Period:
August 2026

Financial Year:
2026-27

Confidence:
0.92

The backend correctly detected duplicate documents when the same test document was processed again.

This is expected behavior.

IMPORTANT:

Do NOT rebuild Workflow 1.

Do NOT add another OCR service.

Do NOT add PDF Vector.

Do NOT add Make AI Content Extractor.

Do NOT add Data Store.

Do NOT add another Google Sheets persistence layer.

Do NOT introduce another API key.

The Gmail trigger is a polling trigger and currently runs at the minimum available interval on the current Make plan.

That limitation is ACCEPTED FOR NOW.

Do NOT waste implementation time trying to make Gmail Watch Emails instant.

================================================== 8. MAKE AUTOMATION — WORKFLOW 2
==================================================

Workflow 2 is also already built and tested.

Name:

CA Copilot Client Reminder & Dispatch

Current flow:

1. HTTP GET backend reminders
2. Iterator over data[]
3. Filter:
   status == Approved
4. Gmail — Send approved reminder
5. HTTP POST:
   /api/v1/reminders/:id/send

The workflow was successfully tested end-to-end.

Reminder lifecycle:

Draft
→ Pending Approval
→ Approved
→ Sent

Human approval is REQUIRED.

The backend /send endpoint:

- verifies reminder exists
- verifies firm scope
- verifies Approved status
- changes status to Sent
- sets sent_at
- preserves approved_by
- creates immutable AUDIT_LOG entry
- action = REMINDER_SENT

IMPORTANT:

Do NOT redesign Workflow 2.

Do NOT send reminders directly from the frontend.

Do NOT bypass the approval state.

The dashboard should call the backend.

The backend should remain authoritative.

================================================== 9. EXISTING FRONTEND
==================================================

The dashboard already contains these primary navigation sections:

Dashboard
AI Inbox
Clients
Documents
Alerts
Reminders
Reports
AI Copilot
Settings

The visual direction is already established:

Premium CA-firm SaaS.

Warm:

- cream
- brown
- neutral
- professional

Avoid:

- generic blue SaaS appearance
- excessive gray
- excessive cards
- excessive vertical scrolling
- childish AI visuals
- unnecessary gradients
- flashy effects

Maintain the existing visual language unless a change is required for functionality.

Do NOT redesign the entire application.

================================================== 10. THE MAIN OBJECTIVE NOW
==================================================

The application currently looks like a dashboard, but the FINAL PHASE is to make every important part of it genuinely LIVE.

The user should be able to interact with the dashboard and see the actual state of:

Google Sheets
↓
Backend
↓
Dashboard

and:

Dashboard
↓
Backend
↓
Make
↓
Gmail
↓
Backend
↓
Dashboard

There must be NO fake frontend state pretending that an action succeeded.

================================================== 11. FIRST STEP — AUDIT BEFORE MODIFYING
==================================================

Before changing code:

1. Inspect the entire frontend structure.
2. Inspect the backend structure.
3. Inspect:
   - dataService.ts
   - apiClient.ts
   - repository layer
   - GoogleSheetsRepository
   - GoogleSheetsUnitOfWork
   - API route definitions
   - services
   - business rules
   - existing types/interfaces
4. Identify which pages already consume live APIs.
5. Identify which pages still use mock/static data.
6. Identify which buttons currently only show alerts or fake success states.
7. Identify mismatches between backend response schemas and frontend expectations.
8. Identify any duplicate business logic in frontend.
9. Identify any broken loading/error/empty states.
10. Identify any places where API failures silently fall back to mock data.

DO NOT modify anything until you understand the existing architecture.

Then implement the minimum necessary changes.

================================================== 12. LIVE DATA REQUIREMENT
==================================================

Every important page must use live backend data.

Dashboard:
GET /api/v1/dashboard

Clients:
GET /api/v1/clients

Client detail:
GET /api/v1/clients/:id

Documents:
GET /api/v1/documents

Document detail:
GET /api/v1/documents/:id

Compliance:
GET /api/v1/compliance

Alerts:
GET /api/v1/alerts

Reminders:
GET /api/v1/reminders

AI Inbox:
GET /api/v1/inbox

Audit:
GET /api/v1/audit-log

Settings:
GET /api/v1/settings

Do not recreate this data locally.

================================================== 13. DASHBOARD
==================================================

The dashboard must become a real operational overview.

The KPI cards must reflect live API data.

At minimum:

- Total Clients
- Documents Received
- Missing Documents
- Need Review
- Pending Approval
- Open Alerts
- Upcoming Reminders
- Compliance / On Track

Use the existing API response structure wherever possible.

Do NOT create hardcoded calculations in the frontend if the backend already provides the metric.

If the backend provides authoritative metrics, use those.

The dashboard should refresh after meaningful actions.

================================================== 14. DOCUMENTS — IMPORTANT
==================================================

The Documents page currently displays real data.

Existing examples include:

QB_August_Sales_Register.pdf
QB_August_Purchases.pdf
Meridian_August_Expenses.pdf
CA_Test_Client_Document_Packet_QB_Unit_1.pdf
Quantum_Bridge_August_2026_Sales_Register.pdf

Existing statuses include:

Valid
Review Required

Existing AI confidence values include:

98%
96%
74%
0%
92%

The Documents page currently has an eye/preview action that only displays a browser alert similar to:

"Opening preview of QB_August_Sales_Register.pdf"

THIS MUST BE FIXED.

The eye button should open a proper document review/preview experience.

However:

Do NOT invent actual PDF content if the backend does not provide the file.

Use the existing Drive file reference / document metadata where available.

If an actual preview URL/file endpoint already exists, use it.

If the backend currently only has metadata and no secure file-serving endpoint, do NOT fake a PDF viewer.

Instead implement a professional review panel/modal using the information actually available:

- filename
- document type
- client
- period
- AI confidence
- validation status
- processing status
- sender
- received timestamp
- duplicate status if available
- review state
- relevant extracted information if available

The review panel should clearly distinguish:

AI result
CA decision
System status

================================================== 15. DOCUMENT REVIEW WORKFLOW
==================================================

Documents with:

AI confidence >= 95%

may be treated according to the existing backend rule as high-confidence.

Documents below the configured threshold should remain:

Review Required

Example:

92% → Review Required

74% → Review Required

The frontend must NOT change this logic.

The backend decides.

For review-required documents, provide an appropriate CA review action.

Possible flow:

Open document
→ inspect information
→ CA approves/rejects/corrects
→ backend API
→ Google Sheets updated
→ audit log updated
→ UI refreshes

Do not silently modify the document classification from the frontend.

================================================== 16. ALERTS
==================================================

Alerts must become actionable.

Use live:

GET /api/v1/alerts

Display:

- client
- document
- period
- alert type
- severity
- message
- status
- created date
- assigned person

Provide appropriate actions where supported:

- resolve
- dismiss
- update status
- inspect related document/client

Every action must go through the backend.

Do NOT just change React state.

After an action succeeds:

1. Backend changes state.
2. Backend records audit information if supported.
3. Frontend refreshes.
4. User sees actual persisted state.

================================================== 17. REMINDERS
==================================================

The Reminders page must be fully connected to the existing backend.

Display:

- client
- document type
- period
- recipient
- subject
- status
- created date
- sent date
- approved by

Correct lifecycle:

Draft
Pending Approval
Approved
Sent
Cancelled

IMPORTANT:

Only Approved reminders may be sent.

The dashboard must never directly send Gmail.

For approval:

Frontend
→ POST /reminders/:id/approve
→ backend
→ status becomes Approved
→ audit
→ UI refresh

For sending:

The existing Make Workflow 2 is responsible for dispatch.

Do not create a second sending mechanism.

The dashboard should reflect the resulting Sent state after Make executes.

================================================== 18. CLIENTS
==================================================

Clients must use live data.

Client detail should become the central operational view for one client.

A client detail view should ideally show:

Client identity
Assigned CA
Contact information
Documents
Missing requirements
Compliance status
Alerts
Reminders
Recent activity

Example:

Quantum Bridge Technologies Private Limited

The client view should allow a CA to understand:

"What is happening with this client right now?"

without opening multiple unrelated pages.

Do not create fake client-specific numbers.

Use live API data.

================================================== 19. COMPLIANCE
==================================================

The Compliance page must use:

GET /api/v1/compliance

The page should clearly show:

Required
Received
Missing
Review Required
Not Required
On Track

The user should be able to understand compliance by:

- client
- document type
- period
- status

Use the existing backend compliance engine.

Do NOT reproduce the compliance rules in React.

If the backend says:

Not Required

display:

Not Required

Do not convert it into Missing.

If no PERIOD_REQUIREMENTS override exists, the baseline DOCUMENT_REQUIREMENTS rule applies.

CA-approved overrides remain authoritative.

================================================== 20. AI INBOX
==================================================

AI Inbox should represent incoming document/work intelligence.

It should use the live backend.

For each incoming item, show useful information such as:

- sender
- client
- document
- period
- confidence
- status
- issue
- received time

The purpose is to allow the CA to quickly understand:

"What did AI just receive and what needs my attention?"

Do not make it a generic chat screen.

================================================== 21. AI COPILOT
==================================================

AI Copilot is an important product differentiator.

DO NOT create a fake chatbot that simply returns hardcoded responses.

The eventual architecture should be:

User question
→ backend
→ live CA Copilot context
→ relevant client/document/compliance/alert/reminder data
→ AI reasoning
→ answer

Examples of intended questions:

"What is missing for Quantum Bridge for August?"

"Which clients have the most missing documents?"

"Show me documents requiring review."

"Which reminders are waiting for approval?"

"Why is Quantum Bridge only 12% compliant?"

"What should I look at today?"

"Which clients have unresolved issues?"

If the backend does not yet expose a proper AI Copilot endpoint, do NOT fabricate one and pretend it works.

Instead:

- inspect whether an existing endpoint/service exists
- if an appropriate backend extension is necessary, implement it consistently with the current architecture
- keep AI advisory
- do not allow autonomous tax decisions
- do not allow autonomous filing
- do not allow autonomous certification
- do not allow autonomous high-stakes client communication

The CA remains the decision-maker.

================================================== 22. SETTINGS
==================================================

Settings must reflect the actual SETTINGS sheet.

Important categories include:

AI thresholds
Reminder settings
Timezone
Duplicate rules
Workflow approvals
Unknown client review
Not-required approval

Do not create fake settings that don't persist.

If a setting is editable:

Frontend
→ backend
→ Google Sheets
→ audit if appropriate
→ UI refresh

================================================== 23. AUDIT LOG
==================================================

The audit log is extremely important.

The system must maintain traceability for meaningful actions.

Examples:

DOCUMENT_RECEIVED
DOCUMENT_REVIEWED
DOCUMENT_UPDATED
REMINDER_APPROVED
REMINDER_SENT
REMINDER_CANCELLED
ALERT_RESOLVED
ALERT_DISMISSED
SETTING_UPDATED

Never fake audit records in React.

Use the backend.

================================================== 24. ERROR HANDLING
==================================================

This is a LIVE application.

Do NOT hide backend errors.

Every API-driven page must have:

Loading state
Error state
Empty state
Success state

If backend is unavailable:

Show a professional error message.

Do NOT silently display fake/mock data.

If an API request fails, the UI must clearly indicate that live data could not be loaded.

================================================== 25. REFRESH / SYNCHRONIZATION
==================================================

After mutations:

- approve reminder
- cancel reminder
- review document
- update alert
- update client-related state
- update settings

the frontend must refresh the relevant live data.

Do not require the user to manually reload the browser for normal workflow changes.

Use the existing service architecture rather than scattering raw fetch() calls everywhere.

================================================== 26. API CLIENT ARCHITECTURE
==================================================

Use the existing:

apiClient.ts

and:

dataService.ts

patterns.

Do not create random API calls throughout components.

Keep API communication centralized.

Maintain consistent error handling.

Use TypeScript types.

Do not use:

any

as a shortcut to solve type errors.

If an API response schema needs adjustment, inspect the actual backend response first.

================================================== 27. NO MOCK DATA
==================================================

This is one of the most important requirements.

REMOVE/ELIMINATE any remaining mock/demo/static data from production-facing dashboard pages where live API data is available.

No:

fake clients
fake documents
fake alerts
fake compliance numbers
fake reminders
fake analytics
fake activity

The current Google Sheets dataset is the source of truth.

If there is an intentional design placeholder, label it clearly instead of pretending it is live.

================================================== 28. DO NOT CHANGE WORKING BACKEND LOGIC UNNECESSARILY
==================================================

The backend has already passed:

32/32 tests

and builds successfully.

Preserve that stability.

Before changing backend code, determine whether the requested functionality genuinely requires a backend change.

Prefer frontend integration if the required endpoint already exists.

If backend changes are required:

- make minimal changes
- preserve existing interfaces
- preserve firm scoping
- preserve audit behavior
- preserve Google Sheets persistence
- add/update tests
- run all tests
- run build

Never casually rewrite the repository layer.

================================================== 29. SECURITY
==================================================

NEVER expose:

Google service account credentials
private keys
API secrets
webhook secrets
Make credentials

in frontend code.

Never place backend .env contents into React.

Never commit secrets.

Frontend should only communicate with the public backend API.

================================================== 30. RESPONSIVENESS
==================================================

The current target is desktop-first CA-firm usage.

Maintain excellent desktop layout.

Also ensure reasonable tablet/mobile behavior.

Do not destroy the existing desktop composition simply to make every component mobile-first.

================================================== 31. UX STANDARD
==================================================

The final product should feel like a real premium B2B SaaS product.

The CA should immediately understand:

WHAT NEEDS ATTENTION.

Prioritize:

- clarity
- hierarchy
- speed
- trust
- professional appearance
- useful empty states
- obvious actions
- minimal clicks
- consistent terminology

Avoid:

- excessive animation
- decorative AI gimmicks
- giant cards
- unnecessary gradients
- excessive rounded containers
- excessive text
- meaningless charts
- fake "AI magic"

================================================== 32. IMPORTANT STATUS LANGUAGE
==================================================

Use consistent terminology.

Documents:

- Received
- Processing
- Processed
- Failed

Validation:

- Pending
- Valid
- Review Required
- Invalid

Alerts:

- Open
- In Progress
- Resolved
- Dismissed

Reminders:

- Draft
- Pending Approval
- Approved
- Sent
- Cancelled

Compliance:

- Required
- Received
- Missing
- Review Required
- Not Required
- On Track

Do not invent alternative status names unless the backend already requires them.

================================================== 33. ANALYTICS / REPORTS
==================================================

Do not fabricate analytics.

Inspect what live backend data can support.

Useful real metrics could include:

- document volume
- document processing outcomes
- missing documents
- review-required documents
- compliance by client
- alert volume
- reminder status

Only display metrics that can be calculated reliably from live data.

If a chart has insufficient data, show a professional empty state rather than fake data.

================================================== 34. CURRENT KNOWN UI BUG
==================================================

The Documents eye icon currently produces a browser alert:

"Opening preview of QB_August_Sales_Register.pdf"

This is not acceptable in the final product.

Replace it with a real professional review/preview experience using the available document information and actual file access where supported.

Do not fake a PDF viewer.

================================================== 35. DO NOT OVERBUILD
==================================================

We are trying to finish the product.

Do NOT suddenly add:

- PostgreSQL
- Supabase
- Firebase
- another database
- another OCR provider
- another automation platform
- another email provider
- another authentication system
- vector database
- RAG infrastructure
- AI agents
- autonomous tax filing
- WhatsApp automation
- payment system
- multi-tenant billing
- enterprise SSO

unless the existing project already contains them.

Those are future phases.

The immediate objective is:

MAKE THE CURRENT PRODUCT WORK.

================================================== 36. IMPLEMENTATION PROCESS
==================================================

Follow this exact sequence.

PHASE A — AUDIT

Inspect the repository and determine:

- what is already live
- what is mocked
- what is partially integrated
- what is broken
- what API endpoints already exist
- what components need modification

Do not make assumptions.

PHASE B — CONNECT

Connect remaining pages/components to the existing backend APIs.

PHASE C — ACTIONS

Make buttons actually perform backend operations where APIs already exist.

PHASE D — SYNCHRONIZATION

Refresh UI state after successful mutations.

PHASE E — ERROR STATES

Implement proper loading/error/empty/success states.

PHASE F — UX

Polish the interaction flows without redesigning the entire product.

PHASE G — VALIDATION

Run:

- TypeScript checks
- tests
- production build

Fix all errors.

================================================== 37. TESTING REQUIREMENTS
==================================================

After implementation:

1. Start backend.
2. Start frontend.
3. Verify backend health.
4. Verify frontend loads.
5. Verify dashboard uses live data.
6. Verify clients use live data.
7. Verify documents use live data.
8. Verify compliance uses live data.
9. Verify alerts use live data.
10. Verify reminders use live data.
11. Verify AI Inbox uses live data.
12. Verify settings use live data where applicable.
13. Verify mutations persist through backend.
14. Verify page refresh preserves persisted state.
15. Verify no mock data appears.
16. Run all backend tests.
17. Run frontend build.
18. Fix any console errors.
19. Fix broken API requests.
20. Verify there are no obvious UX dead ends.

================================================== 38. IMPORTANT: DO NOT TEST MAKE BY SENDING
==================================================

Do NOT send unnecessary emails.

Do NOT repeatedly rerun Make scenarios.

Do NOT generate duplicate documents.

The existing Make workflows have already been proven.

Only inspect integration compatibility.

If a live Make test is genuinely necessary, explain exactly why before doing it.

================================================== 39. SUCCESS CRITERIA
==================================================

We are DONE with this phase only when the product behaves like this:

CLIENT EMAIL
↓
Gmail
↓
Make Workflow 1
↓
Document classification
↓
CA Copilot backend
↓
Google Sheets
↓
Dashboard updates

AND:

CA creates/approves reminder
↓
Backend
↓
Make Workflow 2
↓
Gmail
↓
Backend marks Sent
↓
Google Sheets
↓
Dashboard shows Sent

AND:

CA opens Documents
↓
sees real documents
↓
opens review
↓
reviews AI classification
↓
takes supported CA action
↓
backend persists decision
↓
audit log records action
↓
dashboard refreshes

AND:

CA opens Compliance
↓
sees actual requirements
↓
sees missing documents
↓
sees Not Required overrides
↓
understands client readiness

AND:

CA opens Alerts
↓
sees real unresolved issues
↓
takes action
↓
backend persists it
↓
audit log records it

AND:

CA opens a client
↓
sees the client's real operational state
↓
documents
↓
compliance
↓
alerts
↓
reminders
↓
activity

================================================== 40. FINAL PRODUCT PRINCIPLE
==================================================

The application must NEVER give the impression that something happened when it did not actually happen.

If an email was not sent:
do not say Sent.

If a document was not persisted:
do not say Saved.

If AI classification is uncertain:
do not present it as a confirmed CA decision.

If an API fails:
show the failure.

If data is unavailable:
show that it is unavailable.

Trust is more important than visual polish.

================================================== 41. VERY IMPORTANT — BEFORE YOU FINISH
==================================================

Do NOT just tell me:

"Integration completed."

I want you to actually inspect and implement the work.

At the end, provide a concise implementation report containing:

1. Files changed
2. What was connected
3. What was already live and left untouched
4. Any backend changes
5. Any frontend changes
6. Tests run
7. Build result
8. Remaining limitations
9. Any functionality that genuinely cannot be completed without a missing backend/API capability

Do NOT claim something is working unless you actually verified it.

================================================== 42. FINAL INSTRUCTION
==================================================

START NOW.

First inspect the existing repository and architecture.

Do not ask me to explain code that you can inspect yourself.

Do not rebuild working components.

Do not introduce unnecessary technologies.

Do not create mock data.

Do not modify Make workflows unless absolutely necessary.

Do not break the 32/32 backend test baseline.

Make CA Copilot a genuinely LIVE, integrated, professional product using the existing architecture.

Work carefully, but prioritize completion and correctness over unnecessary refactoring.

BEGIN WITH THE AUDIT.
