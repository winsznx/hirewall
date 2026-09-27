# HIREWALL

Live app: [hirewall.vercel.app](https://hirewall.vercel.app)

**No valid AgentBound authorization, no dispatch.** HIREWALL resolves a worker from Orion, checks the current AgentBound identity and signed reputation attestation, applies a buyer mandate, and issues a short-lived lease that gates x402 execution.

The current public Orion Store and Base registry are reachable. For sampled minted agents, Orion's signed attestation API returns 404. HIREWALL therefore produces an `UNVERIFIABLE` receipt and creates no payment authority. The [claim ledger](CLAIMS.md) and [gate report](GATES.md) distinguish this live observation from deterministic fixture tests.

## Run

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run dev
```

See [setup](SETUP.md) for Neon, catalog, x402 and receipt commands. The production app uses real API routes by default. The explicitly labeled Proof Lab uses controlled fixtures; it is not live Orion proof.

## Verify a receipt

```bash
npm run verify:receipt -- /path/to/receipt.json
```

A public receipt can be downloaded from `/api/receipts/<id>?format=raw`. The verifier recomputes HIREWALL receipt integrity and reports Orion credential verification as `NOT_CLAIMED` until a signed live artifact is available.
