/**
 * pre-build.js
 * Lee electron/config.json y genera .env.local con las credenciales de Supabase
 * antes de ejecutar "next build", para que los valores NEXT_PUBLIC_* queden
 * incrustados en el bundle del cliente.
 */

const fs   = require('fs')
const path = require('path')

const root       = process.cwd()
const configPath = path.join(root, 'electron', 'config.json')
const envPath    = path.join(root, '.env.local')

if (!fs.existsSync(configPath)) {
  console.error('✗ No se encontró electron/config.json')
  process.exit(1)
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))

const lines = []

if (config.supabaseUrl && config.supabaseUrl !== '') {
  lines.push(`NEXT_PUBLIC_SUPABASE_URL=${config.supabaseUrl}`)
  console.log('✓ NEXT_PUBLIC_SUPABASE_URL configurada')
} else {
  console.log('⚠ supabaseUrl vacío — la app correrá en modo demo (sin auth)')
}

if (config.supabaseAnonKey && config.supabaseAnonKey !== '') {
  lines.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${config.supabaseAnonKey}`)
  console.log('✓ NEXT_PUBLIC_SUPABASE_ANON_KEY configurada')
}

fs.writeFileSync(envPath, lines.join('\n') + (lines.length ? '\n' : ''))
console.log(`\n→ .env.local generado (${lines.length} variable${lines.length !== 1 ? 's' : ''})\n`)
