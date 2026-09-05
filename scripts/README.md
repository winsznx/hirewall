# Scripts

## verify-receipt.ts

```bash
npm run verify:receipt -- <path|url|->
```

Offline receipt verifier per `HIREWALL_PRD.md` section 25 /
`BUILD_CONTRACT.md` section 17. Calls the exact same `verifyReceipt()`
function `/api/verify-receipt` uses — no separate CLI-only logic to drift
out of sync. Requires no LLM, funded wallet, private developer state, or
the application database; recomputes entirely from the receipt JSON
supplied. See `CLAIMS.md` for the tested tamper vectors.

## Not yet built

The `pnpm evidence:*` commands from `HIREWALL_PRD.md` section 25
(catalog, tamper, expiry, wallet-mismatch, replay evidence generation)
depend on the catalog experiment runner, which is blocked on `GATES.md`
GATE-001 for anything beyond deterministic fixture tests.
