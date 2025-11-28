# MeoScreen

A real-time P2P screen sharing application with voice and text chat, built with React and Cloudflare RealtimeKit. Full-stack app deployable to Cloudflare Pages.

## Features

- 🖥️ **Screen Sharing** - Real-time screen sharing powered by Cloudflare RealtimeKit
- 🎙️ **Voice Chat** - Real-time voice communication for all participants
- 💬 **Text Chat** - Built-in text chat with message broadcasting
- 🔗 **Room-based** - Create or join rooms using simple 6-character codes
- 👤 **User Names** - Enter your name each time you join
- 🌐 **WebRTC** - Low-latency peer-to-peer connections
- ☁️ **Full-Stack** - Backend API included, deploys together on Cloudflare Pages
- 🛡️ **Protected** - Rate limiting and input validation to prevent abuse

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **Backend**: Cloudflare Pages Functions
- **Real-time**: Cloudflare RealtimeKit
- **Storage**: Cloudflare KV (room mappings)
- **Build Tool**: Vite 7

## Prerequisites

1. A Cloudflare account
2. Cloudflare RealtimeKit enabled (get API credentials from dashboard)
3. Node.js 18+

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/meoscreen.git
cd meoscreen
npm install
```

### 2. Set Up Cloudflare

1. **Create a KV Namespace** in Cloudflare dashboard:
   - Go to Workers & Pages → KV
   - Create a namespace called `ROOMS`
   - Copy the namespace ID

2. **Get RealtimeKit Credentials**:
   - Go to your Cloudflare dashboard
   - Navigate to RealtimeKit section
   - Copy your App ID and API Key

3. **Update `wrangler.toml`**:
   ```toml
   [[kv_namespaces]]
   binding = "ROOMS"
   id = "your-kv-namespace-id"  # Replace with your actual KV namespace ID
   ```

### 3. Local Development

Create a `.dev.vars` file for local secrets:

```env
RTK_API_KEY=your-realtimekit-api-key
RTK_APP_ID=your-realtimekit-app-id
```

Run the full-stack development server:

```bash
npm run dev:pages
```

This starts both the Vite dev server and Cloudflare Pages Functions locally.

### 4. Deploy to Cloudflare Pages

**Option A: Git Integration (Recommended)**

1. Push your code to GitHub/GitLab
2. Go to Cloudflare Dashboard → Pages
3. Create a new project and connect your repository
4. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Add environment variables:
   - `RTK_API_KEY`: Your RealtimeKit API key
   - `RTK_APP_ID`: Your RealtimeKit App ID
6. Add KV namespace binding:
   - Go to Settings → Functions → KV namespace bindings
   - Add binding: Variable name `ROOMS`, KV namespace `your-namespace`

**Option B: Direct Deploy**

```bash
# Login to Cloudflare
npx wrangler login

# Deploy
npm run deploy
```

Then configure environment variables and KV bindings in the Cloudflare dashboard.

## Project Structure

```
├── functions/              # Cloudflare Pages Functions (Backend)
│   ├── api/
│   │   └── meetings/
│   │       ├── index.ts    # POST /api/meetings - Create room
│   │       └── [roomId]/
│   │           └── join.ts # POST /api/meetings/:roomId/join
│   └── lib/
│       ├── ratelimit.ts    # Rate limiting utility
│       └── validation.ts   # Input validation
├── src/                    # Frontend React App
│   ├── components/         # UI components
│   ├── pages/              # Page components
│   ├── services/           # RealtimeKit service
│   └── ...
├── wrangler.toml           # Cloudflare configuration
└── package.json
```

## API Endpoints

### POST `/api/meetings`

Creates a new meeting room.

**Request:**
```json
{
  "roomId": "ABC123",
  "userName": "Host Name",
  "isHost": true
}
```

**Response:**
```json
{
  "meetingId": "meeting-uuid",
  "authToken": "eyJhbG..."
}
```

### POST `/api/meetings/:roomId/join`

Joins an existing meeting room.

**Request:**
```json
{
  "userName": "Viewer Name"
}
```

**Response:**
```json
{
  "meetingId": "meeting-uuid",
  "authToken": "eyJhbG..."
}
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server only (frontend) |
| `npm run dev:pages` | Start full-stack dev server with Functions |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build with Functions |
| `npm run deploy` | Build and deploy to Cloudflare Pages |
| `npm run lint` | Run ESLint |

## Environment Variables

### Cloudflare Dashboard (Production)

| Variable | Description |
|----------|-------------|
| `RTK_API_KEY` | Your Cloudflare RealtimeKit API key |
| `RTK_APP_ID` | Your Cloudflare RealtimeKit App ID |

### Local Development (`.dev.vars`)

```env
RTK_API_KEY=your-api-key
RTK_APP_ID=your-app-id
```

## Usage

### Creating a Room

1. Click "Create Room" on the homepage
2. Enter your display name
3. Share the room code with others
4. Click "Start Sharing Screen" to begin

### Joining a Room

1. Click "Join Room" on the homepage
2. Enter the 6-character room code
3. Enter your display name
4. Watch the host's screen share

## Security

The backend includes built-in protection against abuse:

### Rate Limiting

| Action | Limit | Window |
|--------|-------|--------|
| Create Room | 5 requests | per minute per IP |
| Join Room | 10 requests | per minute per IP |
| Global | 30 requests | per minute per IP |

Rate limit data is stored in KV with automatic expiration.

### Input Validation

- **Room ID**: Must be 4-10 alphanumeric uppercase characters
- **Username**: Must be 1-30 characters, no control characters
- **Request Body**: Maximum 1KB payload size

### Additional Protections

- Room codes expire after 24 hours
- Proper error messages without leaking internal details
- CORS headers configured for cross-origin requests

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

## License

MIT License - see [LICENSE](LICENSE) for details.
