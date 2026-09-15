🚀 CA COPILOT — ULTIMATE ANTIGRAVITY MASTER BUILD PROMPT
You are working on the existing CA Copilot production project.
Your job in this task is to make the dashboard/application side production-demo ready.
This is an existing system. Do NOT rebuild the application from scratch. Do NOT casually change the architecture. Do NOT add unnecessary features. Do NOT modify the Make workflows in this task.
The priority is:
Fix the source-document opening experience, make the demo client matching work with my real test Gmail, remove Gemini branding, clean the Copilot UI, preserve all existing functionality, and verify the dashboard/backend build.

The client demo is tomorrow, so reliability and polish are more important than adding new experimental functionality.

1. PRODUCT CONTEXT
   The product is:
   CA Copilot — AI Client Work Intake & Compliance Assistant
   Positioning:
   An AI-powered client work intake, document intelligence and compliance-readiness assistant for CA firms.

Core promise:
Know what’s received. Know what’s missing. Know what’s wrong. Know what needs attention.

The product is an operational layer over existing CA workflows.
It is NOT intended to replace:

- Tally
- Excel
- Gmail
- Google Drive
- GST portals
- Income Tax portals
- CA judgement
- statutory filing systems
  The architecture principle is:
  AI interprets. Rules decide. CA approves. System remembers/records.

2. CURRENT PRODUCTION ARCHITECTURE — DO NOT BREAK THIS
   The application already has:
   Frontend
   React 19 / Vite / Tailwind / Lucide / Recharts.
   Production frontend:
   https://ca-firm-dashboarca-copilot-frontend.onrender.com
   Backend
   Production backend:
   https://ca-copilot-backend-y6e5.onrender.com
   API prefix:
   /api/v1
   Database / source of truth
   The authoritative database is a Google Spreadsheet workbook:
   CA_Copilot_DB
   It has exactly 9 sheets.
   Do NOT add another sheet.
   Do NOT replace Google Sheets with another database.
   Do NOT create another persistence layer.
   Do NOT silently modify the schema.
3. GOOGLE SHEETS SCHEMA
   The current authoritative sheets are:
   FIRMS
   firm_id, legal_name, display_name, firm_type, primary_email, primary_phone, address, timezone, active, created_at
   Authoritative synthetic firm:
   FIR-001
   Vertex & Associates
   CLIENTS
   client_id, firm_id, legal_name, display_name, entity_type, primary_email, phone, assigned_ca, active, created_at
   Current synthetic clients include:
   CLI-001
   Quantum Bridge Technologies Private Limited
   Display name:
   Quantum Bridge
   Entity:
   Private Limited Company
   Current demo client.
   DOCUMENT_REQUIREMENTS
   50 rows:
   10 clients × 5 document types.
   Current document types:

- Sales Register
- Purchase Register
- Bank Statement
- Expense Bills
- Payroll Summary
  Monthly.
  Due day:

10. PERIOD_REQUIREMENTS
    CA-approved period-specific overrides.
    Example:
    CLI-001 / Bank Statement / 2026-08:
    Not Required
    Reason:
    Bank account inactive during August 2026.
    Important:
    Not Required is a CA-approved override. It must NEVER be inferred autonomously by AI.
    DOCUMENTS
    Schema:
    document_id, firm_id, client_id, document_type, period, filename, email_id, sender_email, received_at, drive_file_id, processing_status, validation_status, ai_confidence, created_at
    This sheet is critical for the attachment-opening fix.
    ALERTS
    alert_id, firm_id, client_id, document_type, period, alert_type, severity, message, status, created_at, resolved_at, assigned_to
    REMINDERS
    reminder_id, firm_id, client_id, document_type, period, recipient_email, subject, body, status, created_at, sent_at, approved_by
    AUDIT_LOG
    log_id, firm_id, timestamp, user, action, entity_type, entity_id, old_value, new_value, reason
    SETTINGS
    setting_id, firm_id, category, setting_key, setting_value, description, active, updated_at
11. EXISTING DOCUMENT INTAKE WORKFLOW CONTEXT
    There is already a working Make.com inbound document workflow.
    Do NOT modify it in this task.
    The workflow is:
