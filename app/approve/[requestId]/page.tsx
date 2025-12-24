'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import SignaturePad from '@/components/SignaturePad'

export default function ApprovalPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const requestId = params.requestId as string
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'unauthorized'>('idle')
  const [message, setMessage] = useState('')
  const [approverName, setApproverName] = useState('')
  const [comments, setComments] = useState('')
  const [signatureType, setSignatureType] = useState<'typed' | 'drawn'>('typed')
  const [typedSignature, setTypedSignature] = useState('')
  const [signatureImage, setSignatureImage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  
  // Auto-timestamp for approval date
  const approvalDate = new Date().toISOString().split('T')[0]

  // Verify token on page load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('unauthorized')
        setMessage('Invalid approval link. The link is missing the security token.')
        setIsVerifying(false)
        return
      }

      try {
        const response = await fetch(`/api/verify-token?requestId=${requestId}&token=${token}`)
        const data = await response.json()
        
        if (!response.ok || !data.valid) {
          setStatus('unauthorized')
          if (data.reason === 'expired') {
            setMessage('This approval link has expired. Please request a new approval link.')
          } else if (data.reason === 'used') {
            setMessage('This approval link has already been used. Each link can only be used once for security.')
          } else {
            setMessage('Invalid or unauthorized approval link. Please use the link from your email.')
          }
        } else {
          setStatus('idle')
        }
      } catch (error) {
        setStatus('unauthorized')
        setMessage('Failed to verify approval link. Please try again or contact support.')
      } finally {
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [requestId, token])

  const handleApprove = async () => {
    if (!approverName.trim()) {
      alert('Please enter your name')
      return
    }

    if (signatureType === 'typed' && !typedSignature.trim()) {
      alert('Please provide a typed signature')
      return
    }

    if (signatureType === 'drawn' && !signatureImage) {
      alert('Please provide a signature')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          token, // Include token for verification
          action: 'approve',
          approverName,
          comments,
          signature: signatureType === 'typed' ? typedSignature : signatureImage || '',
          signatureType,
          approvalDate,
        }),
      })

      if (response.ok) {
        setStatus('success')
        setMessage('Request approved successfully! The requester has been notified.')
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Approval error:', errorData)
        throw new Error(errorData.error || 'Failed to approve request')
      }
    } catch (error) {
      setStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setMessage(`There was an error processing your approval: ${errorMessage}. Please try again.`)
      console.error('Approval error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!approverName.trim()) {
      alert('Please enter your name')
      return
    }

    if (signatureType === 'typed' && !typedSignature.trim()) {
      alert('Please provide a typed signature')
      return
    }

    if (signatureType === 'drawn' && !signatureImage) {
      alert('Please provide a signature')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          token, // Include token for verification
          action: 'reject',
          approverName,
          comments,
          signature: signatureType === 'typed' ? typedSignature : signatureImage || '',
          signatureType,
          approvalDate,
        }),
      })

      if (response.ok) {
        setStatus('success')
        setMessage('Request rejected. The requester has been notified.')
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Rejection error:', errorData)
        throw new Error(errorData.error || 'Failed to reject request')
      }
    } catch (error) {
      setStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setMessage(`There was an error processing your rejection: ${errorMessage}. Please try again.`)
      console.error('Rejection error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'success') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Success!</h1>
            <p className="text-gray-600">{message}</p>
          </div>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg hover:from-primary-dark hover:to-primary transition-all font-medium"
          >
            Return to Form
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 p-6 sm:p-8 text-white">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Review Equipment Request</h1>
            <p className="text-blue-50 text-sm sm:text-base">Request ID: {requestId}</p>
          </div>

          <div className="p-6 sm:p-8">
            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
                {message}
              </div>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approved By (Site Engineer / Manager) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="text"
                    value={new Date(approvalDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                    readOnly
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments / Notes (Optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Add any comments or notes about this request..."
                />
              </div>

              {/* Signature Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-primary mb-4">Signature</h3>
                <div className="mb-4">
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="typed"
                        checked={signatureType === 'typed'}
                        onChange={(e) => setSignatureType(e.target.value as 'typed')}
                        className="mr-2"
                      />
                      <span>Typed Name</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="drawn"
                        checked={signatureType === 'drawn'}
                        onChange={(e) => setSignatureType(e.target.value as 'drawn')}
                        className="mr-2"
                      />
                      <span>Freehand Drawing</span>
                    </label>
                  </div>
                </div>
                {signatureType === 'typed' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Signature <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      required
                      placeholder="Type approver name"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                ) : (
                  <SignaturePad
                    onSignatureChange={setSignatureImage}
                  />
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {isSubmitting ? 'Processing...' : '✓ Approve Request'}
                </button>
                <button
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {isSubmitting ? 'Processing...' : '✗ Reject Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

