# GATE-001 — direct-probe retest log

This supersedes the search-engine-only test recorded in
`gate-001-search-log.md` (kept, not deleted — see `DECISIONS.md` DEC-002).
This run issues real HTTP requests directly against the primary-source
URLs supplied by the operator, rather than relying on search-engine
indexing.

Environment: `curl` (direct HTTP/2 requests) + WebFetch, run
2026-09-04T10:12–10:20Z.

## DNS

```text
$ dig +short orionagents.org
34.111.179.208
```

The domain resolves. It is not unregistered or NXDOMAIN.

## Direct HTTP requests

```text
GET https://orionagents.org             -> 404
GET https://orionagents.org/store       -> 404
GET https://orionagents.org/concierge   -> 404
GET https://orionagents.org/docs        -> 404
GET https://orionagents.org/docs/x402   -> 404
GET https://orionagents.org/robots.txt  -> 404
GET https://orionagents.org/sitemap.xml -> 404
GET https://orionagents.org/api/x402/attestation/test -> 404
GET http://orionagents.org (redirects)  -> 404 (after upgrade to https)
```

Response headers on the root request:

```text
HTTP/2 404
content-type: text/html; charset=utf-8
via: 1.1 google
alt-svc: h3=":443"; ma=2592000,h3-29=":443"; ma=2592000
```

`via: 1.1 google` indicates the request reached a real Google Cloud
front-end/load balancer, not a DNS sinkhole or a search-engine artifact.

## Response body (identical on every path tested)

The 404 response body is not a generic hosting 404 — it is an
application-level placeholder page:

```html
<title>This app isn&#39;t live yet</title>
...
<div class="title-box">...
<div class="err-box">...
```

Styling and structure (IBM Plex Sans, dark navy `#1c2333` background, an
"eval-bot" ASCII element) match a deployment-platform placeholder shown
when a project has been provisioned but no application build has been
deployed to it. Every path returns byte-for-byte the same placeholder,
which means the routing layer itself has nothing behind it yet — this is
not a per-route 404 from a real running app with some routes missing.

## Alternate domain probes

Tried plausible sibling domains in case `.org` was stale:
`orionagents.io`, `orionagents.xyz`, `orionagents.app`,
`orion-agents.org`, `orion-agents.xyz`, `useorion.xyz`,
`orionprotocol.org`. All fail DNS resolution (`Could not resolve host`) —
none are registered.

## Independent corroboration attempts

- `web.archive.org` — not fetchable from this environment (blocked by the
  fetch tool itself, not a finding about Orion).
- GitHub search for `orionagents` / `orion-agents` + `AgentBound` — no
  matching organization or repository. Every result is an unrelated
  "Orion" project (coding assistants, RL research, LLM orchestration
  frameworks).
- Search for an official `@Orion_Agents` X/Twitter account or hackathon
  extension announcement — no result found or corroborated independently.
  See "Hackathon deadline" note below.

## Conclusion

This is a direct-request result, not a search-engine miss: the exact
primary-source URLs supplied — `orionagents.org`, `/store`, `/concierge`,
`/docs`, `/docs/x402`, and the claimed `/api/x402/attestation/{id}` route
shape — all return the same platform-level "app isn't live yet"
placeholder from a live, resolving, Google-fronted host. No GitHub
organization, no archived snapshot (inconclusive — tool blocked, not
evidence of absence), and no independently corroborated social account
exist for this project outside of what was already supplied.

See `GATES.md` for the reclassified gate entry and `DECISIONS.md` DEC-002
for the process correction and DEC-003 for what this means going forward.
