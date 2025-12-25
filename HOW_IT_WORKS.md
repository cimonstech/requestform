# How the Equipment Request Form Works

## Overview

This is a complete equipment request management system that allows users to submit equipment requests, which are then reviewed and approved/rejected by managers via email-based approval links.

---

## System Architecture

### Components
1. **Frontend Form** (`app/page.tsx`, `components/EquipmentRequestForm.tsx`)
2. **API Routes** (`app/api/send-email`, `app/api/approve`, `app/api/verify-token`, `app/api/request-status`)
3. **PDF Generator** (`utils/pdfGenerator.ts`)
4. **Request Storage** (`utils/requestStore.ts`)
5. **Approval Page** (`app/approve/[requestId]/page.tsx`)

---

## Complete Workflow

### 1. Form Submission

**User fills out the form:**
- Company Name
- Project/Site Name
- Department
- Date of Request (auto-timestamped, not editable)
- Requester Details:
  - Name
  - Email
  - Position
  - Signature (typed or drawn)
- Equipment Items (dynamic rows):
  - Equipment Description
  - Quantity (must be integer)
  - Purpose/Use
  - Required Date (must not be in the past)

**Form Validation:**
- Quantity: Must be a valid integer
- Email: Must be valid email format
- Required Date: Cannot be a past date
- All required fields must be filled

**On Submit:**
1. Form data is validated
2. Request ID is generated: `REQ-XXXMMYY` format
   - `XXX` = Sequential number (001, 002, 003...)
   - `MM` = Month (01-12)
   - `YY` = Year (last 2 digits)
   - Example: `REQ-0011225` = Request #1, December 2025

---

### 2. Request Processing

**When form is submitted (`/api/send-email`):**

1. **Request ID Generation:**
   - Counter is read from `.request-counter.json`
   - Incremented and saved
   - Combined with current month/year

2. **Secure Token Generation:**
   - Generates a cryptographically secure random token (32 bytes, hex encoded = 64 characters)
   - Token is unique and unpredictable
   - Example: `a1b2c3d4e5f6...` (64 characters)

3. **Token Expiry:**
   - **Expiration Time:** 7 days from submission
   - Stored as ISO timestamp: `tokenExpiresAt`
   - After 7 days, the token becomes invalid

4. **Request Storage:**
   - Full request data saved to `.request-store.json`
   - Includes:
     - All form fields
     - Signature (base64 image if drawn)
     - Request ID
     - Submission timestamp
     - Approval token
     - Token expiry date
     - Token usage status (`tokenUsed: false`)
     - Approval status (`approvalStatus: 'pending'`)

5. **PDF Generation:**
   - Creates professional PDF with:
     - Light gray background
     - Light blue vertical strip
     - Header with gear icon
     - All form data in organized sections
     - Signature images (both requester and approver)
     - "Powered by Cimons Technologies" footer

6. **Email Sending (Asynchronous):**
   - **To Approvers** (3 recipients):
     - `ddickson@azmonlimited.com`
     - `kanfram@gmail.com`
     - `chasetetteh3@gmail.com`
   - **Email Content:**
     - Request summary
     - Request ID
     - **Approval Link:** `https://azmon.cimonstech.cloud/approve/REQ-XXXMMYY?token=SECURE_TOKEN`
     - PDF attachment (equipment-request.pdf)
   - **To Requester:**
     - Confirmation email
     - Copy of submitted request (PDF attachment)
   - **Email Sender:** "RequestsbyCimons"
   - **Footer:** "Powered by Cimons Technologies" with WhatsApp link

---

### 3. Approval Workflow

#### Step 1: Approver Receives Email

- Approver clicks the approval link in the email
- Link format: `/approve/REQ-XXXMMYY?token=SECURE_TOKEN`

#### Step 2: Token Verification (`/api/verify-token`)

**Security Checks Performed:**

1. **Token Existence:**
   - Verifies token exists in request data
   - Returns `valid: false, reason: 'missing'` if not found

2. **Token Expiry Check:**
   - Compares current time with `tokenExpiresAt`
   - If expired: Returns `valid: false, reason: 'expired'`
   - **Expiry Time:** 7 days from submission

3. **Token Usage Check:**
   - Checks if `tokenUsed === true`
   - If already used: Returns `valid: false, reason: 'used'`
   - **Single-Use Token:** Once used, cannot be used again

4. **Token Match:**
   - Verifies provided token matches stored token
   - Uses secure comparison to prevent timing attacks

**If Token is Invalid:**
- Approval page shows "Unauthorized Access" message
- Displays reason (expired, used, invalid)
- Shows current approval status if already processed
- Prevents any approval action

