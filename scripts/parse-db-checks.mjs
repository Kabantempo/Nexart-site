#!/usr/bin/env node
import { readFileSync } from 'fs'

const src = readFileSync('tests/config.ts', 'utf8')
const checks = []
const lines = src.split('\n')
let inBlock = false
let obj = {}

for (const line of lines) {
  if (line.includes('DB_CHECKS')) inBlock = true
  if (!inBlock) continue

  const label = line.match(/label:\s*'([^']+)'/) ?? line.match(/label:\s*"([^"]+)"/)
  const sql   = line.match(/sql:\s*"([^"]+)"/)
  const min   = line.match(/min:\s*(\d+)/)
  const mode  = line.match(/mode:\s*'([^']+)'/) ?? line.match(/mode:\s*"([^"]+)"/)

  if (label) obj.label = label[1]
  if (sql)   obj.sql   = sql[1]
  if (min)   obj.min   = parseInt(min[1])
  if (mode)  obj.mode  = mode[1]

  if (obj.label && obj.sql !== undefined && obj.min !== undefined) {
    if (!obj.mode) obj.mode = 'gte'
    checks.push({ ...obj })
    obj = {}
  }

  if (line.trim() === ']') break
}

console.log(JSON.stringify(checks))
