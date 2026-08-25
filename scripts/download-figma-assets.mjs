import fs from "node:fs/promises"
import path from "node:path"

const ROOT = process.cwd()
const SOURCE_FILE = path.join(ROOT, "src", "figma-asset-urls.ts")
const ASSET_ROOT = path.join(ROOT, "assets", "figma")

const EXT_BY_CONTENT_TYPE = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
}

function parseAssetTable(text) {
  const rows = []
  let group = null
  for (const line of text.split("\n")) {
    const g = line.match(/^  ([a-zA-Z0-9_]+): \{$/)
    if (g) {
      group = g[1]
      continue
    }
    if (group && line.trim() === "},") {
      group = null
      continue
    }
    const m = line.match(/^    ([a-zA-Z0-9_]+): "(https:\/\/www\.figma\.com\/api\/mcp\/asset\/[^"]+)",?$/)
    if (group && m) rows.push({ group, key: m[1], url: m[2] })
  }
  return rows
}

function extFrom(contentType) {
  if (!contentType) return "bin"
  const normalized = contentType.split(";")[0].trim().toLowerCase()
  return EXT_BY_CONTENT_TYPE[normalized] || "bin"
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function downloadAll(rows) {
  const fileMap = {}
  for (const row of rows) {
    const res = await fetch(row.url)
    if (!res.ok) throw new Error(`Failed to download ${row.url}: ${res.status}`)
    const ext = extFrom(res.headers.get("content-type"))
    const dir = path.join(ASSET_ROOT, row.group)
    await ensureDir(dir)
    const filename = `${row.key}.${ext}`
    const abs = path.join(dir, filename)
    const buf = Buffer.from(await res.arrayBuffer())
    await fs.writeFile(abs, buf)
    fileMap[`${row.group}.${row.key}`] = `../assets/figma/${row.group}/${filename}`
    console.log(`Downloaded ${row.group}.${row.key} -> ${filename}`)
  }
  return fileMap
}

function generateTs(rows, fileMap) {
  const grouped = {}
  for (const r of rows) {
    if (!grouped[r.group]) grouped[r.group] = []
    grouped[r.group].push(r.key)
  }
  const lines = []
  lines.push('import { Image } from "react-native"')
  lines.push("")
  lines.push("const toUri = (asset: number): string => Image.resolveAssetSource(asset).uri")
  lines.push("")
  lines.push("export const FIGMA_ASSETS = {")
  for (const [group, keys] of Object.entries(grouped)) {
    lines.push(`  ${group}: {`)
    for (const key of keys) {
      const rel = fileMap[`${group}.${key}`]
      lines.push(`    ${key}: toUri(require("${rel}")),`)
    }
    lines.push("  },")
  }
  lines.push("} as const")
  lines.push("")
  return lines.join("\n")
}

async function main() {
  const sourceText = await fs.readFile(SOURCE_FILE, "utf8")
  const rows = parseAssetTable(sourceText)
  if (!rows.length) throw new Error("No Figma asset URLs found.")
  await ensureDir(ASSET_ROOT)
  const fileMap = await downloadAll(rows)
  const generated = generateTs(rows, fileMap)
  await fs.writeFile(SOURCE_FILE, generated, "utf8")
  console.log(`Downloaded ${rows.length} assets and updated src/figma-asset-urls.ts`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