12. Gmail Watch Emails
13. Gmail List Attachments
14. Google Drive Archive Attachment
15. Google Drive Get File Checksum
16. Google Drive Upload File with conversion to Google Docs
17. Google Drive Make API Call → export converted document as text/plain
18. Make AI Toolkit → Classify Document
19. HTTP → backend /api/v1/webhooks/document-intake
20. Trash temporary converted file
    The workflow has already been successfully tested.
    The production document intake endpoint is:
    https://ca-copilot-backend-y6e5.onrender.com/api/v1/webhooks/document-intake
    Do NOT change this workflow.
    Do NOT replace Make AI Toolkit with Gemini.
    Do NOT add PDF extraction products.
    Do NOT add Data Store.
    Do NOT add AI Agent modules.
    Do NOT redesign Workflow 1.
    That is Maia's job later.
21. CURRENT LIVE TEST SITUATION
    A test PDF was sent to the monitored Gmail account from:
    ampletechstudio@gmail.com
    The subject was:
    2026-08 Sales Register Submission
    The classifier correctly identified:
    Document type:
    Sales Register
    Period:
    2026-08
    The workflow successfully executed.
    However, because the sender address did not match the synthetic client email in the CLIENTS sheet, the document was stored as an unknown client:
    CLI-UNKNOWN
    The UI currently has an inconsistency where one area says something equivalent to:
    Client matched

while the actual document card indicates:
Unknown Client (ampletechstudio@gmail.com)

This is misleading.
Fix this UX. 6. TASK A — FIX "OPEN ATTACHMENT / SOURCE DOCUMENT"
This is the highest-priority dashboard fix.
Currently, documents have a drive_file_id, but the user cannot properly open the original source attachment from the dashboard.
We need a real, useful source-document action.
Desired behavior
Whenever a document has a valid:
drive_file_id
the dashboard/document review UI should expose an obvious action such as:
Open Source Document

or
View Source

Use the existing stored Google Drive file ID.
The action should open the actual archived source document in Google Drive.
Prefer opening the original archived file rather than the temporary converted Google Doc.
The Make workflow archives the original attachment in Drive and later creates a temporary converted file for text extraction.
The temporary converted file is deleted.
Therefore:
DOCUMENTS.drive_file_id should point to/use the archived source document whenever available.

7. SOURCE DOCUMENT URL HANDLING
   Do NOT blindly assume a URL already exists.
   Inspect the current backend repository/model/API.
   Determine the cleanest architecture.
   Preferred behavior:
   Option A — backend returns a source URL
   The backend can derive a Google Drive viewer URL from the stored Drive file ID and expose it to the frontend.
   For example, conceptually:
   https://drive.google.com/file/d/{DRIVE_FILE_ID}/view
   Do not hardcode a particular document ID.
   Option B — frontend derives it
   Only do this if it fits the existing architecture cleanly and does not violate existing API boundaries.
   The important requirement is:
   The frontend must never invent document IDs.

Use the authoritative drive_file_id. 8. OPEN DOCUMENT UX REQUIREMENTS
The button should:

- be visible
- be understandable
- look like a real document action
- use an appropriate Lucide icon
- open the source document in a new browser tab
- not navigate the user away from the dashboard
- gracefully handle missing drive_file_id
- gracefully handle malformed/invalid IDs
- not crash the review page
  If drive_file_id is missing:
  Show something like:
  Source document unavailable

rather than showing a broken link.
Do NOT fake the button.
Do NOT create a fake local PDF.
Do NOT embed an imaginary document viewer. 9. IMPORTANT: DO NOT CONFUSE METADATA WITH THE SOURCE FILE
The current Documents action icon has previously been intended as a metadata/reference/copy action.
Do not remove useful metadata functionality unnecessarily.
If there is currently an action for copying document metadata/reference, preserve it.
Add the source-document action separately if appropriate.
The user needs to be able to distinguish:

- Copy metadata/reference
- Open actual source document

