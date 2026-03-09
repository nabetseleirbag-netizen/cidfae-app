/**
 * make-ico.js
 * Genera public/icon.ico a partir de public/CID.png
 * Usa sharp para redimensionar y construye el formato ICO manualmente
 * (ICO moderno con PNG embebido — compatible con Windows Vista+)
 */

const sharp = require('sharp')
const fs    = require('fs')
const path  = require('path')

const src  = path.join(__dirname, '..', 'public', 'CID.png')
const dest = path.join(__dirname, '..', 'public', 'icon.ico')

// Resoluciones estándar para iconos de Windows
const SIZES = [16, 24, 32, 48, 64, 128, 256]

async function buildIco(pngBuffers, sizes) {
  const numImages = pngBuffers.length

  // ICO Header: 6 bytes
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)          // reservado
  header.writeUInt16LE(1, 2)          // tipo: 1 = ICO
  header.writeUInt16LE(numImages, 4)  // número de imágenes

  // Cada entrada del directorio: 16 bytes
  const dirSize    = numImages * 16
  const headerSize = 6 + dirSize

  // Calcular offsets
  let offset = headerSize
  const offsets = []
  for (const buf of pngBuffers) {
    offsets.push(offset)
    offset += buf.length
  }

  // Construir directorio
  const dir = Buffer.alloc(dirSize)
  for (let i = 0; i < numImages; i++) {
    const size = sizes[i]
    const off  = i * 16
    dir.writeUInt8(size === 256 ? 0 : size, off)      // ancho (0 = 256)
    dir.writeUInt8(size === 256 ? 0 : size, off + 1)  // alto  (0 = 256)
    dir.writeUInt8(0, off + 2)                         // colores en paleta
    dir.writeUInt8(0, off + 3)                         // reservado
    dir.writeUInt16LE(1, off + 4)                      // planos
    dir.writeUInt16LE(32, off + 6)                     // bits por pixel
    dir.writeUInt32LE(pngBuffers[i].length, off + 8)   // tamaño de datos
    dir.writeUInt32LE(offsets[i], off + 12)            // offset de datos
  }

  return Buffer.concat([header, dir, ...pngBuffers])
}

async function run() {
  console.log('→ Generando icon.ico desde CID.png...')

  const pngBuffers = []
  for (const size of SIZES) {
    const buf = await sharp(src)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    pngBuffers.push(buf)
    console.log(`  ✓ ${size}×${size}px`)
  }

  const icoBuffer = await buildIco(pngBuffers, SIZES)
  fs.writeFileSync(dest, icoBuffer)

  const kb = (icoBuffer.length / 1024).toFixed(1)
  console.log(`\n✅ icon.ico generado (${SIZES.join(', ')} px) — ${kb} KB`)
  console.log(`   → ${dest}`)
}

run().catch(err => {
  console.error('✗ Error:', err.message)
  process.exit(1)
})
