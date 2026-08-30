const fs = require('fs')
const path = require('path')

let fixedCount = 0

function fixContent(content) {
  // Replace next/dist followed by backslash-separated segments
  // Works for both single and double backslash in the source
  return content
    .replace(/next\/dist(?:\\{1,2}[a-zA-Z0-9._-]+)+/g, (match) => {
      return match.replace(/\\+/g, '/')
    })
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkDir(full)
    } else if (entry.name.endsWith('.js')) {
      const orig = fs.readFileSync(full, 'utf8')
      const fixed = fixContent(orig)
      if (fixed !== orig) {
        fs.writeFileSync(full, fixed)
        fixedCount++
        console.log('Fixed:', full)
      }
    }
  }
}

const dirs = [
  path.join(__dirname, '..', '.next', 'standalone', '.next', 'server'),
  path.join(__dirname, '..', '.next', 'server'),
]

for (const dir of dirs) {
  walkDir(dir)
}

console.log(`\nTotal fixed: ${fixedCount}`)
