/** Hash project name → stable glyph + color for the tab icon */

const GLYPHS = ['◆', '◇', '●', '▲', '■', '✦', '✧', '◉', '⬟', '⬢', '★', '✶']

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function faviconDataUrlFromProjectName(name: string): string {
  const key = name.trim() || 'Project'
  const h = hashString(key)
  const glyph = GLYPHS[h % GLYPHS.length]
  const hue = h % 360
  const sat = 55 + (h % 25)
  const light = 38 + (h % 12)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="hsl(${hue} ${sat}% ${light}%)"/>
  <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.95)" font-family="system-ui,Segoe UI,sans-serif" font-size="15" font-weight="700">${glyph}</text>
</svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
