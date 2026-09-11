# Radix Connect — frontend

Phase 1 UI for [Radix Connect](../hackathon-be), built against the canvas design
(`Radix Connect.dc.html`) and the 70-endpoint Laravel API.

## Running it

```bash
npm install
npm run dev
```

The API is expected at `http://hackathon-be.test`. Vite proxies `/api` there, so
the browser stays same-origin and there is no CORS preflight in development.
Point it somewhere else with `VITE_API_PROXY_TARGET`, or skip the proxy entirely
by setting `VITE_API_BASE_URL` to an absolute origin.

Sign in with any name and the shared password (`Radix123` by default). An
unrecognised name creates a profile on the spot and lands on its New Joiner
Quest. `Anuj Maurya` is the seeded admin, which is what unlocks creating a Blind
Meetup round and running matching.

## The shape of it

```
src/
  api/          one module per pillar, wrapping all 70 endpoints
  auth/         demo sign-in, token persistence, boot-time /auth/me verify
  components/   primitives (Avatar, Modal, Toast) and the shared overlays
  lib/          fetch client, query client, formatting
  routes/       the five screens; Community's four tabs live in routes/community
  theme/        the six accent themes and the shuffle
```

**`lib/http.js`** is the only place that talks to the network. It attaches the
bearer token, unwraps Laravel's `{ data }` and pagination envelopes, and turns
any non-2xx into an `ApiError` carrying the 422 field map — so a form can ask
for `error.fieldError('title')` without unpacking anything. A 401 with a token
attached clears it and fires `radix:unauthorized`, which drops the session back
to sign-in rather than leaving screens stuck on an error.

**The accent is a runtime theme.** `ThemeProvider` rewrites `--acc`, `--tint`
and friends on `<html>`; every accent utility in `index.css` resolves through
those variables, so the dot in the header re-tints the whole app without a
re-render. One of six is picked per session, as the canvas does.

**The profile sheet and the "30 minutes with" sheet** are reachable from nearly
every card, so they live once at the root behind `useOverlays()` instead of
being threaded through each screen.

## Screens

| Route | What it covers |
|---|---|
| `/` | Dashboard across all six pillars — meetup round, quest suggestion, pot luck, next event, a recommendation, a story |
| `/people` | Search and the five filter groups: can help with, want to learn, interest, location, team |
| `/connect` | Blind Meetup (sign up, matching, reveal) and mentoring by topic, plus incoming/outgoing session requests |
| `/community` | Groups · Learn & Share (recommendations + AMAs) · Events · Stories |
| `/me` | Profile, editable tag sections, and the New Joiner Quest |

## One thing worth knowing

`GET /users` narrows by a single tag at a time. The design lets you stack
several, so `People` sends the first selection to the server and narrows the
rest client-side over a generously sized page — exact at the current roster
size, and the place to revisit if Radix grows past a few hundred people.
