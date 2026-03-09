const { app, BrowserWindow, shell, Menu } = require('electron')
const path = require('path')
const http = require('http')
const fs   = require('fs')

let mainWindow
let serverProcess

// ── Cargar credenciales Supabase del config.json ───────────────────────────
function loadSupabaseConfig() {
  const configPath = path.join(__dirname, 'config.json')
  if (!fs.existsSync(configPath)) return
  try {
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    if (cfg.supabaseUrl)    process.env.NEXT_PUBLIC_SUPABASE_URL      = cfg.supabaseUrl
    if (cfg.supabaseAnonKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = cfg.supabaseAnonKey
  } catch (e) {
    console.warn('No se pudo leer electron/config.json:', e.message)
  }
}

// Cargar antes de cualquier otra cosa
loadSupabaseConfig()

// ── Directorio raíz de la app ──────────────────────────────────────────────
function getAppDir() {
  if (app.isPackaged) {
    // Con asar:false el contenido queda en resources/app/
    return path.join(process.resourcesPath, 'app')
  }
  // En desarrollo: carpeta del proyecto
  return path.join(__dirname, '..')
}

// ── Iniciar servidor Next.js standalone ────────────────────────────────────
async function startNextServer() {
  const appDir = getAppDir()
  const standaloneServer = path.join(appDir, '.next', 'standalone', 'server.js')

  // Configurar variables de entorno que usa el servidor standalone
  process.env.PORT = '3131'
  process.env.HOSTNAME = '127.0.0.1'
  process.env.NODE_ENV = 'production'

  // El servidor standalone necesita saber dónde están los archivos estáticos
  // Apuntamos al directorio raíz del standalone
  process.chdir(path.join(appDir, '.next', 'standalone'))

  // Cargar el servidor standalone generado por Next.js
  require(standaloneServer)

  // Esperar a que el servidor esté listo
  await waitForServer('http://127.0.0.1:3131', 30)
}

// ── Esperar a que el servidor responda ────────────────────────────────────
function waitForServer(url, maxAttempts) {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const check = () => {
      attempts++
      http.get(url, (res) => {
        resolve()
      }).on('error', () => {
        if (attempts >= maxAttempts) {
          reject(new Error(`El servidor no respondió después de ${maxAttempts} intentos en ${url}`))
        } else {
          setTimeout(check, 500)
        }
      })
    }
    setTimeout(check, 1000)
  })
}

// ── Pantalla splash ────────────────────────────────────────────────────────
function createSplash() {
  const splash = new BrowserWindow({
    width: 420,
    height: 300,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    resizable: false,
    backgroundColor: '#0f172a',
    webPreferences: { nodeIntegration: false },
  })

  splash.loadURL(`data:text/html;charset=utf-8,<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background:#0f172a; color:#fff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    height:100vh; user-select:none;
  }
  .logo {
    width:72px; height:72px; background:#2563eb; border-radius:18px;
    display:flex; align-items:center; justify-content:center;
    font-size:36px; margin-bottom:20px;
    box-shadow: 0 8px 32px rgba(37,99,235,0.4);
  }
  h1 { font-size:22px; font-weight:700; margin-bottom:6px; }
  p  { color:#94a3b8; font-size:13px; margin-bottom:28px; }
  .bar-wrap { width:200px; height:4px; background:#1e293b; border-radius:2px; overflow:hidden; }
  .bar      { height:100%; width:0; background:#2563eb; border-radius:2px; animation:load 8s ease-in-out forwards; }
  .status   { margin-top:12px; color:#64748b; font-size:11px; }
  @keyframes load { 0%{width:0} 60%{width:70%} 85%{width:88%} 100%{width:92%} }
</style>
</head>
<body>
  <div class="logo">&#x1F6E1;&#xFE0F;</div>
  <h1>CIDFAE</h1>
  <p>Gestión Técnica — FAE</p>
  <div class="bar-wrap"><div class="bar"></div></div>
  <p class="status">Iniciando servidor...</p>
</body>
</html>`)

  return splash
}

// ── Ventana principal ──────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'CIDFAE — Gestión Técnica',
    show: false,
    backgroundColor: '#0f172a',
  })

  Menu.setApplicationMenu(null)
  mainWindow.loadURL('http://127.0.0.1:3131')

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  // Abrir links externos en el navegador
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

// ── Ventana de error ────────────────────────────────────────────────────────
function showError(err) {
  const errWin = new BrowserWindow({
    width: 700, height: 500,
    title: 'CIDFAE — Error de inicio',
    backgroundColor: '#0f172a',
    webPreferences: { nodeIntegration: false },
  })
  Menu.setApplicationMenu(null)
  errWin.loadURL(`data:text/html;charset=utf-8,<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body { background:#0f172a; color:#f8fafc; font-family:system-ui,sans-serif;
         padding:32px; }
  h2  { color:#ef4444; margin-bottom:12px; }
  pre { background:#1e293b; padding:16px; border-radius:8px; font-size:11px;
        color:#94a3b8; white-space:pre-wrap; word-break:break-all; max-height:280px; overflow:auto; }
  p   { color:#94a3b8; font-size:13px; margin-top:16px; }
</style></head>
<body>
  <h2>&#x26A0; Error al iniciar CIDFAE</h2>
  <pre>${String(err).replace(/</g,'&lt;')}</pre>
  <p>Por favor contacte al administrador del sistema o reinstale la aplicacion.</p>
</body></html>`)
}

// ── App ready ──────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  const splash = createSplash()

  try {
    await startNextServer()
    createWindow()
    splash.destroy()
  } catch (err) {
    console.error('Error al iniciar CIDFAE:', err)
    splash.destroy()
    showError(err)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
