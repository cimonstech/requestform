# Equipment Request Form

A modern, web-based equipment request form built with Next.js, React, and TypeScript. Features a beautiful gradient UI, PWA support, and email-based approval workflow.

## Features

- ✨ **Modern UI** - Beautiful gradient design with responsive layout
- 📝 **Dynamic Equipment Items** - Add/remove equipment items as needed
- ✍️ **Signature Support** - Typed name or freehand drawing with signature pad
- 📄 **Professional PDF Generation** - Clean, formatted PDFs with all form data
- 📧 **Email Notifications** - Automatic emails to approvers and requesters
- ✅ **Email-Based Approval** - Approvers receive links to approve/reject requests with comments
- 📱 **PWA Support** - Install as a Progressive Web App on mobile and desktop
- 🎨 **Fully Responsive** - Works perfectly on all device sizes
- ⚡ **Auto-Timestamp** - Date of request is automatically set (read-only)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure email settings by creating a `.env.local` file:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**For production**, set `NEXT_PUBLIC_BASE_URL` to your actual domain (e.g., `https://yourdomain.com`)

**Note:** For Gmail, you'll need to use an App Password instead of your regular password. Enable 2-factor authentication and generate an App Password in your Google Account settings.

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Email Configuration

**Currently for testing:** The form sends emails to:
- chasetetteh3@gmail.com (testing only)
- The requester's email (from the form)

**After testing:** Update `app/api/send-email/route.ts` to include all recipients:
- ddickson@azmonlimited.com
- kanfram@gmail.com
- chasetetteh3@gmail.com

Make sure your SMTP credentials are properly configured in `.env.local`.

## Approval Workflow

1. **Request Submission**: When a form is submitted, approvers receive an email with a unique approval link
2. **Review & Approve**: Approvers click the link to view the request and can:
   - Add their name
   - Add comments/notes
   - Approve or reject the request
3. **Notification**: The requester receives an email notification with the approval/rejection status and any comments

## PWA Installation

The app can be installed as a Progressive Web App:
- **Desktop**: Look for the install prompt in your browser
- **Mobile**: Use "Add to Home Screen" option
- **Icons**: Replace `public/icon-192.png` and `public/icon-512.png` with your custom icons

## Production Deployment

For production deployment, ensure:
1. Environment variables are set in your hosting platform (including `NEXT_PUBLIC_BASE_URL`)
2. SMTP credentials are secure and properly configured
3. The application is built using `npm run build`
4. Replace placeholder PWA icons with actual icons
5. Consider replacing the in-memory request store (`utils/requestStore.ts`) with a database for production use

## Technical Notes

- **Request Storage**: Currently uses in-memory storage. For production, consider using a database (PostgreSQL, MongoDB, etc.)
- **Service Worker**: Basic caching is implemented. Customize `public/sw.js` for advanced caching strategies
- **Signature Pad**: Fixed and working on all devices with touch support

