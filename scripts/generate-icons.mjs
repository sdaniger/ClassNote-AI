import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync, readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const assetsDir = join(root, 'apps/mobile/assets')
const androidResDir = join(root, 'apps/mobile/android/app/src/main/res')

const ANDROID_SIZES = [
  ['mipmap-mdpi', 48],
  ['mipmap-hdpi', 72],
  ['mipmap-xhdpi', 96],
  ['mipmap-xxhdpi', 144],
  ['mipmap-xxxhdpi', 192],
]

const DRAWABLE_SIZES = [
  ['drawable-hdpi', 72],
  ['drawable-mdpi', 48],
  ['drawable-xhdpi', 96],
  ['drawable-xxhdpi', 144],
  ['drawable-xxxhdpi', 192],
]

const BRAND_BLUE = '#2563EB'
const BRAND_DARK = '#1E40AF'

function bgSvg(w, h, r) {
  const rx = r || w * 0.22
  return Buffer.from(
    `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${BRAND_BLUE}"/><stop offset="1" stop-color="${BRAND_DARK}"/>
      </linearGradient></defs>
      <rect width="${w}" height="${h}" rx="${rx}" fill="url(#g)"/>
    </svg>`
  )
}

function noteSvg(size) {
  const cw = size * 0.48, ch = size * 0.56
  const cx = (size - cw) / 2, cy = (size - ch) / 2
  const cr = cw * 0.18
  const lines = [
    { x: cw * 0.15, w: cw * 0.40, y: ch * 0.20 },
    { x: cw * 0.15, w: cw * 0.50, y: ch * 0.35 },
    { x: cw * 0.15, w: cw * 0.35, y: ch * 0.50 },
  ].map(l => `<rect x="${cx + l.x}" y="${cy + l.y}" width="${l.w}" height="${ch * 0.04}" rx="2"/>`).join('')
  return Buffer.from(
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <g fill="#fff">
        <rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="${cr}" ry="${cr}"/>
        <rect x="${cx + cw * 0.1}" y="${cy + ch * 0.85}" width="${cw * 0.25}" height="${ch * 0.12}" rx="2"/>
        <line x1="${cx + cw * 0.1}" y1="${cy + ch * 0.91}" x2="${cx + cw * 0.35}" y2="${cy + ch * 0.91}" stroke="#fff" stroke-width="${ch * 0.03}" stroke-linecap="round"/>
        ${lines}
      </g>
    </svg>`
  )
}

async function genIcon(size, filepath) {
  await sharp(bgSvg(size, size, size * 0.22))
    .composite([{ input: noteSvg(size), top: 0, left: 0 }])
    .webp({ lossless: true })
    .toFile(filepath)
}

async function genForeground(size, filepath) {
  const inner = Math.round(size * 0.72)
  const off = Math.round((size - inner) / 2)
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: noteSvg(inner), top: off, left: off }])
    .webp({ lossless: true })
    .toFile(filepath)
}

async function genSplashLogo(size, filepath) {
  await sharp(bgSvg(size, size, 0))
    .composite([{ input: noteSvg(Math.round(size * 0.35)), top: Math.round(size * 0.325), left: Math.round(size * 0.325) }])
    .png()
    .toFile(filepath)
}

async function genPngIcon(size, filepath) {
  await sharp(bgSvg(size, size, size * 0.22))
    .composite([{ input: noteSvg(size), top: 0, left: 0 }])
    .png()
    .toFile(filepath)
}

async function genPngForeground(size, filepath) {
  const inner = Math.round(size * 0.72)
  const off = Math.round((size - inner) / 2)
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: noteSvg(inner), top: off, left: off }])
    .png()
    .toFile(filepath)
}

async function main() {
  console.log('=== Generating asset icons (PNG) ===')
  await genPngIcon(1024, join(assetsDir, 'icon.png'))
  await genPngForeground(1024, join(assetsDir, 'adaptive-icon.png'))
  // splash-icon: simple centered logo on blue
  await sharp(bgSvg(1024, 1024, 0))
    .composite([{ input: noteSvg(256), top: 384, left: 384 }])
    .png()
    .toFile(join(assetsDir, 'splash-icon.png'))
  console.log('  assets/*.png done')

  console.log('\n=== Generating Android mipmap icons (WebP) ===')
  for (const [dir, size] of ANDROID_SIZES) {
    const td = join(androidResDir, dir)
    if (!existsSync(td)) mkdirSync(td, { recursive: true })
    await genIcon(size, join(td, 'ic_launcher.webp'))
    await genIcon(size, join(td, 'ic_launcher_round.webp'))
    await genForeground(size, join(td, 'ic_launcher_foreground.webp'))
    console.log(`  ${dir}/ done`)
  }

  console.log('\n=== Generating splash screen logos (WebP) ===')
  for (const [dir, size] of DRAWABLE_SIZES) {
    const td = join(androidResDir, dir)
    if (!existsSync(td)) mkdirSync(td, { recursive: true })
    await genSplashLogo(size, join(td, 'splashscreen_logo.png'))
    console.log(`  ${dir}/splashscreen_logo.png done`)
  }

  console.log('\n✅ All icons generated!')
}

main().catch(console.error)
