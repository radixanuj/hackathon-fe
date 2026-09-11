# Radix Connect — frontend

UI for [Radix Connect](../hackathon-be), built against the canvas design
(`Radix Connect.dc.html`) and the Laravel API — Phase 1 and Phase 2, 129 endpoints.

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
| `/` | Dashboard across all six pillars, then "Easier ways in" for the Phase 2 surfaces |
| `/people` | Who should I meet, then search and the five filter groups |
| `/connect` | Blind Meetup · Buddy · Office Hours · Coffee & Lunch · Mentoring |
| `/community` | Groups · Challenges · Learn & Share · Ask & Teach · Events · Stories |
| `/me` | Profile, editable tag sections, and the New Joiner Quest |

Phase 2 added eight features, and the brief was explicit that they belong *inside*
the existing six pillars rather than alongside them. So Connect and Community
each grew a tab bar instead of new top-level routes, Who Should I Meet leads
People, Open Invites sit under Events as the step before an Event exists, and
Stories gained a "For you" mode ranked against your own interests.

## Two things worth knowing

`GET /users` narrows by a single tag at a time. The design lets you stack
several, so `People` sends the first selection to the server and narrows the
rest client-side over a generously sized page — exact at the current roster
size, and the place to revisit if Radix grows past a few hundred people.

`GET /dashboard` does not attach viewer state — no `my_signup` on the round, no
`my_rsvp` on its events. Home therefore takes those two from
`/meetups/rounds/current` and `/events?scope=upcoming` instead, which do, and
lets the dashboard supply everything that doesn't depend on who's asking.
