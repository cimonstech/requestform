import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getRequest, deleteRequest, getAllRequestIds, verifyApprovalToken, markTokenAsUsed, updateApprovalStatus } from '@/utils/requestStore'
import { generatePDF } from '@/utils/pdfGenerator'

// Force dynamic rendering (uses FormData and file operations)
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  console.log('Approval API route called')
  try {
    const body = await request.json()
    console.log('Request body:', { requestId: body.requestId, action: body.action })
    const { requestId, token, action, approverName, comments, signature, signatureType, approvalDate } = body

    if (!requestId || !action || !approverName) {
      console.log('Missing required fields:', { requestId: !!requestId, action: !!action, approverName: !!approverName })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify security token
    if (!token) {
      return NextResponse.json(
        { error: 'Missing security token. Invalid approval link.' },
        { status: 401 }
      )
    }

    const isValidToken = verifyApprovalToken(requestId, token)
    if (!isValidToken) {
      const requestData = getRequest(requestId)
      let reason = 'invalid'
      if (requestData) {
        if (requestData.tokenUsed) {
          reason = 'used'
        } else if (requestData.tokenExpiresAt && new Date() > new Date(requestData.tokenExpiresAt)) {
          reason = 'expired'
        }
      }
      return NextResponse.json(
        { error: 'Invalid or unauthorized approval token', reason },
        { status: 401 }
      )
    }

    // Validate SMTP configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    // Create transporter with optimized settings (same as send-email route)
    const createTransporter = (port: number, secure: boolean) => {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: port,
        secure: secure, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000, // 30 seconds
        socketTimeout: 60000, // 60 seconds
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates
        },
        requireTLS: !secure, // Require TLS for non-SSL ports
        debug: false, // Disable verbose debug logging
        logger: false, // Disable logger to improve performance
      })
    }

    // Try port 465 first (SSL) since it's more reliable, fallback to 587 if needed
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465
    let transporter = createTransporter(smtpPort, smtpPort === 465)
    let usePort465 = smtpPort === 465
    
    // Skip SMTP verification to speed up the process
    console.log(`Using SMTP port ${smtpPort} (${usePort465 ? 'SSL' : 'TLS'}) for approval email`)

    // Email sender name
    const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER || ''
    const senderName = 'RequestsbyCimons'
    const fromAddress = `${senderName} <${senderEmail}>`
    
    // Footer for all emails
    const emailFooter = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
        <p style="margin: 5px 0;">Powered by <a href="https://wa.me/233553018172" style="color: #2563eb; text-decoration: none; font-weight: 600;">Cimons Technologies</a></p>
      </div>
    `

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
        <p style="margin-top: 20px; padding: 15px; background-color: #e0f2fe; border-left: 4px solid #2563eb; border-radius: 4px;">
          <strong>📎 Attached:</strong> A complete PDF copy of your ${statusText.toLowerCase()} request is attached to this email for your records.
        </p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Best regards,<br>Equipment Request System
        </p>
        ${emailFooter}
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

    // Generate PDF with approval information
    const approvedPdfBlob = await generatePDF({
      companyName: requestData.companyName || '',
      projectSiteName: requestData.projectSiteName || '',
      department: requestData.department || '',
      dateOfRequest: requestData.dateOfRequest || '',
      requesterName: requestData.requesterName,
      requesterEmail: requestData.requesterEmail,
      requesterPosition: requestData.requesterPosition || '',
      equipmentItems: requestData.equipmentItems || [],
      signature: requestData.signature || '',
      signatureType: requestData.signatureType || 'typed',
      requesterDate: requestData.requesterDate || '',
      approvedBy: approverName,
      approvalSignature: signature || '',
      approvalSignatureType: signatureType || 'typed',
      approvalDate: approvalDate || new Date().toISOString().split('T')[0],
      isApproved: isApproved, // Pass approval status for stamp
    })

    // Convert PDF blob to buffer for email attachment
    const pdfArrayBuffer = await approvedPdfBlob.arrayBuffer()
    const pdfBuffer = Buffer.from(pdfArrayBuffer)

    // Mark token as used and store approval status FIRST (so approval succeeds even if email fails)
    markTokenAsUsed(requestId)
    
    // Store approval status in request data
    updateApprovalStatus(
      requestId,
      isApproved ? 'approved' : 'rejected',
      approverName,
      approvalDate || new Date().toISOString().split('T')[0],
      comments
    )

    // Send notification email to requester with approved PDF (async, non-blocking)
    const personalizedBody = emailBody.replace(
      '<h2 style="color:',
      `<p>Dear ${requestData.requesterName},</p><h2 style="color:`
    )
    
    // Send email asynchronously (don't wait for it)
    const sendEmailAsync = async () => {
      try {
        await transporter.sendMail({
          from: fromAddress,
          to: requestData.requesterEmail,
          subject: emailSubject,
          html: personalizedBody,
          attachments: [
            {
              filename: `equipment-request-${statusText.toLowerCase()}-${requestId}.pdf`,
              content: pdfBuffer,
            },
          ],
        })
        console.log(`Approval email sent successfully to ${requestData.requesterEmail}`)
      } catch (emailErr) {
        console.error('Failed to send approval email:', emailErr instanceof Error ? emailErr.message : 'Unknown error')
        // Try fallback port if first attempt fails (465 -> 587 or 587 -> 465)
        const fallbackPort = usePort465 ? 587 : 465
        try {
          console.log(`Trying fallback port ${fallbackPort} for approval email`)
          const fallbackTransporter = createTransporter(fallbackPort, fallbackPort === 465)
          await fallbackTransporter.sendMail({
            from: fromAddress,
            to: requestData.requesterEmail,
            subject: emailSubject,
            html: personalizedBody,
            attachments: [
              {
                filename: `equipment-request-${statusText.toLowerCase()}-${requestId}.pdf`,
                content: pdfBuffer,
              },
            ],
          })
          console.log(`Approval email sent via fallback port ${fallbackPort}`)
        } catch (fallbackErr) {
          console.error('Fallback email sending also failed:', fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error')
        }
      }
    }

    // Start sending email in background (don't await)
    sendEmailAsync().catch(err => {
      console.error('Background approval email sending failed:', err)
    })

    // Return success immediately - email is being sent in background
    return NextResponse.json({ 
      success: true, 
      status: statusText,
      message: 'Approval processed successfully. Email notification is being sent in the background.'
    })
  } catch (error) {
    console.error('Error processing approval:', error)
    return NextResponse.json(
      { error: 'Failed to process approval', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

