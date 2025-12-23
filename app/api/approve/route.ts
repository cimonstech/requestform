import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getRequest, deleteRequest, getAllRequestIds } from '@/utils/requestStore'

export async function POST(request: NextRequest) {
  console.log('Approval API route called')
  try {
    const body = await request.json()
    console.log('Request body:', { requestId: body.requestId, action: body.action })
    const { requestId, action, approverName, comments, signature, signatureType, approvalDate } = body

    if (!requestId || !action || !approverName) {
      console.log('Missing required fields:', { requestId: !!requestId, action: !!action, approverName: !!approverName })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate SMTP configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 10000, // 10 seconds
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    })

    // For now, we'll send to all recipients. In a real system, you'd look up the requester email from the requestId
    // This is a simplified version - you might want to store request data temporarily or use a database
    const isApproved = action === 'approve'
    const statusText = isApproved ? 'APPROVED' : 'REJECTED'
    const statusColor = isApproved ? '#10b981' : '#ef4444'
    const statusEmoji = isApproved ? '✓' : '✗'

    const emailSubject = `Equipment Request ${statusText} - Request ID: ${requestId}`
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${statusColor}; margin-bottom: 20px;">
          ${statusEmoji} Your Equipment Request Has Been ${statusText}
        </h2>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>Request ID:</strong> ${requestId}</p>
          <p><strong>Approved By:</strong> ${approverName}</p>
          ${approvalDate ? `<p><strong>Date:</strong> ${new Date(approvalDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>` : ''}
          <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
          ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
        </div>
        ${isApproved ? (
          '<p>Your equipment request has been approved. You will be contacted regarding the next steps.</p>'
        ) : (
          '<p>Your equipment request has been rejected. If you have any questions, please contact the approver.</p>'
        )}
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Best regards,<br>Equipment Request System
        </p>
      </div>
    `

    // Get request data
    const requestData = getRequest(requestId)
    console.log('Request data lookup:', { requestId, found: !!requestData })
    
    if (!requestData) {
      const allIds = getAllRequestIds()
      console.log('Request not found in store. Available requests:', allIds)
      console.log('Note: Request store is in-memory and resets on server restart.')
      console.log('To test approval: Submit a new form, then immediately approve it before restarting the server.')
      
      // For testing: Allow approval even if request not found, but we need requester email
      // In production, this should always fail if request not found
      if (process.env.NODE_ENV === 'development') {
        console.warn('DEV MODE: Allowing approval without request data. In production, this would fail.')
        // We can't send email to requester without their email, so we'll still return 404
        // But provide a helpful message
        return NextResponse.json(
          { 
            error: 'Request not found in store. The server may have restarted, clearing the in-memory store. Please submit a new request and approve it immediately, or use a database for production.',
            requestId, 
            availableRequests: allIds,
            hint: 'Submit a new form, then immediately approve it before restarting the server.'
          },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Request not found', requestId, availableRequests: allIds },
        { status: 404 }
      )
    }

    // Send notification email to requester
    const personalizedBody = emailBody.replace(
      '<h2 style="color:',
      `<p>Dear ${requestData.requesterName},</p><h2 style="color:`
    )
    
    const requesterEmailPromise = transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: requestData.requesterEmail,
      subject: emailSubject,
      html: personalizedBody,
    })

    await requesterEmailPromise

    // Clean up stored request (optional - you might want to keep it for records)
    // deleteRequest(requestId)

    return NextResponse.json({ success: true, status: statusText })
  } catch (error) {
    console.error('Error processing approval:', error)
    return NextResponse.json(
      { error: 'Failed to process approval', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