**If Token is Valid:**
- Approval page loads with request details
- Shows all form data
- Displays PDF preview

#### Step 3: Approval Status Check (`/api/request-status`)

**Before showing approval form, system checks:**
- Current approval status (`pending`, `approved`, `rejected`)
- If already approved/rejected:
  - Shows clear message: "This request has already been [APPROVED/REJECTED]"
  - Displays approver name and date
  - Shows comments if provided
  - Prevents duplicate approvals

#### Step 4: Approver Reviews Request

**Approval Page Shows:**
- All original request details
- Equipment items table
- Requester signature
- PDF preview

**Approver Fills:**
- Approved By: Manager name
- Date: Auto-timestamped (not editable)
- Signature: Typed name or drawn signature
- Comments: Optional notes
- Action: Approve or Reject button

#### Step 5: Approval Submission (`/api/approve`)

**When Approver Submits:**

1. **Token Verification (Again):**
   - Re-verifies token is valid, not expired, not used
   - Prevents unauthorized approvals

2. **Status Check:**
   - Verifies request is still `pending`
   - Prevents double approvals

3. **Token Marking:**
   - Marks token as used: `tokenUsed = true`
   - Prevents reuse of the same link

4. **Status Update:**
   - Updates `approvalStatus`: `'approved'` or `'rejected'`
   - Stores `approvedBy`: Manager name
   - Stores `approvalDate`: Current timestamp
   - Stores `approvalComments`: Optional comments

5. **PDF Regeneration:**
   - Generates new PDF with approval details
   - Adds approval/rejection stamp:
     - **APPROVED**: Green stamp (top-right)
     - **REJECTED**: Red stamp (top-right)
   - Includes approver signature
   - Includes approval date

6. **Email to Requester:**
   - Subject: "Equipment Request [APPROVED/REJECTED]"
   - Personalized message
   - **Attached PDF:** Approved/rejected version with stamp
   - Footer: "Powered by Cimons Technologies"

---

## Security Features

### 1. Secure Token Generation
- **Method:** Cryptographically secure random bytes
- **Length:** 64 hexadecimal characters (32 bytes)
- **Uniqueness:** Virtually impossible to guess or brute-force
- **Storage:** Stored securely in request data

### 2. Token Expiry
- **Duration:** 7 days from request submission
- **Purpose:** Prevents use of old/stale approval links
- **Enforcement:** Checked on both page load and submission
- **Expired Token Response:** Clear error message, no action allowed

### 3. Single-Use Tokens
- **Mechanism:** `tokenUsed` flag set to `true` after first use
- **Purpose:** Prevents multiple approvals from same link
- **Enforcement:** Checked before any approval action
- **Used Token Response:** Shows current status, prevents action

### 4. Status Tracking
- **Prevents Double Approvals:**
  - Checks `approvalStatus` before processing
  - Shows clear message if already processed
  - Displays who approved and when

### 5. Secure Comparison
- Token comparison uses secure methods
- Prevents timing attacks
- Validates token format

---

## Data Storage

### File-Based Storage (Development/VPS)

**Files:**
- `.request-store.json`: All request data
- `.request-counter.json`: Request counter

**Structure:**
```json
{
  "REQ-0011225": {
    "requesterEmail": "user@example.com",
    "requesterName": "John Doe",
    "submittedAt": "2025-12-24T10:30:00.000Z",
    "companyName": "Company Name",
    "projectSiteName": "Project Name",
    "department": "IT",
    "dateOfRequest": "2025-12-24",
    "requesterPosition": "Manager",
    "equipmentItems": [...],
    "signature": "data:image/png;base64,...",
    "signatureType": "drawn",
    "approvalToken": "a1b2c3d4e5f6...",
    "tokenExpiresAt": "2025-12-31T10:30:00.000Z",
    "tokenUsed": false,
    "approvalStatus": "pending",
    "approvedBy": null,
    "approvalDate": null,
    "approvalComments": null
  }
}
```

**Note:** For production on serverless platforms (Vercel), you'll need to replace this with a database (PostgreSQL, MongoDB, etc.).

---

## Email Configuration

### SMTP Settings
- **Host:** `smtp.gmail.com` (or your SMTP server)
- **Port:** `465` (SSL) - preferred, falls back to `587` (TLS) if needed
- **Authentication:** Gmail App Password (not regular password)
- **Sender Name:** "RequestsbyCimons"
- **From Address:** Your configured email

### Email Recipients

**Approvers (Notification Emails):**
- `ddickson@azmonlimited.com`
- `kanfram@gmail.com`
- `chasetetteh3@gmail.com`

