import { NextRequest, NextResponse } from 'next/server'
import { verifyApprovalToken, getRequest } from '@/utils/requestStore'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const requestId = searchParams.get('requestId')
    const token = searchParams.get('token')

    if (!requestId || !token) {
      return NextResponse.json(
        { valid: false, reason: 'missing' },
        { status: 400 }
      )
    }

    const isValid = verifyApprovalToken(requestId, token)
    
    if (!isValid) {
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
        { valid: false, reason },
        { status: 401 }
      )
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('Error verifying token:', error)
    return NextResponse.json(
      { valid: false, reason: 'error' },
      { status: 500 }
    )
  }
}


