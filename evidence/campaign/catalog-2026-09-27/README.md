# Live Orion Store catalog screening — 2026-09-27

Run ID: `cat_3e2f9edc-ac77-439c-baf9-71bfae5dec39`.

The runner fetched `/api/agents` from the current public Orion application, parsed all 52 entries, and persisted the snapshot and one HIREWALL receipt per entry in Neon. `store-raw.json` contains the exact response bytes; its SHA-256 is `11e825da496ca4ca41543533c1584839a89d0e201cdf1400dcca1a422d278f96`, matching `run.json`. `snapshot.json` is a pretty-printed export of the parsed response and is semantically equivalent but has different bytes.

Rule: a Store listing is baseline eligible. HIREWALL requires Base AgentBound identity, a fresh Orion oracle-signed attestation bound to the listed wallet, and the buyer mandate to create a lease.

Observed: 48 `REFUSE` (`AGENTBOUND_MISSING`), 4 `UNVERIFIABLE` (three `ATTESTATION_MISSING`, one `DEPENDENCY_UNAVAILABLE`), 0 `AUTHORIZE`. Rigel's raw receipt is included. The one dependency error was retained as such; it was not called a missing token. No payment was signed or settled.

An initial run used Base's default public RPC and encountered rate limiting. The reported post-commit run used `https://base-rpc.publicnode.com`, independently checked against a known minted AgentBound ID before rerunning. Its `softwareCommit` is `2a623812a19a93a03671e1eb1da597002048eb44`, which contains the runner and persistence code. The earlier partial run remains in Neon as historical evidence.

Recompute the response hash with `shasum -a 256 store-raw.json`. Review the full cohort in `run.json`, and verify Rigel's raw receipt with `npm run verify:receipt -- evidence/campaign/catalog-2026-09-27/rigel-receipt.json`. The offline verifier's Orion credential check remains `NOT_CLAIMED`; it does not independently establish the absent signed artifact.

The production alias `https://hirewall.vercel.app` was smoke tested separately. `deployed-rigel-receipt.json` is the raw public receipt from that deployed workflow (`rcpt_938380a8-57b5-47a3-a916-81f43cfc37df`). It records Base identity checks passing, signed attestation unavailable, no lease, and no payment attempt. It is not one of the 52 catalog receipts.