**Requester:**
- Email provided in the form

### Email Content

**Approver Email:**
- Request summary
- Request ID
- Approval link with secure token
- PDF attachment

**Requester Confirmation:**
- Thank you message
- Request ID
- PDF copy of request

**Requester Approval Notification:**
- Approval/rejection status
- Approver name and comments
- Approved/rejected PDF with stamp

---

## PDF Generation

### Features
- Professional design with light gray background
- Light blue vertical accent strip
- Gear icon in header
- Organized sections:
  - General Information
  - Request Details (table format)
  - Requested By (with signature)
  - Approval Section (if approved/rejected)
- Signature images (both requester and approver)
- Approval/Rejection stamp (if applicable)
- "Powered by Cimons Technologies" footer

### Stamp Details
- **APPROVED:** Green text stamp (top-right)
- **REJECTED:** Red text stamp (top-right)
- Small size, no border/circle
- Only appears on approved/rejected PDFs

---

## Request ID Format

**Format:** `REQ-XXXMMYY`

- `REQ-` = Prefix
- `XXX` = Sequential number (001, 002, 003...)
- `MM` = Month (01-12)
- `YY` = Year (last 2 digits)

**Examples:**
- `REQ-0011225` = Request #1, December 2025
- `REQ-0021225` = Request #2, December 2025
- `REQ-0010126` = Request #1, January 2026

**Counter Reset:**
- Counter resets each month
- New month = new sequence starting from 001

---

## Token Lifecycle

### 1. Generation
- Created when request is submitted
- 64-character hexadecimal string
- Cryptographically secure

### 2. Storage
- Stored in request data
- Expiry date set (7 days)
- Usage flag set to `false`

### 3. Validation
- Checked on approval page load
- Checked before approval submission
- Must be: valid, not expired, not used

### 4. Usage
- Token marked as used after approval
- Cannot be reused
- Status updated in request data

### 5. Expiry
- After 7 days, token becomes invalid
- Approval link no longer works
- Clear error message shown

---

## Error Handling

### Invalid Token
- **Reason:** Token doesn't match or doesn't exist
- **Response:** "Unauthorized Access" page
- **Action:** No approval possible

### Expired Token
- **Reason:** Token older than 7 days
- **Response:** "Token has expired" message
- **Action:** Contact administrator for new link

### Used Token
- **Reason:** Token already used for approval
- **Response:** Shows current approval status
- **Action:** No further action needed

### Already Processed
- **Reason:** Request already approved/rejected
- **Response:** Shows who approved and when
- **Action:** Prevents duplicate approval

---

## Form Validation

### Client-Side Validation
- **Quantity:** Must be integer (no decimals)
- **Email:** Must be valid email format
- **Required Date:** Cannot be in the past
- **Required Fields:** All marked fields must be filled
- **Visual Feedback:** Red borders and error messages

### Server-Side Validation
- All validations re-checked on server
- Prevents bypassing client-side validation
- Ensures data integrity

---

## PWA Features

### Progressive Web App
- Installable on mobile devices
- Works offline (cached)
- App-like experience
- Service worker for caching

### Installation
- "Add to Home Screen" prompt
- Works on iOS and Android
- Standalone app experience

---

## Deployment

### VPS Deployment
- File-based storage works perfectly
- Persistent data across restarts
- PM2 process manager
- Nginx reverse proxy
- SSL certificate (Let's Encrypt)

### Serverless Deployment (Vercel)
- Requires database (file storage won't work)
- Stateless functions
- Need to migrate to database solution

---

## Summary

**Complete Flow:**
1. User submits form → Request ID generated → Secure token created (7-day expiry)
2. Emails sent → Approvers get link → Requester gets confirmation
3. Approver clicks link → Token verified → Approval page shown
4. Approver reviews → Submits decision → Token marked used → Status updated
5. PDF regenerated with stamp → Email sent to requester → Process complete

**Security:**
- Secure tokens (64-char, cryptographically random)
- 7-day expiry
- Single-use tokens
- Status tracking prevents duplicates
- Secure token comparison

**Features:**
- Dynamic equipment rows
- Signature drawing
- Professional PDFs
- Email notifications
- Approval workflow
- Status tracking
- PWA support

---

## Technical Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **PDF:** jsPDF + canvas
- **Email:** Nodemailer
- **Storage:** File-based JSON (VPS) / Database (Production)
- **Process Manager:** PM2
- **Web Server:** Nginx
- **SSL:** Let's Encrypt

---

**Last Updated:** December 2025