10. TASK B — FIX DEMO CLIENT MATCHING
    For tomorrow's demo, I need my real test Gmail:
    ampletechstudio@gmail.com
    to function as the email address for the synthetic demo client.
    The intended demo client is:
    Quantum Bridge
    CLI-001
    Legal name:
    Quantum Bridge Technologies Private Limited
    This is a synthetic/demo client, not a real client.
    The purpose is to allow me to send a real test email from my Gmail and have the existing deterministic client matching recognize it as Quantum Bridge.
11. IMPORTANT ABOUT THE EMAIL CHANGE
    The Google Sheet is authoritative.
    Therefore, do NOT merely hardcode:
    ampletechstudio@gmail.com
    inside React.
    Do NOT create a frontend-only mapping.
    Do NOT create a hidden hardcoded client.
    Do NOT bypass the backend's client matching logic.
    Instead, inspect how client matching currently works.
    The cleanest solution is to update the authoritative demo client configuration/data so:
    CLI-001
    has:
    primary_email = ampletechstudio@gmail.com
    if the environment and access allow this safely.
    If production Sheets cannot be modified from the code environment, then:
12. clearly identify that limitation
13. implement no fake frontend workaround
14. provide the exact authoritative data change required
15. ensure the backend matching logic already supports it
    Do not compromise production integrity just to fake the demo.
16. DO NOT BREAK SYNTHETIC DATA
    The demo environment must remain clearly synthetic.
    Do not rename:
    Quantum Bridge Technologies Private Limited
    Do not remove other clients.
    Do not delete existing document requirements.
    Do not reset existing August compliance data.
    Do not wipe the Sheets.
    Do not seed duplicate clients.
    Do not create:
    CLI-011
    just for this test.
    The intended mapping is:
    ampletechstudio@gmail.com → CLI-001 Quantum Bridge
17. UNKNOWN CLIENT HANDLING MUST ALSO BE CORRECT
    The system must continue supporting genuinely unknown senders.
    For example:
    If an email comes from an address that does NOT belong to any known client:
    the document should remain:
    CLI-UNKNOWN
    and should require review.
    Do not make every sender become Quantum Bridge.
    Only the configured demo client address should match Quantum Bridge.
18. FIX THE CURRENT UI INCONSISTENCY
    There is currently a confusing state where the intake UI can appear to say:
    Client matched

while the document itself is:
Unknown Client

This must be fixed.
The UI should derive its status from actual authoritative data.
Examples:
Matched
Show:
Client matched

and:
Quantum Bridge

if client_id = CLI-001.
Unknown
Show:
Unknown Client

and:
CLI-UNKNOWN

if no client match exists.
Do not show contradictory statuses. 15. TASK C — REMOVE ALL GEMINI MODEL BRANDING FROM COPILOT UI
The user explicitly does NOT want the AI model name displayed in the product.
Therefore:
REMOVE

- Gemini
- Gemini 3.5 Flash
- Gemini 3.7 Flash
- model names
- model badges
- provider labels
- technical AI model references
  from the visible Copilot UI.
  The user should see:
  CA Copilot

or:
CA Copilot Assistant

NOT:
Gemini 3.5 Flash

NOT:
Powered by Gemini

NOT:
Gemini AI

NOT:
Model: Gemini...

16. IMPORTANT — DO NOT REMOVE GEMINI FROM THE BACKEND
    This task is about UI branding.
    Do NOT remove the existing Gemini provider from the backend simply because the name should not be visible.
    The current backend may legitimately use Gemini for Copilot generation.
    Keep the backend provider architecture intact.
    The product UI should abstract the underlying model.
    Think of it as:
    User sees CA Copilot.
    Backend decides which AI provider/model is used.

17. SEARCH THE ENTIRE FRONTEND FOR MODEL BRANDING
    Do not only fix the obvious badge.
    Search the entire frontend for strings such as:

- Gemini
- gemini
- Gemini 3.5
- Gemini 3.7
- model
- AI model
- powered by
- provider
  Check:
- Copilot drawer
- header
- sidebar
- empty state
- loading state
- error state
- suggestion cards
- tooltips
- accessibility labels
- footer
- debug labels
- hidden development UI accidentally rendered in production
  Remove only user-facing model/provider branding.
  Do not unnecessarily rename backend variables.

