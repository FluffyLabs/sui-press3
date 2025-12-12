import { useMemo, useState } from 'react'
import './App.css'

type Renderer = 'html' | 'markdown' | 'json'

type PageEvent = {
  path: string
  walrusId: string
  renderer: Renderer
  lastEditor: string
  updatedAt: string
}

type MenuSchema = {
  main: Array<{ label: string; href: string }>
  sidebar: Array<{ label: string; href: string }>
}

const PAGE_EVENTS: PageEvent[] = [
  {
    path: '/index.html',
    walrusId: 'walrus://blob/main-menu',
    renderer: 'html',
    lastEditor: '0xDeployer',
    updatedAt: '2024-10-12T10:35:00Z',
  },
  {
    path: '/wiki/press3.md',
    walrusId: 'walrus://blob/wiki-page',
    renderer: 'markdown',
    lastEditor: '0xEditor',
    updatedAt: '2024-10-13T08:12:11Z',
  },
  {
    path: '/menu',
    walrusId: 'walrus://blob/navigation',
    renderer: 'json',
    lastEditor: '0xCMSAdmin',
    updatedAt: '2024-10-13T09:02:45Z',
  },
]

const MENU_SCHEMA: MenuSchema = {
  main: [
    { label: 'Home', href: '/' },
    { label: 'Docs', href: '/docs' },
    { label: 'Forum', href: '/forum' },
  ],
  sidebar: [
    { label: 'Latest', href: '/news' },
    { label: 'Topics', href: '/topics' },
    { label: 'Search', href: '/search' },
  ],
}

const ASSET_BINDINGS = [
  { logicalPath: '/style.css', walrusId: 'walrus://blob/theme' },
  { logicalPath: '/logo.png', walrusId: 'walrus://blob/brandmark' },
  { logicalPath: '/sidebar', walrusId: 'walrus://blob/sidebar' },
]

function App() {
  const [selectedPath, setSelectedPath] = useState(PAGE_EVENTS[0]?.path ?? '')
  const activeEvent = useMemo(
    () => PAGE_EVENTS.find((evt) => evt.path === selectedPath),
    [selectedPath],
  )

  return (
    <div className="app">
      <header>
        <h1>Press3 Frontend Sandbox</h1>
        <p>
          This Vite + React shell visualizes how the public renderer will map CMS
          events to Walrus blobs, menu metadata, and smart-contract driven assets.
        </p>
      </header>

      <section className="panel">
        <div className="panel-heading">
          <h2>Latest page events</h2>
          <span className="hint">replace with on-chain subscription</span>
        </div>
        <ul className="event-list">
          {PAGE_EVENTS.map((event) => (
            <li
              key={event.path}
              className={selectedPath === event.path ? 'active' : ''}
              onClick={() => setSelectedPath(event.path)}
            >
              <div className="event-title">{event.path}</div>
              <div className="event-meta">
                <span>{event.renderer.toUpperCase()}</span>
                <span>{event.updatedAt}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Walrus blob preview</h2>
          <span className="hint">render HTML/Markdown assets based on suffix</span>
        </div>
        {activeEvent ? (
          <div className="preview">
            <div className="preview-row">
              <span>Path</span>
              <code>{activeEvent.path}</code>
            </div>
            <div className="preview-row">
              <span>Walrus ID</span>
              <code>{activeEvent.walrusId}</code>
            </div>
            <div className="preview-row">
              <span>Renderer</span>
              <code>{activeEvent.renderer}</code>
            </div>
            <div className="preview-row">
              <span>Last editor</span>
              <code>{activeEvent.lastEditor}</code>
            </div>
            <div className="preview-row">
              <span>Updated at</span>
              <code>{activeEvent.updatedAt}</code>
            </div>
            <p className="preview-description">
              Replace this card with the actual Walrus fetch logic. The renderer
              should hydrate menu/sidebar JSON automatically and inject resolved
              assets (CSS, images, etc.) after querying the contract.
            </p>
          </div>
        ) : (
          <p>No page selected yet.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Menu & sidebar schema</h2>
          <span className="hint">served from /menu and /sidebar blobs</span>
        </div>
        <pre className="code-block">{JSON.stringify(MENU_SCHEMA, null, 2)}</pre>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Smart-contract asset bindings</h2>
          <span className="hint">resolve URLs via Walrus quilt paths</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Logical path</th>
              <th>Walrus reference</th>
            </tr>
          </thead>
          <tbody>
            {ASSET_BINDINGS.map((binding) => (
              <tr key={binding.logicalPath}>
                <td>{binding.logicalPath}</td>
                <td>
                  <code>{binding.walrusId}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer>
        <p>
          Next steps: wire this scaffold to the Move contract events, hydrate Walrus
          fetchers, and integrate the zkLogin-aware editing UX.
        </p>
      </footer>
    </div>
  )
}

export default App
