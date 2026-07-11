'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'

interface ReportButtonProps {
  reportedUserId?: string
  reportedPostId?: string
  reportedEventId?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ReportButton({
  reportedUserId,
  reportedPostId,
  reportedEventId,
  size = 'sm',
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) return

    setIsLoading(true)
    try {
      // Get token from localStorage or auth context
      const token = localStorage.getItem('auth_token') || ''
      if (!token) {
        setStatus('error')
        setErrorMsg('You must be logged in to report')
        return
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reported_user_id: reportedUserId || null,
          reported_post_id: reportedPostId || null,
          reported_event_id: reportedEventId || null,
          reason,
          description: description || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit report')
      }

      setStatus('success')
      setReason('')
      setDescription('')
      setTimeout(() => {
        setIsOpen(false)
        setStatus('idle')
      }, 2000)
    } catch (error: any) {
      setStatus('error')
      setErrorMsg(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24
  const buttonClass = size === 'sm' ? 'p-1.5' : size === 'md' ? 'p-2' : 'p-3'

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`${buttonClass} text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50`}
        title="Report this content"
      >
        <Flag size={iconSize} />
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <Flag size={24} className="text-red-500" />
          <h2 className="text-xl font-bold">Report Content</h2>
        </div>

        {status === 'success' && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✅ Report submitted successfully. Our team will review within 24-48 hours.
          </div>
        )}

        {status === 'error' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ❌ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Why are you reporting this?
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={isLoading}
            >
              <option value="">Select a reason...</option>
              <option value="spam">Spam or scam</option>
              <option value="harassment">Harassment or bullying</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="copyright">Copyright violation</option>
              <option value="fraud">Fraud or deception</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us more about why you're reporting this..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason || isLoading || status === 'success'}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 mt-4 text-center">
          False reports may result in account suspension. Our team reviews all reports carefully.
        </p>
      </div>
    </div>
  )
}