18. TASK D — CLEAN THE COPILOT UI
    The current Copilot has a static preloaded welcome message.
    The user does NOT want the Copilot to look like a conversation has already happened when they just opened it.
    Instead, make the initial state feel like a polished dashboard assistant.
19. DESIRED COPILOT EMPTY STATE
    When the user opens CA Copilot with no conversation:
    Do NOT show a fake chat bubble like:
    Good day, Partner. How can I assist...

as if the assistant already sent a message.
Instead use a clean empty state.
Something conceptually like:
CA Copilot
Your assistant for Vertex & Associates.
Ask about:

- clients
- documents
- compliance
- alerts
- reminders
- dashboard operations
  What would you like to do?
  [What documents are missing?]
  [Show clients needing attention]
  [Explain this dashboard]
  The exact copy can be improved, but the UX should feel like a modern professional dashboard assistant.

20. COPILOT EMPTY STATE REQUIREMENTS
    It must:

- not create a fake assistant message
- not automatically send a query
- not call the backend when merely opening the drawer
- not consume AI quota when merely opening the drawer
- not trigger Gemini
- not fetch unnecessary Sheets data solely to display the empty state
- remain visually consistent with the existing premium CA dashboard
- retain useful suggestion chips if appropriate

21. COPILOT MUST REMAIN FUNCTIONAL
    Do NOT break existing Copilot functionality.
    When the user actually types:
    What documents are missing?

the system should still send the request normally.
When the user types:
Why is Quantum Bridge only 60% compliant?

the system should still answer using authoritative backend data.
When the user says:
hi

the existing greeting handling should remain intact.
Do not regress the dedicated greeting behavior. 22. DO NOT IMPLEMENT THE FULL JARVIS AGENT YET
Very important.
The broader product vision is eventually:
A dashboard-wide JARVIS-like CA assistant capable of reading dashboard state, navigating the dashboard, assisting users, creating clients, preparing reminders, updating records with confirmation, etc.

But DO NOT implement that entire architecture in this task.
That will be a later build.
For this task:

- clean the Copilot UI
- preserve current Copilot
- remove model branding
- remove fake initial chat
- ensure real queries still work
  Do not turn this into a massive agent rewrite.

23. TASK E — PRESERVE EXISTING COPILOT SAFETY
    Current intended principle:
    AI interprets. Rules decide. CA approves. System remembers/records.

Do not weaken this.
The Copilot must not autonomously:

- send emails
- approve reminders
- certify tax positions
- file returns
- override CA-approved requirements
- mutate financial data without proper authorization
- bypass audit logging
  Do not add autonomous mutations in this task.

24. EXISTING COPILOT ARCHITECTURE
    Inspect the current implementation before changing anything.
    Relevant areas include:
    backend/src/services/ai/aiProvider.ts
    backend/src/services/ai/geminiProvider.ts
    backend/src/services/copilotIntentService.ts
    backend/src/services/deterministicCopilotFormatter.ts
    backend/src/services/copilotService.ts
    backend/src/controllers/copilotController.ts
    Frontend areas include:
    AskCopilotDrawer.tsx
    apiClient.ts
    dataService.ts
    Do not assume the exact current path if the repository has changed.
    Search the actual codebase first.
25. EXISTING COPILOT BEHAVIOR THAT MUST NOT REGRESS
    Previously fixed:
    Greeting handling
    Queries such as:

- hi
- hello
- thanks
- good morning
  should not trigger a full compliance analysis.
  They should receive a conversational response.
  Preserve this.
  No automatic query on drawer open
  Opening the Copilot drawer must NOT automatically submit:
  What documents are missing for August 2026?

or any other query.
Preserve this.
Deterministic fallback
If AI generation fails, the existing deterministic fallback behavior should remain.
Do not remove it. 26. DASHBOARD DATA MUST REMAIN AUTHORITATIVE
The dashboard uses backend/Google Sheets data.
Do not create fake frontend calculations.
Existing dashboard metrics include:

- Missing Documents
- Need Review
- Pending Approval
- Automatically Processed
- Clients
- Documents Received
- Open Alerts
- Upcoming Reminder
- Compliance
  Preserve their existing logic.
  For example:
  Missing Documents
  Represents missing requirement slots, NOT number of clients.
  For August 2026:
  50 total requirement slots.
  Current state:
