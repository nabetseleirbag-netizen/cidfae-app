/**
 * prepare-standalone.js
 * Copia los archivos estáticos de Next.js al directorio standalone.
 * Usa PowerShell en Windows para evitar problemas con fs.cpSync.
 */

const { execSync } = require('child_process')
const fs   = require('fs')
const path = require('path')

const root = process.cwd()

const staticSrc  = path.join(root, '.next', 'static')
const staticDest = path.join(root, '.next', 'standalone', '.next', 'static')
const publicSrc  = path.join(root, 'public')
const publicDest = path.join(root, '.next', 'standalone', 'public')

function copyDir(src, dest, label) {
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠ No se encontró ${src}, omitiendo`)
    return
  }
  console.log(`→ Copiando ${label}`)
  if (process.platform === 'win32') {
    execSync(
      `powershell.exe -Command "Copy-Item -Path '${src}' -Destination '${dest}' -Recurse -Force"`,
      { stdio: 'inherit' }
    )
  } else {
    fs.cpSync(src, dest, { recursive: true })
  }
  console.log(`  ✓ Listo`)
}

if (!fs.existsSync(staticSrc)) {
  console.error('  ✗ No se encontró .next/static — ejecuta "next build" primero')
  process.exit(1)
}

copyDir(staticSrc, staticDest, '.next/static  →  .next/standalone/.next/static')
copyDir(publicSrc, publicDest, 'public  →  .next/standalone/public')

console.log('\n✅ Standalone preparado correctamente.\n')
