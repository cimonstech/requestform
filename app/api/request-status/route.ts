import { NextRequest, NextResponse } from 'next/server'
import { getRequest } from '@/utils/requestStore'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const requestId = searchParams.get('requestId')

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    const requestData = getRequest(requestId)
    
    if (!requestData) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: requestData.approvalStatus || 'pending',
      approvedBy: requestData.approvedBy,
      approvalDate: requestData.approvalDate,
      approvalComments: requestData.approvalComments,
    })
  } catch (error) {
    console.error('Error getting request status:', error)
    return NextResponse.json(
      { error: 'Failed to get request status' },
      { status: 500 }
    )
  }
}

