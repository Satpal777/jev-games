# Tic-Tac-Toe (User vs AI) - Bun & TypeScript

A Tic-Tac-Toe web game built with HTML, CSS, TypeScript, and Bun. The default AI uses TypeSafe's Jev model via a Bun API route; you can also plug in local move logic or use the built-in random fallback.

## Commands

- `bun run dev` - Start dev server at `http://localhost:3000`
- `bun test` - Run test suite
- `bun run build` - Prepare static assets in `public/` (for Vercel)
- `bun run build:local` - Build browser bundle to `dist/bundle.js` (for local dev)

## Deploy with Docker

1. Copy env file and set your API key:
   ```bash
   cp .env.example .env
   # Edit .env and set TYPESAFE_API_KEY
   ```

2. Build and start:

   **Coolify / production** (no host port binding — the platform proxy routes to the container):
   ```bash
   docker compose up --build -d
   ```

   **Local machine** (maps host port 3000):
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.local.yml up --build -d
   ```

3. Open the app:
   - **Coolify:** your assigned domain (e.g. `https://jev-game.example.com`)
   - **Local:** `http://localhost:3000`

   In Coolify, set **Port** to `3000` in the service settings and ensure `TYPESAFE_API_KEY` is in environment variables.

Useful commands:
- `docker compose logs -f app` — follow logs
- `docker compose down` — stop and remove containers
- `docker compose up --build` — rebuild after code changes

The image runs `bun run server.ts`, serves pre-built assets from `public/`, and exposes `/api/status` + `/api/ai-move`.

## Deploy on Vercel

1. Push this repo to GitHub (already connected to Vercel).
2. In the Vercel project → **Settings** → **Environment Variables**, add:
   - `TYPESAFE_API_KEY` = your TypeSafe API key
3. **Deploy** (or push to `main` to trigger auto-deploy).

Vercel runs `bun install` + `bun run build` (writes `public/index.html` + `public/bundle.js`), serves the `public/` folder, and runs `/api/status` + `/api/ai-move` as serverless functions.

Local dev still uses `bun run dev` (`server.ts`). Production on Vercel does **not** use `server.ts`.

## Cube Positions

Standard 3x3 positioning:

| Index | Matrix | Notation | Label |
| :---: | :---: | :---: | :--- |
| **`#0`** | `[0, 0]` | **A1** | Top-Left |
| **`#1`** | `[0, 1]` | **A2** | Top-Center |
| **`#2`** | `[0, 2]` | **A3** | Top-Right |
| **`#3`** | `[1, 0]` | **B1** | Middle-Left |
| **`#4`** | `[1, 1]` | **B2** | Center |
| **`#5`** | `[1, 2]` | **B3** | Middle-Right |
| **`#6`** | `[2, 0]` | **C1** | Bottom-Left |
| **`#7`** | `[2, 1]` | **C2** | Bottom-Center |
| **`#8`** | `[2, 2]` | **C3** | Bottom-Right |

## AI Function

The game engine calls an `AIFunction` with a single `AIMoveContext` argument:

```typescript
export interface AIMoveContext {
  readonly availableBoxes: readonly CellPosition[];
  readonly board: BoardState;
  readonly aiSymbol: PlayerSymbol;
  readonly humanSymbol: PlayerSymbol;
}
```

The default implementation in [`src/ai.ts`](src/ai.ts) is async and proxies to the Bun server, which runs TypeSafe AI in [`src/typesafe-decision.ts`](src/typesafe-decision.ts):

```typescript
export async function computeAIMove(
  availableBoxes: readonly CellPosition[],
  board: BoardState,
  aiSymbol: PlayerSymbol = 'O',
  humanSymbol: PlayerSymbol = 'X'
): Promise<CellPosition | number | null | undefined | AIMoveResponse> {
  // Returns undefined when no move is available or the API cannot respond.
  return undefined;
}
```

You can return any of these from a custom `AIFunction`:

- `CellPosition`
- numeric index (`0`–`8`)
- `null` / `undefined` for an empty stub
- `{ move, decision? }` when you also want the Decision Inspector populated

Set `TYPESAFE_API_KEY` in the environment or paste a key in the UI to enable Jev. Use **Play Fallback Random Move** to test without an API key.

## Validation & Error Handling

- **No Override**: Occupied boxes cannot be overwritten (`CELL_ALREADY_OCCUPIED`).
- **Turn Guard**: Moves only allowed on player's turn.
- **Empty AI Stub**: `undefined`/`null` AI output is handled safely without crashing.
- **Exception Protection**: Errors inside custom AI logic are caught and reported safely.

## Project Layout

- `src/game.ts` - game rules and turn flow
- `src/ai.ts` - default TypeSafe client wrapper and random fallback
- `lib/typesafe-decision.ts` - Jev payload builder and server-side evaluator
- `server/api.ts` - `/api/status` and `/api/ai-move`
- `server/bundle.ts` - cached browser bundle for `/bundle.js`
- `server/static.ts` - HTML/CSS/static assets
