# HIREWALL — 2-minute demo script

Every screen, URL, and number below is real and reproducible against
`https://hirewall.vercel.app` at time of writing. Do not swap in a
scripted success — if a live number has changed, re-run the shown
command and use whatever it actually returns.

---

## 0:00–0:12 — Hook

**Screen:** hirewall.vercel.app landing page.

**Voiceover:**
"You're about to pay an AI agent from Orion's Store. A listing with a
name and a wallet is not a credential. HIREWALL is the firewall that
sits in front of that payment: no valid AgentBound authorization, no
dispatch."

---

## 0:12–0:35 — Real dispatch, live

**Screen:** `/dispatch` → "Check a specific worker" → type `rigel`,
task "audit this agent", budget 0.10 → Submit. Page redirects to
`/dispatch/<id>` and the trace streams live.

**Voiceover:**
"I'll check a real agent from Orion's live Store — Rigel. This isn't a
fixture. Watch the trace: HIREWALL resolves the candidate, reads
Rigel's AgentBound identity directly from Base, then tries to fetch
Rigel's signed reputation attestation."

**On-screen as it happens:** `candidate.resolved` → `verification.result`
→ decision.

---

## 0:35–0:55 — The honest refusal

**Screen:** Decision stamp: `UNVERIFIABLE`, code `ATTESTATION_MISSING`.
"No payment authority created."

**Voiceover:**
"And there it is: Orion's onchain identity is real — Rigel is a minted
AgentBound token, I verified that against Base myself — but Orion's
signed attestation endpoint doesn't return one yet. HIREWALL doesn't
guess. It doesn't fall back to a generic score. It refuses, and no lease
is ever created. This is the product working correctly, not a bug I'm
covering for."

---

## 0:55–1:15 — Proof Lab: same code, controlled tamper

**Screen:** `/proof-lab` → select the tamper scenario → Run.

**Voiceover:**
"Since Orion hasn't shipped a live credential yet, here's the same
verifier, policy, and lease code proving itself against a controlled,
clearly labeled fixture. One byte flipped in a signed payload —"

**Screen:** `CONTROLLED FAULT INJECTION` badge, result: `REFUSE`,
`SIGNATURE_INVALID`.

**Voiceover:**
"— refused. Same for an expired credential, a wallet mismatch, a
replayed authorization. Every one of these is a real test in the repo,
not a demo-only shortcut."

---

## 1:15–1:35 — Verify a receipt, offline

**Screen:** terminal.

```bash
curl https://hirewall.vercel.app/api/receipts/rcpt_938380a8-57b5-47a3-a916-81f43cfc37df?format=raw -o receipt.json
npm run verify:receipt -- receipt.json
```

**Voiceover:**
"Every decision — authorized or refused — gets a receipt. Here's the
real Rigel receipt from a minute ago, pulled straight from the public
API. The verifier recomputes it offline — no login, no wallet, no
trusting HIREWALL's own database."

**Screen:** terminal output scrolling: `Receipt hash PASS`,
`Orion credential verification NOT CLAIMED`.

**Voiceover:**
"And it's honest about the boundary: it proves the receipt wasn't
tampered with. It does not claim to prove Orion's signature, because
Orion hasn't given it one to check yet."

---

## 1:35–1:55 — The wide proof: the whole Store

**Screen:** `/catalog`.

**Voiceover:**
"This isn't one cherry-picked agent. I ran every one of Orion's 52
current Store listings through this exact pipeline."

**Screen:** counts — 48 refuse, 4 unverifiable, 0 authorize.

**Voiceover:**
"Zero authorized, because zero currently have a retrievable signed
credential. That's not a disappointing number to hide — it's the
measurement. Every row links to its own receipt."

---

## 1:55–2:00 — Close

**Screen:** README / repo link.

**Voiceover:**
"HIREWALL enforces the rule correctly today. It's waiting on Orion to
give it something real to authorize. Repo's open, link's below."

---

## Recording notes

- Use the live Rigel receipt ID above only if it still resolves;
  otherwise dispatch a fresh one on camera and use that ID for the
  verify-receipt step instead.
- Do not narrate a successful `AUTHORIZE` or a payment — neither has
  happened. The honest refusal *is* the proof point.
- If Orion's attestation endpoint starts returning a real credential
  before recording, redo this script against that live result instead —
  see `GATES.md` for how to re-run GATE-001.
