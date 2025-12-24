'use client'

import { useState } from 'react'
import SignaturePad from './SignaturePad'
import { generatePDF } from '@/utils/pdfGenerator'

interface EquipmentItem {
  id: string
  name: string
  quantity: string
  purpose: string
  requiredDate: string
}

export default function EquipmentRequestForm() {
  const [companyName, setCompanyName] = useState('')
  const [projectSiteName, setProjectSiteName] = useState('')
  const [department, setDepartment] = useState('')
  // Auto-timestamp for date of request (read-only)
  // Use a consistent date to avoid hydration issues
  const [dateOfRequest] = useState(() => new Date().toISOString().split('T')[0])
  const [requesterName, setRequesterName] = useState('')
  const [requesterEmail, setRequesterEmail] = useState('')
  const [requesterPosition, setRequesterPosition] = useState('')
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([
    { id: '1', name: '', quantity: '', purpose: '', requiredDate: '' }
  ])
  const [signatureType, setSignatureType] = useState<'typed' | 'drawn'>('typed')
  const [typedSignature, setTypedSignature] = useState('')
  const [signatureImage, setSignatureImage] = useState<string | null>(null)
  const [requesterDate, setRequesterDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const addEquipmentRow = () => {
    setEquipmentItems([
      ...equipmentItems,
      { id: Date.now().toString(), name: '', quantity: '', purpose: '', requiredDate: '' }
    ])
  }

  const removeEquipmentRow = (id: string) => {
    if (equipmentItems.length > 1) {
      setEquipmentItems(equipmentItems.filter(item => item.id !== id))
    }
  }

  const updateEquipmentItem = (id: string, field: keyof EquipmentItem, value: string) => {
    setEquipmentItems(
      equipmentItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    // Validation
    if (!requesterName.trim() || !requesterEmail.trim()) {
      alert('Please fill in requester name and email')
      setIsSubmitting(false)
      return
    }

    if (equipmentItems.some(item => !item.name.trim())) {
      alert('Please fill in equipment description for all items')
      setIsSubmitting(false)
      return
    }

    if (signatureType === 'typed' && !typedSignature.trim()) {
      alert('Please provide a typed signature')
      setIsSubmitting(false)
      return
    }

    if (signatureType === 'drawn' && !signatureImage) {
      alert('Please provide a signature')
      setIsSubmitting(false)
      return
    }

    try {
      // Generate PDF
      const pdfBlob = await generatePDF({
        companyName,
        projectSiteName,
        department,
        dateOfRequest,
        requesterName,
        requesterEmail,
        requesterPosition,
        equipmentItems: equipmentItems.filter(item => item.name.trim()),
        signature: signatureType === 'typed' ? typedSignature : signatureImage || '',
        signatureType,
        requesterDate
      })

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('pdf', pdfBlob, 'equipment-request.pdf')
      formData.append('requesterName', requesterName)
      formData.append('requesterEmail', requesterEmail)
      formData.append('department', department)
      formData.append('equipmentItems', JSON.stringify(equipmentItems.filter(item => item.name.trim())))
      // Add all form fields for storage and PDF regeneration
      formData.append('companyName', companyName)
      formData.append('projectSiteName', projectSiteName)
      formData.append('dateOfRequest', dateOfRequest)
      formData.append('requesterPosition', requesterPosition)
      formData.append('signature', signatureType === 'typed' ? typedSignature : signatureImage || '')
      formData.append('signatureType', signatureType)
      formData.append('requesterDate', requesterDate)

      // Send email
      const response = await fetch('/api/send-email', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const responseData = await response.json().catch(() => ({}))
        
        // Check if email failed but request was saved
        if (responseData.emailSent === false) {
          setSubmitStatus('success')
          // Show warning that email failed but request was saved
          alert(`Request saved successfully! Request ID: ${responseData.requestId}\n\nNote: Email notification failed, but your request was saved and can still be approved.`)
        } else {
          setSubmitStatus('success')
        }
        
        // Reset form
        setCompanyName('')
        setProjectSiteName('')
        setDepartment('')
        setRequesterName('')
        setRequesterEmail('')
        setRequesterPosition('')
        setEquipmentItems([{ id: '1', name: '', quantity: '', purpose: '', requiredDate: '' }])
        setTypedSignature('')
        setSignatureImage(null)
        setRequesterDate(new Date().toISOString().split('T')[0])
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to send email')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-blue-100">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 p-6 sm:p-8 text-white">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Equipment Request Form</h1>
        <p className="text-blue-50 text-sm sm:text-base">Please fill out the form below to request equipment</p>
      </div>
      
      <div className="p-4 sm:p-6 md:p-8">

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8" suppressHydrationWarning>
        {/* General Information */}
        <div className="border-b border-gray-200 pb-6 sm:pb-8">
          <div className="bg-gradient-to-r from-blue-50 to-transparent -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-3 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-primary">General Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm hover:shadow-md"
              />
            </div>
            <div>
              <label htmlFor="projectSiteName" className="block text-sm font-medium text-gray-700 mb-1">
                Project / Site Name
              </label>
              <input
                type="text"
                id="projectSiteName"
                value={projectSiteName}
                onChange={(e) => setProjectSiteName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm hover:shadow-md"
              />
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <input
                type="text"
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm hover:shadow-md"
              />
            </div>
            <div>
              <label htmlFor="dateOfRequest" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Request
              </label>
              <input
                type="text"
                id="dateOfRequest"
                value={new Date(dateOfRequest + 'T00:00:00').toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                suppressHydrationWarning
              />
            </div>
          </div>
        </div>

        {/* Requester Information */}
        <div className="border-b border-gray-200 pb-6 sm:pb-8">
          <div className="bg-gradient-to-r from-blue-50 to-transparent -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-3 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-primary">Requested By</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="requesterName" className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="requesterName"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm hover:shadow-md"
              />
            </div>
            <div>
              <label htmlFor="requesterEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="requesterEmail"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm hover:shadow-md"
              />
            </div>
            <div>
              <label htmlFor="requesterPosition" className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <input
                type="text"
                id="requesterPosition"
                value={requesterPosition}
                onChange={(e) => setRequesterPosition(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm hover:shadow-md"
              />
            </div>
            <div>
              <label htmlFor="requesterDate" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                id="requesterDate"
                value={requesterDate}
                onChange={(e) => setRequesterDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm hover:shadow-md"
              />
            </div>
          </div>
        </div>

        {/* Equipment Items */}
        <div className="border-b border-gray-200 pb-6 sm:pb-8">
          <div className="bg-gradient-to-r from-blue-50 to-transparent -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-3 mb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-primary">Equipment Items</h2>
              <button
                type="button"
                onClick={addEquipmentRow}
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg hover:from-primary-dark hover:to-primary transition-all shadow-md hover:shadow-lg font-medium text-sm sm:text-base"
              >
                + Add Equipment
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {equipmentItems.map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-xl p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                  {equipmentItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEquipmentRow(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Equipment Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateEquipmentItem(item.id, 'name', e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm hover:shadow-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="text"
                      value={item.quantity}
                      onChange={(e) => updateEquipmentItem(item.id, 'quantity', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm hover:shadow-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purpose / Use
                    </label>
                    <input
                      type="text"
                      value={item.purpose}
                      onChange={(e) => updateEquipmentItem(item.id, 'purpose', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm hover:shadow-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Required Date
                    </label>
                    <input
                      type="date"
                      value={item.requiredDate}
                      onChange={(e) => updateEquipmentItem(item.id, 'requiredDate', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm hover:shadow-md"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Requester Signature */}
        <div className="border-b border-gray-200 pb-6 sm:pb-8">
          <div className="bg-gradient-to-r from-blue-50 to-transparent -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-3 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-primary">Requester Signature</h2>
          </div>
          <div className="mb-4">
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="typed"
                  checked={signatureType === 'typed'}
                  onChange={(e) => setSignatureType(e.target.value as 'typed')}
                  className="mr-2"
                />
                <span>Typed Name</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="drawn"
                  checked={signatureType === 'drawn'}
                  onChange={(e) => setSignatureType(e.target.value as 'drawn')}
                  className="mr-2"
                />
                <span>Freehand Drawing</span>
              </label>
            </div>
          </div>
          {signatureType === 'typed' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Signature <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                required
                placeholder="Type your name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm hover:shadow-md"
              />
            </div>
          ) : (
            <SignaturePad
              onSignatureChange={setSignatureImage}
            />
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4" suppressHydrationWarning>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg hover:from-primary-dark hover:to-primary transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base sm:text-lg transform hover:scale-105 disabled:transform-none"
            suppressHydrationWarning
          >
            <span className="flex items-center gap-2">
              {isSubmitting && (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </span>
          </button>
        </div>

        {/* Status Messages */}
        {submitStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
            Request submitted successfully! You will receive a confirmation email shortly.
          </div>
        )}
        {submitStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            There was an error submitting your request. Please check your connection and try again. If the problem persists, contact support.
          </div>
        )}
      </form>

      </div>
      
      {/* Powered by Cimons Technologies */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-4 sm:px-6 md:px-8 py-4 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600" suppressHydrationWarning>
          Powered by <span className="font-bold text-primary">Cimons Technologies</span>
        </p>
      </div>
    </div>
  )
}