- 6 on track
- 44 missing
- 4 not required
- 12% on track
  Do not alter this calculation merely to make the demo look better.

27. IMPORTANT DEMO DATA CONTEXT
    Quantum Bridge currently demonstrates:
    August 2026
    5 requirement types:
1. Sales Register
1. Purchase Register
1. Bank Statement
1. Expense Bills
1. Payroll Summary
   Bank Statement is CA-approved:
   Not Required

Therefore Quantum Bridge currently has:
3/5 on track
2 missing
60% compliance
The missing items are:

- Expense Bills
- Payroll Summary
  Do not alter these unless explicitly requested later.

28. SOURCE DOCUMENT TEST CASE
    The previously tested inbound document:
    Sender:
    ampletechstudio@gmail.com
    Subject:
    2026-08 Sales Register Submission
    Document:
    Sales Register
    Period:
    2026-08
    This should become a good end-to-end demo case after the client mapping is correctly configured.
    Expected result:

- sender recognized as Quantum Bridge
- client_id = CLI-001
- document type = Sales Register
- period = 2026-08
- document stored
- source file has a valid Drive ID
- dashboard shows the document
- user can click Open Source Document
- Google Drive opens the archived source PDF
- document review UI displays consistent matched-client status

29. DO NOT FAKE "OPEN DOCUMENT"
    This is extremely important.
    Do not implement:

- a button that does nothing
- a toast saying "Opening..."
- a fake /documents/file
- a placeholder PDF
- a local path that only works on your machine
- a hardcoded Google Drive URL for one test document
- a URL that doesn't correspond to the stored drive_file_id
  It must be dynamically tied to the actual stored document.

30. BACKEND API QUALITY
    If you modify backend APIs:
    Follow the existing architecture.
    Use:

- existing authentication/firm scoping
- existing repository pattern
- existing error handling
- existing validation
- existing response conventions
  Do not expose:
- Google credentials
- service-account private keys
- API keys
- webhook secrets
- environment variables
- internal secrets
  in frontend responses.

31. SECURITY
    Never hardcode:

- GEMINI_API_KEY
- Google service-account private key
- webhook secret
- access tokens
- refresh tokens
- passwords
  Do not commit secrets.
  The test email:
  ampletechstudio@gmail.com
  is not a secret.

32. FIRM SCOPING
    Everything must remain scoped to:
    FIR-001
    Do not create cross-firm behavior.
    Do not make document opening bypass firm authorization.
    Do not allow arbitrary Drive IDs supplied by the frontend to access arbitrary Drive files.
    The source-document access should originate from an authoritative document record.
33. AUDIT LOG
    Do not create audit entries for merely opening/viewing a document unless the existing architecture specifically requires it.
    Viewing a source document is a read operation.
    Do not pollute the audit log.
    Do preserve existing audit behavior for actual mutations.
34. RESPONSIVE / VISUAL QUALITY
    The current dashboard has a premium warm brown/cream CA-firm visual identity.
    Do not redesign the entire application.
    Maintain:

- existing spacing system
- typography
- colors
- cards
- sidebar
- icons
- rounded corners
- professional CA-firm feel
  The changes should feel like they were always part of the application.
  Do not introduce a completely different design language.

35. ACCESSIBILITY
    For the new source document action:
    Provide:

- accessible label
- tooltip where appropriate
- keyboard accessibility
- clear focus behavior
  Example accessible label:
  Open source document in Google Drive

Do not rely on icon-only meaning without an accessible label. 36. ERROR STATES
Handle:
No drive_file_id
Show:
Source unavailable

Invalid source URL
Show a friendly error.
Backend unavailable
Do not crash the entire document page.
Google Drive access denied
The dashboard should remain functional.
Do not hide the document itself. 37. DO NOT TOUCH MAKE
This task belongs to Antigravity.
Do NOT:

- modify Make scenarios
- change Gmail modules
- change Drive modules
- change Workflow 1
- build Workflow 2
- add Make webhooks
- modify Make scheduling
  We will handle workflows separately with Maia.

