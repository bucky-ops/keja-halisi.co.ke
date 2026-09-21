# Keja Halisi — Architecture (Mermaid)

## 1. System Architecture

```mermaid
flowchart LR
  U[User] --> FE[Next.js Frontend]
  FE --> DB[Prisma + SQLite sandbox / Supabase Postgres prod]
  DB --> T[agents, listings, estates, verifications, reports, leads, developers, audit_events]
  DB --> V[Private Vault: ID encrypted, Selfie, Mandate Letter, exact door number]
  DB --> CR[Expiry Cron 7d + Re-check Nudge YES/NO]
  FE --> API[TikTok oEmbed legal, Google Distance Matrix, OpenWeather, AfricasTalking OTP, Gemini Vision, Truecaller]
  API --> FE
  DB --> ADM[Admin: publish_state approved/rejected, AI flags, fee signal]
  CR --> DB
```

## 2. Verification Flow (Agent / Caretaker / Owner / Developer)

```mermaid
flowchart TD
  A[Submit TikTok handle + video link] --> B[OTP 6-digit — Africa's Talking + Truecaller >6mo]
  B --> C[ID + Selfie face match → private vault]
  C --> D{Role?}
  D -->|Agent| E[2 old TikTok videos + 2 referrals]
  D -->|Caretaker| F[ID + Owner Mandate Letter + estate permission]
  D -->|Owner| G[ID + KPLC bill matching name]
  D -->|Developer| H[Company + Title/Lease]
  E --> I[KRA PIN / Business Reg optional Gold]
  F --> I
  G --> I
  H --> I
  I --> J[Pending yellow → Under review → Verified green / Rejected red / Gold crown / Caretaker blue]
```

## 3. Listing Verification Pipeline

```mermaid
flowchart TD
  L[Paste TikTok link] --> M[oEmbed pull — legal iframe]
  M --> N[Gemini extract Price Beds Location]
  N --> O[Reverse search — 5 handles = Repost flag]
  O --> P[Price anomaly — 1BR Kile 8k = Bait flag]
  P --> Q[Evidence checklist: Outside + Gate + Inside + Water + View]
  Q --> R[Estate select — 17 sub-counties + lat/lng]
  R --> S[Google Places cross-check]
  S --> T[Available + pending_review]
  T --> U[Admin approve → approved]
  U --> V[Auto-expire 7d + 3 reports auto-hide]
```

## 4. Renter Journey

```mermaid
flowchart LR
  H[Home — hero + search] --> B[Borough — 6]
  B --> SC[Sub-county — 17]
  SC --> E[Estate page — filters + map/list]
  E --> F[Trust filters: Fresh 24h / No fee / Verified / Available + sort response]
  F --> G[Grid: verified cards — price, distance, weather, freshH, response, fee warning]
  G --> D[Detail: video + photos + trust checks + privacy notice + masked call + report]
  D --> LE[Lead logged masked + audit_events append-only]
```

## 5. Trust State Machine

```mermaid
flowchart LR
  AV[Available — approved] --> RE[Reported — reason captured]
  RE --> FL[Flagged — threshold reached]
  FL --> HI[Hidden — publish_state rejected]
  HI --> RV[Reviewed — admin outcome + audit event]
  AV --> EX[Expired — 7d cron]
  EX --> NC[Re-check nudge — YES/NO SMS]
```

## 6. ERD (expanded)

```mermaid
erDiagram
  agents ||--o{ listings : poster_id
  agents ||--o{ verifications : agent_id
  agents ||--o| developers : developer
  developers ||--o{ units : inventory
  listings ||--o{ reports : listing_id
  listings ||--o{ leads : listing_id
  agents ||--o{ payments : agent_id

  agents {
    uuid id
    enum role "Agent_Owner_Developer_Caretaker"
    string phone
    string tiktok_handle
    enum verification_status "pending_verified_rejected_gold_caretaker"
    string id_encrypted_private
    string selfie_private
    string mandate_letter_private
    int response_time
  }
  listings {
    uuid id
    uuid poster_id
    string estate
    string sub_county
    string borough
    int price
    enum status "Available_Taken_Reserved_Expired"
    enum publish_state "draft_pending_review_approved_rejected_expired"
    jsonb ai_flags
    boolean fee
    int freshH
    string exact_number_encrypted_private
  }
  audit_events {
    uuid id
    string actor
    string action
    string object
    timestamp timestamp
  }
```

## 7. M-Pesa STK Simulation Flow

```mermaid
flowchart TD
  P[Pay KES 999 Pro / 200-500 escrow commitment] --> S1[Enter 07xx phone masked]
  S1 --> S2[STK Push sent — Till 123456 — phone buzzing]
  S2 --> S3[Enter M-Pesa PIN mock]
  S3 --> S4[Success tick + confetti + KRA receipt PDF mock]
  S4 --> N[Toast: STK Push simulated — no real payment was made]
```
