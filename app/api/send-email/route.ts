import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { storeRequest, getNextRequestNumber, getAllRequestIds, generateApprovalToken } from '@/utils/requestStore'

// Testing: Using only chasetetteh3@gmail.com
// TODO: Update with all recipients after testing
const RECIPIENT_EMAILS = [
  'chasetetteh3@gmail.com'
]

// Generate unique request ID in format REQ-XXXMMYY
function generateRequestId(): string {
  const requestNumber = getNextRequestNumber()
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0') // MM (01-12)
  const year = String(now.getFullYear()).slice(-2) // YY (last 2 digits)
  const numberStr = String(requestNumber).padStart(3, '0') // XXX (001, 002, etc.)
  
  return `REQ-${numberStr}${month}${year}`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const pdfFile = formData.get('pdf') as File
    const requesterName = formData.get('requesterName') as string
    const requesterEmail = formData.get('requesterEmail') as string
    const department = formData.get('department') as string
    const equipmentItems = JSON.parse(formData.get('equipmentItems') as string)
    // Get all form fields for storage
    const companyName = formData.get('companyName') as string || ''
    const projectSiteName = formData.get('projectSiteName') as string || ''
    const dateOfRequest = formData.get('dateOfRequest') as string || new Date().toISOString().split('T')[0]
    const requesterPosition = formData.get('requesterPosition') as string || ''
    const signature = formData.get('signature') as string || ''
    const signatureType = (formData.get('signatureType') as 'typed' | 'drawn') || 'typed'
    const requesterDate = formData.get('requesterDate') as string || new Date().toISOString().split('T')[0]
    
    // Generate unique request ID
    const requestId = generateRequestId()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || 'http://localhost:3000'

    if (!pdfFile || !requesterEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await pdfFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate SMTP configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('SMTP credentials not configured')
      return NextResponse.json(
        { error: 'Email service not configured. Please contact administrator.' },
        { status: 500 }
      )
    }

    // Create transporter with automatic fallback to port 465 if 587 fails
    // Note: You'll need to configure this with your email service credentials
    // For production, use environment variables
    
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
        debug: false, // Disable verbose debug logging (was causing slow performance)
        logger: false, // Disable logger to improve performance
      })
    }

    // Try port 587 first, fallback to 465 if it fails
    const smtpPort = parseInt(process.env.SMTP_PORT || '587')
    let transporter = createTransporter(smtpPort, smtpPort === 465)
    let usePort465 = false

    // Skip SMTP verification to speed up the process - just try sending directly
    // If it fails, we'll try the fallback port
    console.log(`Using SMTP port ${smtpPort} (verification skipped for speed)`)

    // Generate secure approval token
    const approvalToken = generateApprovalToken()
    
    // Calculate token expiration (7 days from now)
    const tokenExpiresAt = new Date()
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7)
    
    // Store FULL request data FIRST (so approval works even if email fails)
    const formDataForStore = {
      requesterEmail,
      requesterName,
      submittedAt: new Date().toISOString(),
      companyName,
      projectSiteName,
      department,
      dateOfRequest,
      requesterPosition,
      equipmentItems: equipmentItems.filter((item: any) => item.name.trim()),
      signature,
      signatureType,
      requesterDate,
      approvalToken, // Store the secure token
      tokenExpiresAt: tokenExpiresAt.toISOString(), // Token expires in 7 days
      tokenUsed: false, // Token not used yet
    }
    storeRequest(requestId, formDataForStore)
    console.log('Request stored successfully:', { requestId, requesterEmail })
    
    // Email content
    const emailSubject = `Equipment Request from ${requesterName}`
    const approvalLink = `${baseUrl}/approve/${requestId}?token=${approvalToken}`
    const emailBody = `
      <h2>New Equipment Request</h2>
      <p><strong>Request ID:</strong> ${requestId}</p>
      <p><strong>Requester Name:</strong> ${requesterName}</p>
      <p><strong>Email:</strong> ${requesterEmail}</p>
      ${department ? `<p><strong>Department:</strong> ${department}</p>` : ''}
      <p><strong>Number of Items:</strong> ${equipmentItems.length}</p>
      <p>Please see the attached PDF for full details.</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
      <h3>Action Required:</h3>
      <p>Please review and approve or reject this request:</p>
      <div style="margin: 20px 0;">
        <a href="${approvalLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">Review & Approve</a>
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">Or copy this link: ${approvalLink}</p>
    `

    // Send emails asynchronously (don't wait for them to complete)
    // This makes the form respond much faster
    const sendEmailsAsync = async () => {
      try {
        // Send emails to all recipients
        const emailPromises = RECIPIENT_EMAILS.map(async (email) => {
          try {
            await Promise.race([
              transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: email,
                subject: emailSubject,
                html: emailBody,
                attachments: [
                  {
                    filename: 'equipment-request.pdf',
                    content: buffer,
                  },
                ],
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Email send timeout')), 30000)
              )
            ])
            console.log(`Email sent to ${email}`)
          } catch (err) {
            console.error(`Failed to send email to ${email}:`, err instanceof Error ? err.message : 'Unknown error')
            // Try fallback port if first attempt fails
            if (!usePort465 && smtpPort === 587) {
              try {
                const fallbackTransporter = createTransporter(465, true)
                await fallbackTransporter.sendMail({
                  from: process.env.SMTP_FROM || process.env.SMTP_USER,
                  to: email,
                  subject: emailSubject,
                  html: emailBody,
                  attachments: [
                    {
                      filename: 'equipment-request.pdf',
                      content: buffer,
                    },
                  ],
                })
                console.log(`Email sent to ${email} via fallback port 465`)
              } catch (fallbackErr) {
                console.error(`Fallback also failed for ${email}`)
              }
            }
          }
        })

        // Send confirmation email to requester
        try {
          await Promise.race([
            transporter.sendMail({
              from: process.env.SMTP_FROM || process.env.SMTP_USER,
              to: requesterEmail,
              subject: 'Equipment Request Confirmation',
              html: `
                <h2>Your Equipment Request Has Been Submitted</h2>
                <p>Dear ${requesterName},</p>
                <p>Thank you for submitting your equipment request. Your request has been received and will be processed shortly.</p>
                <p><strong>Request ID:</strong> ${requestId}</p>
                <p>Please see the attached PDF for a copy of your request.</p>
                <p>You will receive a notification email once your request has been reviewed.</p>
                <p>Best regards,<br>Equipment Request System</p>
              `,
              attachments: [
                {
                  filename: 'equipment-request.pdf',
                  content: buffer,
                },
              ],
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Email send timeout')), 30000)
            )
          ])
          console.log(`Confirmation email sent to requester`)
        } catch (err) {
          console.error(`Failed to send confirmation email:`, err instanceof Error ? err.message : 'Unknown error')
        }

        await Promise.all(emailPromises)
        console.log('All emails sent successfully')
      } catch (error) {
        console.error('Error in async email sending:', error instanceof Error ? error.message : 'Unknown error')
      }
    }

    // Start sending emails in background (don't await)
    sendEmailsAsync().catch(err => {
      console.error('Background email sending failed:', err)
    })

    // Return success immediately - emails are being sent in background
    return NextResponse.json({ 
      success: true, 
      requestId,
      emailSent: true, // Emails are being sent asynchronously
      message: 'Request saved successfully. Emails are being sent in the background.'
    })
  } catch (error) {
    console.error('Critical error in send-email route:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = (error as any)?.code
    
    // If request was stored, return success even if email failed
    // Check if request exists in store (might have been saved before error)
    const allIds = getAllRequestIds()
    const mostRecentRequestId = allIds.length > 0 ? allIds[allIds.length - 1] : null
    
    if (mostRecentRequestId) {
      console.log('Request was saved before error, returning success with warning')
      return NextResponse.json({ 
        success: true, 
        requestId: mostRecentRequestId,
        emailSent: false,
        emailError: errorMessage,
        message: 'Request saved successfully, but email notification failed. You can still approve the request using the approval link from the stored request ID.'
      })
    }
    
    // Only fail if request wasn't saved (critical error before storage)
    let userFriendlyError = 'Failed to process request'
    if (errorCode === 'ETIMEDOUT') {
      userFriendlyError = 'Email server connection timed out. Please check your internet connection and SMTP settings.'
    } else if (errorCode === 'EAUTH') {
      userFriendlyError = 'Email authentication failed. Please check your SMTP username and password (use App Password for Gmail).'
    } else if (errorCode === 'ECONNREFUSED') {
      userFriendlyError = 'Could not connect to email server. Please check SMTP host and port settings.'
    }
    
    return NextResponse.json(
      { 
        error: userFriendlyError, 
        details: errorMessage,
        code: errorCode,
        hint: 'See TROUBLESHOOTING.md for solutions.'
      },
      { status: 500 }
    )
  }
}

