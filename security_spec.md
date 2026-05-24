# Firebase Security Rules Specification (Zero-Trust)

This document outlines the security architecture for the Telegram Match Betting Mini App.

## 1. Data Invariants
- **Identity Lock**: A user's profile Firestore ID (Telegram ID) must correspond to the unique Firebase Auth anonymous `uid`. Once a mapping from `telegramId` to `uid` is established, it cannot be modified by any client.
- **Relational Integrity**: No user may place a bet, execute a transaction, or log a spin action for any Telegram ID other than their own authenticated, verified profile.
- **Balance Invariance**: A bet can only be created if the user's current account balance is being checked, and updates to the balance are made consistently.
- **Immutability of Historical Ledger**: Transaction items and spin histories are write-once and cannot be updated or deleted by any client.

## 2. The "Dirty Dozen" Exploits Blocked by Fortress Rules

1. **The Identity Spoof**: Attacker signs in and attempts to draft/update a user profile of another Telegram ID.
2. **The Balance Hijack**: Attacker tries to modify their balance positively without standard transactions (direct balance modification).
3. **Ghost Bets Placement**: Attacker creates a bet document assigning the `userId` field to a victim's Telegram ID to spend their coins.
4. **Negative Stake Overflow**: Attacker places a bet with a negative stake (e.g., `-1000`) hoping to increment their balance on loss or placement.
5. **Odds Tampering**: Attacker registers a bet on a live match but alters the odds in the payload to a high value (like `999.0`).
6. **Double Rewards Claim**: Attacker tries to bypass daily reward checking by sending duplicate `timestamp` update payloads.
7. **Referral Theft**: Attacker tries to alter their `referredBy` or `referralEarnings` directly.
8. **Live Outcomes Forgery**: Attacker attempts to modify match results (homeScore, status = 'FINISHED' with their predicted win) on ongoing matches directly in Firebase.
9. **Transaction Erasure**: Attacker performs a withdrawal transaction, then tries to delete the transaction document.
10. **Infinity Spin**: Attacker claims multiple spin histories with short intervals bypassing the 24h client check.
11. **Path Variable Junk Injecting**: Attacker injects a 10KB string as a `telegramId` path to test database index crash boundaries.
12. **PII Query Scraping**: Attacker queries user collection blanketly seeking private variables.

## 3. Test Paths and Allowed Conditions
We verify that all secure resources resolve to `PERMISSION_DENIED` unless they pass validation and ownership checks. The rules are constructed in `firestore.rules` under these invariants.
