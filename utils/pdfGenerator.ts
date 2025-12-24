import jsPDF from 'jspdf'
import { createCanvas, loadImage } from 'canvas'

interface EquipmentItem {
  name: string
  quantity: string
  purpose: string
  requiredDate: string
}

interface FormData {
  companyName: string
  projectSiteName: string
  department: string
  dateOfRequest: string
  requesterName: string
  requesterEmail: string
  requesterPosition: string
  equipmentItems: EquipmentItem[]
  signature: string
  signatureType: 'typed' | 'drawn'
  requesterDate: string
  approvedBy?: string
  approvalSignature?: string
  approvalSignatureType?: 'typed' | 'drawn'
  approvalDate?: string
}

// Helper function to draw a simple gear icon
function drawGearIcon(canvas: any, x: number, y: number, size: number, color: string = '#ffffff') {
  const ctx = canvas.getContext('2d')
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  
  // Draw gear shape (simplified)
  const centerX = size / 2
  const centerY = size / 2
  const radius = size / 3
  
  ctx.beginPath()
  // Outer circle with teeth
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8
    const outerRadius = radius + 3
    const innerRadius = radius - 1
    const x1 = centerX + Math.cos(angle) * outerRadius
    const y1 = centerY + Math.sin(angle) * outerRadius
    const x2 = centerX + Math.cos(angle + Math.PI / 8) * innerRadius
    const y2 = centerY + Math.sin(angle + Math.PI / 8) * innerRadius
    
    if (i === 0) {
      ctx.moveTo(x1, y1)
    } else {
      ctx.lineTo(x1, y1)
    }
    ctx.lineTo(x2, y2)
  }
  ctx.closePath()
  ctx.fill()
  
  // Inner circle (hole)
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius / 2, 0, Math.PI * 2)
  ctx.fillStyle = '#4B5563' // Dark gray background
  ctx.fill()
  
  ctx.restore()
}

