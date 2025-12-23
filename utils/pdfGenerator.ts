import jsPDF from 'jspdf'

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

export async function generatePDF(data: FormData): Promise<Blob> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPosition = margin

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
    }
  }

  // Title with underline
  doc.setFontSize(22)
  doc.setTextColor(37, 99, 235) // Blue color
  doc.setFont('helvetica', 'bold')
  doc.text('EQUIPMENT REQUEST FORM', pageWidth / 2, yPosition, { align: 'center' })
  // Underline
  doc.setDrawColor(37, 99, 235)
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2)
  yPosition += 12

  // General Information Section
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  
  if (data.companyName) {
    doc.text(`Company Name: ${data.companyName}`, margin, yPosition)
    yPosition += 7
  }
  if (data.projectSiteName) {
    doc.text(`Project / Site Name: ${data.projectSiteName}`, margin, yPosition)
    yPosition += 7
  }
  if (data.department) {
    doc.text(`Department: ${data.department}`, margin, yPosition)
    yPosition += 7
  }
  if (data.dateOfRequest) {
    const requestDate = new Date(data.dateOfRequest).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    doc.text(`Date of Request: ${requestDate}`, margin, yPosition)
    yPosition += 7
  }
  yPosition += 5

  // Request Details Section
  checkPageBreak(30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('REQUEST DETAILS', margin, yPosition)
  yPosition += 10

  // Table headers with background
  doc.setFontSize(10)
  const colWidths = [15, 70, 25, 50, 30]
  const colPositions = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2], margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]]
  
  // Header background
  doc.setFillColor(37, 99, 235)
  doc.rect(margin, yPosition - 6, pageWidth - margin * 2, 8, 'F')
  
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

  // Equipment items with alternating row colors
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  
  data.equipmentItems.forEach((item, index) => {
    checkPageBreak(15)
    
    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(245, 247, 250)
      doc.rect(margin, yPosition - 5, pageWidth - margin * 2, 10, 'F')
    }
    
    // Row border
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.1)
    doc.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
    
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
  doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2)
  
  yPosition += 8

  // Requested By Section
  checkPageBreak(50)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Requested By:', margin, yPosition)
  yPosition += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Name: ${data.requesterName}`, margin, yPosition)
  yPosition += 7
  
  if (data.requesterPosition) {
    doc.text(`Position: ${data.requesterPosition}`, margin, yPosition)
    yPosition += 7
  }

  // Requester Signature
  if (data.signatureType === 'drawn' && data.signature) {
    try {
      const img = new Image()
      img.src = data.signature
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          const imgWidth = 60
          const imgHeight = (img.height / img.width) * imgWidth
          checkPageBreak(imgHeight + 10)
          doc.text('Signature:', margin, yPosition)
          yPosition += 5
          doc.addImage(data.signature, 'PNG', margin, yPosition, imgWidth, imgHeight)
          yPosition += imgHeight + 10
          resolve(null)
        }
        img.onerror = reject
      })
    } catch (error) {
      console.error('Error adding signature image:', error)
      doc.text('Signature: [Image not available]', margin, yPosition)
      yPosition += 10
    }
  } else {
    doc.text(`Signature: ${data.signature}`, margin, yPosition)
    yPosition += 7
  }

  if (data.requesterDate) {
    const reqDate = new Date(data.requesterDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    doc.text(`Date: ${reqDate}`, margin, yPosition)
    yPosition += 10
  }

  // Approval Section (only if approval data exists)
  if (data.approvedBy) {
    checkPageBreak(50)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('APPROVAL', margin, yPosition)
    yPosition += 8

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    
    doc.text(`Approved By (Site Engineer / Manager): ${data.approvedBy}`, margin, yPosition)
    yPosition += 7

    if (data.approvalDate) {
      const appDate = new Date(data.approvalDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      doc.text(`Date: ${appDate}`, margin, yPosition)
      yPosition += 7
    }

    // Approval Signature
    const approvalSig = data.approvalSignature
    const approvalSigType = data.approvalSignatureType
    if (approvalSig && approvalSigType) {
      if (approvalSigType === 'drawn') {
        try {
          const img = new Image()
          img.src = approvalSig
          
          await new Promise((resolve, reject) => {
            img.onload = () => {
              const imgWidth = 60
              const imgHeight = (img.height / img.width) * imgWidth
              checkPageBreak(imgHeight + 10)
              doc.text('Signature:', margin, yPosition)
              yPosition += 5
              doc.addImage(approvalSig, 'PNG', margin, yPosition, imgWidth, imgHeight)
              yPosition += imgHeight + 10
              resolve(null)
            }
            img.onerror = reject
          })
        } catch (error) {
          console.error('Error adding approval signature image:', error)
          doc.text('Signature: [Image not available]', margin, yPosition)
          yPosition += 10
        }
      } else {
        doc.text(`Signature: ${approvalSig}`, margin, yPosition)
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

