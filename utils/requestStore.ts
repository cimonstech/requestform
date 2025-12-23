// Simple file-based store for request data (persists across server restarts)
// In production, replace this with a database
import fs from 'fs'
import path from 'path'

interface RequestData {
  requesterEmail: string
  requesterName: string
  submittedAt: string // Store as ISO string for JSON serialization
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
  // Convert Date to ISO string for storage
  const storeData: RequestData = {
    ...data,
    submittedAt: data.submittedAt instanceof Date ? data.submittedAt.toISOString() : data.submittedAt
  }
  requestStore.set(requestId, storeData)
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