export async function generatePDF(data: FormData): Promise<Blob> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const leftStripWidth = 8 // Light blue vertical strip
  let yPosition = margin

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
    }
  }

  // Light gray background
  doc.setFillColor(245, 247, 250)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Light blue vertical strip on left
  doc.setFillColor(219, 234, 254) // Light blue
  doc.rect(0, 0, leftStripWidth, pageHeight, 'F')

  // Header Section with gear icon
  const headerStartY = margin + 5
  yPosition = headerStartY
  
  // Dark gray rectangular block with gear icon
  const iconBoxSize = 25
  const iconBoxX = margin + 5
  const iconBoxY = headerStartY
  
  // Draw dark gray box
  doc.setFillColor(75, 85, 99) // Dark gray
  doc.rect(iconBoxX, iconBoxY, iconBoxSize, iconBoxSize, 'F')
  
  // Create gear icon using canvas
  const gearCanvas = createCanvas(iconBoxSize, iconBoxSize)
  drawGearIcon(gearCanvas, 0, 0, iconBoxSize, '#ffffff')
  const gearImageData = gearCanvas.toDataURL('image/png')
  doc.addImage(gearImageData, 'PNG', iconBoxX, iconBoxY, iconBoxSize, iconBoxSize)

  // "EQUIPMENT REQUEST" title (large, bold, blue)
  const titleX = iconBoxX + iconBoxSize + 10
  doc.setFontSize(24)
  doc.setTextColor(37, 99, 235) // Blue
  doc.setFont('helvetica', 'bold')
  doc.text('EQUIPMENT REQUEST', titleX, headerStartY + 12)

  // "FORM" subtitle (smaller, gray)
  doc.setFontSize(14)
  doc.setTextColor(107, 114, 128) // Gray
  doc.setFont('helvetica', 'normal')
  doc.text('FORM', titleX, headerStartY + 20)

  yPosition = headerStartY + iconBoxSize + 15

  // General Information Section
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  
  if (data.companyName) {
    doc.text(`Company Name: ${data.companyName}`, margin + 5, yPosition)
    yPosition += 7
  }
  if (data.projectSiteName) {
    doc.text(`Project / Site Name: ${data.projectSiteName}`, margin + 5, yPosition)
    yPosition += 7
  }
  if (data.department) {
    doc.text(`Department: ${data.department}`, margin + 5, yPosition)
    yPosition += 7
  }
  if (data.dateOfRequest) {
    const requestDate = new Date(data.dateOfRequest).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    doc.text(`Date of Request: ${requestDate}`, margin + 5, yPosition)
    yPosition += 7
  }
  yPosition += 8

  // Request Details Section
  checkPageBreak(30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(31, 41, 55) // Dark gray
  doc.text('REQUEST DETAILS', margin + 5, yPosition)
  yPosition += 10

  // Table headers with blue background
  doc.setFontSize(10)
  const colWidths = [15, 70, 25, 50, 30]
  const tableStartX = margin + 5
  const colPositions = [
    tableStartX,
    tableStartX + colWidths[0],
    tableStartX + colWidths[0] + colWidths[1],
    tableStartX + colWidths[0] + colWidths[1] + colWidths[2],
    tableStartX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]
  ]
  
  // Header background (blue)
  doc.setFillColor(37, 99, 235) // Blue
  doc.rect(tableStartX, yPosition - 6, pageWidth - (margin + 5) * 2, 8, 'F')
  
  // Header text (white)
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('No.', colPositions[0], yPosition)
  doc.text('Equipment Description', colPositions[1], yPosition)
  doc.text('Quantity', colPositions[2], yPosition)
  doc.text('Purpose / Use', colPositions[3], yPosition)
  doc.text('Required Date', colPositions[4], yPosition)
  
  // Reset text color
  doc.setTextColor(0, 0, 0)
  yPosition += 8

  // Equipment items with white background rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  
  data.equipmentItems.forEach((item, index) => {
    checkPageBreak(15)
    
    // White row background
    doc.setFillColor(255, 255, 255)
    doc.rect(tableStartX, yPosition - 5, pageWidth - (margin + 5) * 2, 10, 'F')
    
    // Row border
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.1)
    doc.line(tableStartX, yPosition - 5, pageWidth - margin - 5, yPosition - 5)
    
    doc.text(`${index + 1}`, colPositions[0], yPosition)
    
    const descLines = doc.splitTextToSize(item.name, colWidths[1] - 5)
    doc.text(descLines, colPositions[1], yPosition)
    const descHeight = Math.max(descLines.length * 5, 8)
    
    doc.text(item.quantity || '-', colPositions[2], yPosition)
    
    const purposeLines = doc.splitTextToSize(item.purpose || '-', colWidths[3] - 5)
    doc.text(purposeLines, colPositions[3], yPosition)
    
    if (item.requiredDate) {
      const reqDate = new Date(item.requiredDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      doc.text(reqDate, colPositions[4], yPosition)
    } else {
      doc.text('-', colPositions[4], yPosition)
    }
    
    yPosition += descHeight + 3
  })
  
  // Bottom border of table
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(tableStartX, yPosition - 2, pageWidth - margin - 5, yPosition - 2)
  
  yPosition += 10

  // Requested By Section
  checkPageBreak(50)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(31, 41, 55) // Dark gray
  doc.text('Requested By:', margin + 5, yPosition)
  yPosition += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.text(`Name: ${data.requesterName}`, margin + 5, yPosition)
  yPosition += 7
  
  if (data.requesterPosition) {
    doc.text(`Position: ${data.requesterPosition}`, margin + 5, yPosition)
    yPosition += 7
  }

  // Requester Signature
  if (data.signatureType === 'drawn' && data.signature) {
    try {
      // Load image using canvas (works in Node.js)
      const img = await loadImage(data.signature)
      const imgWidth = 60
      const imgHeight = (img.height / img.width) * imgWidth
      checkPageBreak(imgHeight + 10)
      doc.text('Signature:', margin + 5, yPosition)
      yPosition += 5
      
      // Convert image to base64 for jsPDF
      const canvas = createCanvas(img.width, img.height)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imageData = canvas.toDataURL('image/png')
      
      // Add the image to PDF
      doc.addImage(imageData, 'PNG', margin + 5, yPosition, imgWidth, imgHeight)
      yPosition += imgHeight + 10
    } catch (error) {
      console.error('Error adding signature image:', error)
      console.error('Signature data (first 100 chars):', data.signature?.substring(0, 100))
      doc.text('Signature: [Image not available]', margin + 5, yPosition)
      yPosition += 10
    }
  } else {
    doc.text(`Signature: ${data.signature}`, margin + 5, yPosition)
    yPosition += 7
  }

  if (data.requesterDate) {
    const reqDate = new Date(data.requesterDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    doc.text(`Date: ${reqDate}`, margin + 5, yPosition)
    yPosition += 10
  }

  // Approval Section (only if approval data exists)
  if (data.approvedBy) {
    checkPageBreak(50)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(31, 41, 55) // Dark gray
    doc.text('APPROVAL', margin + 5, yPosition)
    yPosition += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    
    doc.text(`Approved By (Site Engineer / Manager): ${data.approvedBy}`, margin + 5, yPosition)
    yPosition += 7

    if (data.approvalDate) {
      const appDate = new Date(data.approvalDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      doc.text(`Date: ${appDate}`, margin + 5, yPosition)
      yPosition += 7
    }

    // Approval Signature
    const approvalSig = data.approvalSignature
    const approvalSigType = data.approvalSignatureType
    if (approvalSig && approvalSigType) {
      if (approvalSigType === 'drawn') {
        try {
          // Load image using canvas (works in Node.js)
          const img = await loadImage(approvalSig)
          const imgWidth = 60
          const imgHeight = (img.height / img.width) * imgWidth
          checkPageBreak(imgHeight + 10)
          doc.text('Signature:', margin + 5, yPosition)
          yPosition += 5
          
          // Convert image to base64 for jsPDF
          const canvas = createCanvas(img.width, img.height)
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          const imageData = canvas.toDataURL('image/png')
          
          // Add the image to PDF
          doc.addImage(imageData, 'PNG', margin + 5, yPosition, imgWidth, imgHeight)
          yPosition += imgHeight + 10
        } catch (error) {
          console.error('Error adding approval signature image:', error)
          console.error('Approval signature data (first 100 chars):', approvalSig?.substring(0, 100))
          doc.text('Signature: [Image not available]', margin + 5, yPosition)
          yPosition += 10
        }
      } else {
        doc.text(`Signature: ${approvalSig}`, margin + 5, yPosition)
        yPosition += 10
      }
    }
  }

  // Powered by Cimons Technologies footer
  const footerY = pageHeight - 15
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text('Powered by Cimons Technologies', pageWidth / 2, footerY, { align: 'center' })

  // Generate blob
  return doc.output('blob')
}
