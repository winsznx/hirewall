# GATE-001-R2 live retest

Captured 2026-09-27 18:38 UTC from public Orion and Base surfaces. No authenticated or protected resources were accessed.

## Raw HTTP artifacts

| File | Request | HTTP status | SHA-256 of uncompressed response |
| --- | --- | ---: | --- |
| `store.html` | `GET https://orionagents.org/store` | 200 | `945e766130bdf7b992f3f8bee6a5585c55fa6f9da923a5c7d9543de276991d38` |
| `orion-app.js.gz` | `GET https://orionagents.org/assets/index-ifaoiUi4.js` | 200 | `f43d8e5222a01caf8747d6fc31af9111762c07688b42cb754eda618ef86403da` |
| `agents.json` | `GET https://orionagents.org/api/agents` | 200 | `0b0cc30414afbd4e957c381626fbc2d102be3993a8df76be6925ec05c463fa88` |
| `x402-info.json` | `GET https://orionagents.org/api/x402/info` | 200 | `937ba0423cfe6c43c0830436a12fcb85b6bfc2ac9e87c8938aec8d75cc19ca07` |
| `attestation-16-404.json` | `GET https://orionagents.org/api/x402/attestation/16` | 404 | `0eff6eb3c81ad488b5567fe7ea2573d7e1f8c9eaa3d1eda876a29dd5175362a4` |
| `attestation-18-404.json` | `GET https://orionagents.org/api/x402/attestation/18` | 404 | same response/hash |

The Store contains Rigel (`id=16`, `slug=rigel`) and AUDIT (`id=18`, `slug=audit`). Their slug attestation lookups also returned 404. `GET /api/agentbound/reputations` returned `[]`.

## Independent Base RPC reads

RPC: `https://mainnet.base.org`; registry: `0xb006ca09e390eb3082bb3cb0b43e788ebc6e76a0`; chain: Base mainnet (8453).

```text
cast code <registry>                      => 15007 hex characters including 0x
cast call <registry> 'oracle()(address)'  => 0x7cDd6Ea617c4F5F1c9a5128D2940c72e1A2E4900
cast call <registry> 'totalMinted()(uint256)' => 3
cast call <registry> 'exists(uint256)(bool)' 16 => true
cast call <registry> 'exists(uint256)(bool)' 18 => true
cast call <registry> 'exists(uint256)(bool)' 33 => false
cast call <registry> 'ownerOf(uint256)(address)' 16 => 0x6ee495D415F5956fe0d72CB0118A52a04d3e33a3
cast call <registry> 'ownerOf(uint256)(address)' 18 => 0x6ee495D415F5956fe0d72CB0118A52a04d3e33a3
cast call <registry> 'tokenURI(uint256)(string)' 16 => ""
cast call <registry> 'tokenURI(uint256)(string)' 18 => ""
```

`reputationOf(16)` returned `(minted=true, slashed=false, tier=1, attestationCount=4, attestedAt=1788910611, intelligenceScore=7800, compositeScore=4700)`. `reputationOf(18)` returned `(true, false, 1, 1, 1790235605, 6400, 4350)` in the same field order. The ABI is present in the public app bundle. These reads establish onchain state; they do not establish the worker wallet or an offchain signature. A broad 52-ID Base RPC scan hit public endpoint rate limits, so no exhaustive mint cohort is claimed.

The current client bundle also embeds Orion's x402 documentation, including the nine-line EIP-191 message format and a link to `orionagents-org/agents-ket` reference verifier. The linked raw GitHub source returned 404 during this retest, so no reference-verifier parity is claimed.
