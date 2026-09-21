# Yojana Setu — Security Specification (PII Sanitization & Local-First Isolation)

## 1. Data Invariants

1. **Local-First Boundary**: All citizen state (`trackedApplications`, `savedSchemes`, profile data) is isolated locally within the user's browser sandbox via `profileStorage.ts` and `localStorage`.
2. **PII Sanitization & Redaction**: Strict sanitizers scrub 12-digit Aadhaar formats (continuous, spaced, hyphenated), 10-digit mobile numbers, and PAN structures before persistence.
3. **Application Lifecycle Integrity**: Tracked applications can only transition through permitted status values: `['interested', 'docs-ready', 'applied', 'approved', 'rejected']`.
4. **Temporal Invariant**: Creation timestamps are immutable upon record update.
5. **Payload Bounding**: All string properties have explicit upper bounds. Unbounded payloads are strictly rejected.
6. **Zero External Data Exfiltration**: No telemetry, third-party authentication tokens, or cloud-hosted database connections are permitted.
7. **System Default Deny**: Untrusted data inputs are sanitized or rejected by default.

---

## 2. The "Dirty Dozen" Malicious Payloads

1. **Payload 1 (Identity Spoofing - User Profile)**: An authenticated user (`user_A`) attempts to write to `/users/user_B`.
2. **Payload 2 (Ghost Field Injection - Profile)**: An attacker injects `isAdmin: true` or `systemRole: "superuser"` into `/users/{userId}`.
3. **Payload 3 (Denial-of-Wallet String Bomb - Profile)**: An attacker submits an `applicantName` of 100,000 characters.
4. **Payload 4 (Invalid Category Injection)**: An attacker attempts to set `category: "SuperVIP"` outside the valid enum.
5. **Payload 5 (Cross-Tenant Subcollection Injection)**: User `user_A` attempts to insert a tracked application into `/users/user_B/trackedApplications/pmegp`.
6. **Payload 6 (Path ID Poisoning)**: An attacker attempts to create `/users/{userId}/trackedApplications/scheme%20with%20bad%20chars%24%24` or an ID > 128 characters.
7. **Payload 7 (Invalid Status Mutation)**: An attacker updates tracked application status to `"auto_approved_by_hacker"`.
8. **Payload 8 (Creation Time Tampering)**: An attacker attempts to mutate `createdAt` on an existing tracked application during an update.
9. **Payload 9 (Unauthenticated Profile Read)**: An unauthenticated guest client attempts a direct `get()` on `/users/{anyUser}`.
10. **Payload 10 (Foreign User List Scraping)**: User `user_A` attempts to list `/users/user_B/trackedApplications`.
11. **Payload 11 (Oversized Note Attack)**: An attacker attempts to write a `note` with 50,000 characters into a tracked application.
12. **Payload 12 (Invalid Type in Saved Scheme)**: An attacker attempts to write `{ schemeId: 12345 }` (number instead of string) into `savedSchemes`.