38. DO NOT CHANGE THE 9-SHEET DATABASE SCHEMA
    Absolutely no new Sheets.
    No:
    CLIENT_EMAIL_MAPPING
    No:
    DEMO_CLIENTS
    No:
    ATTACHMENTS
    No:
    COPILOT_MESSAGES
    No:
    DRIVE_FILES
    No extra database.
    Use existing data structures.
39. DO NOT RESET THE DATABASE
    This is production/demo data.
    Do NOT:

- truncate Sheets
- regenerate all clients
- recreate requirements
- reset documents
- wipe audit logs
- reseed everything
- change existing IDs
  Make targeted changes only.

40. TESTING REQUIREMENTS
    After implementation, run:
    Frontend

- production build
- TypeScript checks if available
- lint if configured
- existing tests if available
  Backend
- tests
- build
- TypeScript validation
- API-related tests
  Do not stop after "it compiles."

41. SPECIFIC ACCEPTANCE TESTS
    The implementation is NOT complete until these conceptual tests pass.
    TEST 1 — Open Source Document
    Given a document with:
    drive_file_id = valid Google Drive file ID
    When user opens document review:
    A visible:
    Open Source Document

action exists.
Clicking it opens the corresponding Google Drive source file in a new tab.
TEST 2 — Missing Drive ID
Given a document with no drive_file_id:
The UI does not show a broken link.
It gracefully indicates the source is unavailable.
TEST 3 — Client Matching
Given sender:
ampletechstudio@gmail.com
and configured demo client:
CLI-001
the document should resolve to:
Quantum Bridge
not:
CLI-UNKNOWN.
TEST 4 — Unknown Client
Given an unrelated sender:
unknown@example.com
the system should NOT incorrectly map it to Quantum Bridge.
It should remain unknown/review-required according to existing rules.
TEST 5 — Status Consistency
A matched client must not simultaneously display:
Client matched

and:
Unknown Client

The UI must reflect the actual backend record.
TEST 6 — Copilot Empty State
Open Copilot.
Expected:

- no fake assistant message
- no automatic query
- no backend request caused solely by opening
- no Gemini model name
- clean professional empty state
- useful suggestions may be shown
  TEST 7 — Copilot Greeting
  Enter:
  hi
  Expected:
  A conversational response.
  No full compliance analysis.
  No weird self-audit.
  TEST 8 — Copilot Real Query
  Enter:
  Why is Quantum Bridge only 60% compliant?
  Expected:
  The existing Copilot functionality still works.
  It must preserve quantitative facts.
  It must not display the underlying model name.
  TEST 9 — Model Branding
  Search the frontend for user-facing occurrences of:
  Gemini
  There should be zero visible production UI references.
  Backend provider code can still contain Gemini references.
  TEST 10 — Existing Dashboard
  After all changes:
  Dashboard still loads real data.
  It must NOT fall back to an all-zero empty dashboard.
  Existing client/document/compliance data must remain visible.

42. IMPORTANT: INVESTIGATE BEFORE EDITING
    Before changing code:
1. inspect repository structure
1. inspect current frontend
1. inspect document review components
1. inspect document API response
1. inspect drive_file_id usage
1. inspect client matching implementation
1. inspect current Copilot drawer
1. search for Gemini UI branding
1. inspect existing tests
1. understand current environment configuration
   Do not guess.
   Do not immediately start rewriting files.
1. MINIMAL CHANGE PRINCIPLE
   Prefer the smallest robust implementation.
   If an existing component can be extended:
   extend it.
   If an existing API can return one additional field:
   do that.
   If an existing utility can generate a Drive URL:
   reuse it.
   Do NOT create unnecessary abstractions.
   Do NOT refactor unrelated files.
   Do NOT rename large numbers of variables.
   Do NOT upgrade dependencies.
   Do NOT change React/Vite versions.
   Do NOT redesign the application.
1. DEPLOYMENT AWARENESS
   This application is deployed on Render.
   Frontend:
   https://ca-firm-dashboarca-copilot-frontend.onrender.com
   Backend:
   https://ca-copilot-backend-y6e5.onrender.com
   The frontend uses:
   VITE_API_URL
   The backend uses environment configuration including:

