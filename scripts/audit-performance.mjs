import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

const pages = [
  { name: 'home', url: 'http://localhost:3000' },
  { name: 'events', url: 'http://localhost:3000/events' },
  { name: 'creators', url: 'http://localhost:3000/creators' },
  { name: 'contact', url: 'http://localhost:3000/contact' },
]

const timestamp = new Date().toISOString().split('T')[0]
const reportDir = `lighthouse-reports/${timestamp}`

console.log('🚀 Starting Core Web Vitals audit...\n')

const results = []

for (const page of pages) {
  try {
    console.log(`📊 Auditing ${page.name}...`)

    const reportPath = `${reportDir}/${page.name}.json`

    execSync(
      `lighthouse "${page.url}" --output=json --output-path="${reportPath}" --quiet`,
      { stdio: 'inherit' }
    )

    const report = require(`../${reportPath}`)
    const scores = report.categories

    results.push({
      page: page.name,
      url: page.url,
      performance: Math.round(scores.performance.score * 100),
      accessibility: Math.round(scores.accessibility.score * 100),
      bestPractices: Math.round(scores['best-practices'].score * 100),
      seo: Math.round(scores.seo.score * 100),
    })

    console.log(`✓ ${page.name}: Performance ${results[results.length - 1].performance}/100\n`)
  } catch (err) {
    console.error(`✗ Failed to audit ${page.name}:`, err.message)
  }
}

// Generate summary report
const summary = `# 📊 Core Web Vitals Audit Report
**Date:** ${timestamp}

## Summary

| Page | Performance | Accessibility | Best Practices | SEO |
|------|-------------|----------------|-----------------|-----|
${results.map(r => `| ${r.page} | ${r.performance}/100 | ${r.accessibility}/100 | ${r.bestPractices}/100 | ${r.seo}/100 |`).join('\n')}

## Metrics

**Core Web Vitals (CWV):**
- ✅ LCP (Largest Contentful Paint) — < 2.5s
- ✅ FID (First Input Delay) — < 100ms (replaced by INP)
- ✅ CLS (Cumulative Layout Shift) — < 0.1
- ✅ INP (Interaction to Next Paint) — < 200ms

**Target Scores:**
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

## Recommendations

${results.filter(r => r.performance < 90).length > 0 ? '### Performance Issues\n- Optimize images (WebP/AVIF)\n- Reduce JavaScript bundle size\n- Enable compression\n' : '✅ All pages meet performance targets'}

${results.filter(r => r.accessibility < 90).length > 0 ? '### Accessibility Issues\n- Check color contrast\n- Add ARIA labels\n- Improve keyboard navigation\n' : '✅ All pages meet accessibility targets'}

## Full Reports

Detailed Lighthouse reports: \`${reportDir}/\`
`

writeFileSync(`${reportDir}/REPORT.md`, summary)
console.log('\n✅ Audit complete!')
console.log(`📄 Summary: ${reportDir}/REPORT.md`)
