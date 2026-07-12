import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// POST: Match application against FAQs (auto-responder logic)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await req.json()
    const { exhibitor_id, application_text, application_data = {} } = body

    // Get all FAQs for event
    const { data: faqs, error: faqError } = await supabase
      .from('event_faqs')
      .select('*')
      .eq('event_id', params.id)

    if (faqError) throw faqError

    if (!faqs || faqs.length === 0) {
      // No FAQs configured, manual review required
      return NextResponse.json({
        matched: false,
        reason: 'no_faqs_configured',
        recommended_action: 'manual_review',
      })
    }

    // Get event details
    const { data: event } = await supabase
      .from('events')
      .select('discipline_tags')
      .eq('id', params.id)
      .single()

    const eventDisciplines = event?.discipline_tags || []

    // Extract keywords from application
    const applicationKeywords = extractKeywords({
      text: application_text,
      data: application_data,
    })

    // Score each FAQ against application
    let bestMatch: any = null
    let bestScore = 0
    const threshold = 0.4 // 40% keyword match = acceptable

    for (const faq of faqs) {
      const faqKeywords = faq.keywords || []
      const questionKeywords = extractKeywords({ text: faq.question })

      // Calculate match score
      const matchedKeywords = applicationKeywords.filter(k =>
        faqKeywords.includes(k) || questionKeywords.includes(k)
      )

      const score = faqKeywords.length > 0
        ? matchedKeywords.length / faqKeywords.length
        : 0

      if (score > bestScore) {
        bestScore = score
        bestMatch = {
          id: faq.id,
          question: faq.question,
          answer: faq.answer,
          keywords: faqKeywords,
          score,
        }
      }
    }

    // Determine action
    if (bestScore >= threshold) {
      // Strong match - auto-reject with FAQ answer
      return NextResponse.json({
        matched: true,
        confidence: Math.round(bestScore * 100),
        faq_id: bestMatch.id,
        question: bestMatch.question,
        answer: bestMatch.answer,
        recommended_action: 'auto_reject',
        message: `Your application doesn't match our event theme. Here's some info: ${bestMatch.answer}`,
      })
    } else if (bestScore > 0) {
      // Weak match - flag for manual review
      return NextResponse.json({
        matched: false,
        confidence: Math.round(bestScore * 100),
        best_match: bestMatch.question,
        recommended_action: 'manual_review',
        reason: 'weak_match',
      })
    } else {
      // No match - manual review
      return NextResponse.json({
        matched: false,
        confidence: 0,
        recommended_action: 'manual_review',
        reason: 'no_match',
      })
    }
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error'
    console.error('❌ FAQ matching error:', {
      event_id: params.id,
      error: errorMsg,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      {
        matched: false,
        error: 'FAQ matching failed',
        details: errorMsg,
        recommended_action: 'manual_review',
      },
      { status: 500 }
    )
  }
}

// Helper: Extract keywords from text
function extractKeywords(input: { text?: string; data?: any }): string[] {
  const { text = '', data = {} } = input

  const keywords: string[] = []

  // From text
  if (text) {
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 10) // Top 10 words

    keywords.push(...words)
  }

  // From structured data
  if (data.discipline) keywords.push(data.discipline.toLowerCase())
  if (data.category) keywords.push(data.category.toLowerCase())
  if (data.experience) keywords.push(data.experience.toLowerCase())

  return [...new Set(keywords)].slice(0, 15) // Unique, max 15
}