- DEFAULT_FIRM_ID
- REPOSITORY_MODE
- GOOGLE_SHEETS_SPREADSHEET_ID
- Google service account configuration
- GEMINI_API_KEY
- API_PREFIX
  Do not hardcode production URLs into new logic unless the existing architecture already uses them.
  Use environment/configuration appropriately.

45. IMPORTANT PRODUCTION CONFIGURATION
    The production repository must continue using:
    REPOSITORY_MODE=sheets
    or whatever existing production configuration is already established.
    Do NOT accidentally make production use:
    memory
    because that can make the dashboard appear empty or all-zero.
    This has happened before during development and must not regress.
46. DO NOT CLAIM SUCCESS WITHOUT VERIFICATION
    At the end, provide a concise engineering report containing:
    Changed
    List every file changed.
    Why
    One-line reason per change.
    Tests
    List:

- tests run
- build result
- type check
- lint if available
  Source document
  Explain exactly how drive_file_id now becomes an openable source document.
  Client matching
  Explain exactly how:
  ampletechstudio@gmail.com
  maps to:
  CLI-001
  and whether this was actually changed in the authoritative data or whether a manual Sheets change remains necessary.
  Copilot
  Confirm:
- no automatic query on open
- no fake initial assistant message
- no model branding in UI
  Not changed
  Explicitly confirm:
- Make workflows untouched
- 9-sheet schema untouched
- Workflow 1 untouched
- database not reset
- existing compliance logic untouched

47. FINAL DEMO EXPECTATION
    After this task, I should be able to perform this dashboard-side demo:
    Step 1
    Open CA Copilot dashboard.
    Dashboard shows real synthetic firm data.
    Step 2
    Open AI Inbox.
    See the newly received document.
    Step 3
    Open the document.
    See:
    Quantum Bridge

Sales Register

August 2026

appropriate validation status

Step 4
Click:
Open Source Document

Google Drive opens the actual archived PDF.
Step 5
Open Copilot.
It starts clean.
No fake chat history.
No Gemini label.
Step 6
Ask:
Why is Quantum Bridge only 60% compliant?

Copilot answers using real dashboard data.
Step 7
Continue later into Workflow 2.
That workflow will be handled separately by Maia. 48. PRODUCT PRINCIPLE
Every implementation decision should follow this principle:
CA Copilot is an operational assistant for a CA practice, not a generic chatbot.

It should feel:

- reliable
- professional
- grounded in actual practice data
- transparent
- auditable
- human-controlled
- polished
- fast
- trustworthy
  Avoid gimmicks.
  Avoid fake AI behavior.
  Avoid unnecessary animations.
  Avoid model branding.
  Avoid hallucinated data.
  Avoid hardcoded demo-only UI wherever real backend data can be used.

49. ABSOLUTE PRIORITY ORDER
    If time is limited, implement in this exact order:
    P0 — MUST FIX
1. Open Source Document
1. Correct client matching for ampletechstudio@gmail.com
1. Fix matched/unknown UI inconsistency
1. Remove Gemini/model branding
1. Remove fake Copilot initial message
1. Ensure Copilot doesn't auto-query
   P1 — MUST VERIFY
1. Dashboard still loads real Sheets data
1. Existing Copilot queries still work
1. Production build succeeds
1. Tests succeed
   P2 — DO NOT DO NOW
   Do NOT spend time building:

- full JARVIS agent
- autonomous dashboard control
- new client creation through Copilot
- reminder creation through Copilot
- autonomous mutations
- new database tables
- new Make workflows
- workflow redesign
  Those are future iterations.

50. FINAL INSTRUCTION
    Work directly on the existing repository.
    First inspect.
    Then make the smallest correct changes.
    Then test.
    Do not rewrite working systems.
    Do not break Workflow 1.
    Do not touch Make.
    Do not expose Gemini.
    Do not fake source-document access.
    Do not fake client matching.
    Do not reset the database.
    The goal is to make the current CA Copilot dashboard demo-ready, truthful, polished and reliable.
    When finished, report:
    IMPLEMENTED
    VERIFIED
    MANUAL ACTION STILL REQUIRED
    NOT TOUCHED

with exact details.
