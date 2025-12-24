// Simple file-based store for request data (persists across server restarts)
// In production, replace this with a database
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

interface RequestData {
  requesterEmail: string
  requesterName: string
  submittedAt: string // Store as ISO string for JSON serialization
  // Full form data for PDF regeneration
  companyName: string
  projectSiteName: string
  department: string
  dateOfRequest: string
  requesterPosition: string
  equipmentItems: Array<{
    name: string
    quantity: string
    purpose: string
    requiredDate: string
  }>
  signature: string
  signatureType: 'typed' | 'drawn'
  requesterDate: string
  // Security: Approval token
  approvalToken: string
  tokenExpiresAt?: string // Optional expiration (ISO string)
  tokenUsed?: boolean // Single-use token flag
}

const STORE_FILE = path.join(process.cwd(), '.request-store.json')
const COUNTER_FILE = path.join(process.cwd(), '.request-counter.json')

// Initialize store from file or create new
function loadStore(): Map<string, RequestData> {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf-8')
      const parsed = JSON.parse(data)
      const map = new Map<string, RequestData>()
      Object.entries(parsed).forEach(([key, value]) => {
        map.set(key, value as RequestData)
      })
      return map
    }
  } catch (error) {
    console.error('Error loading request store:', error)
  }
  return new Map<string, RequestData>()
}

// Save store to file
function saveStore(store: Map<string, RequestData>) {
  try {
    const obj = Object.fromEntries(store)
    fs.writeFileSync(STORE_FILE, JSON.stringify(obj, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving request store:', error)
  }
}

// Load counter from file
function loadCounter(): number {
  try {
    if (fs.existsSync(COUNTER_FILE)) {
      const data = fs.readFileSync(COUNTER_FILE, 'utf-8')
      const parsed = JSON.parse(data)
      return parsed.counter || 0
    }
  } catch (error) {
    console.error('Error loading request counter:', error)
  }
  return 0
}

// Save counter to file
function saveCounter(counter: number) {
  try {
    fs.writeFileSync(COUNTER_FILE, JSON.stringify({ counter }, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving request counter:', error)
  }
}

// Initialize
let requestStore = loadStore()
let requestCounter = loadCounter()

export function storeRequest(requestId: string, data: RequestData) {
  // submittedAt is already a string in RequestData interface, so just use it directly
  requestStore.set(requestId, data)
  saveStore(requestStore)
  console.log('Request stored to file:', { requestId, requesterEmail: data.requesterEmail })
}

export function getNextRequestNumber(): number {
  requestCounter++
  saveCounter(requestCounter)
  return requestCounter
}

export function getRequest(requestId: string): RequestData | undefined {
  const data = requestStore.get(requestId)
  if (data) {
    // Convert ISO string back to Date if needed (for compatibility)
    return {
      ...data,
      submittedAt: data.submittedAt // Keep as string for now
    }
  }
  return undefined
}

export function deleteRequest(requestId: string) {
  requestStore.delete(requestId)
  saveStore(requestStore)
}

export function getAllRequestIds(): string[] {
  return Array.from(requestStore.keys())
}

// Generate a secure random token for approval links
export function generateApprovalToken(): string {
  // Use crypto for secure random token generation
  return crypto.randomBytes(32).toString('hex') // 64-character hex string
}

// Verify approval token
export function verifyApprovalToken(requestId: string, token: string): boolean {
  const requestData = getRequest(requestId)
  if (!requestData) {
    return false
  }
  
  // Check if token matches
  if (requestData.approvalToken !== token) {
    return false
  }
  
  // Check if token has been used (single-use)
  if (requestData.tokenUsed === true) {
    return false
  }
  
  // Check if token has expired
  if (requestData.tokenExpiresAt) {
    const expiresAt = new Date(requestData.tokenExpiresAt)
    const now = new Date()
    if (now > expiresAt) {
      return false
    }
  }
  
  return true
}

// Mark token as used (after approval/rejection)
export function markTokenAsUsed(requestId: string) {
  const requestData = getRequest(requestId)
  if (requestData) {
    requestData.tokenUsed = true
    requestStore.set(requestId, requestData)
    saveStore(requestStore)
  }
}

