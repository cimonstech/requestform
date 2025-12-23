'use client'

import { useRef, useEffect, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'

interface SignaturePadProps {
  onSignatureChange: (signature: string | null) => void
}

export default function SignaturePad({ onSignatureChange }: SignaturePadProps) {
  const canvasRef = useRef<SignatureCanvas>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Let react-signature-canvas handle its own sizing
    if (canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current.getCanvas()
      const container = containerRef.current
      
      // Set canvas dimensions based on container
      const updateCanvasSize = () => {
        const rect = container.getBoundingClientRect()
        if (rect.width > 0) {
          canvas.width = rect.width
          canvas.height = 200
        }
      }
      
      updateCanvasSize()
      
      // Update on resize
      const resizeObserver = new ResizeObserver(updateCanvasSize)
      resizeObserver.observe(container)
      
      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [])

  const handleEnd = () => {
    if (canvasRef.current && !canvasRef.current.isEmpty()) {
      const dataURL = canvasRef.current.toDataURL('image/png')
      onSignatureChange(dataURL)
    } else {
      onSignatureChange(null)
    }
  }

  const handleClear = () => {
    if (canvasRef.current) {
      canvasRef.current.clear()
      onSignatureChange(null)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Draw Your Signature <span className="text-red-500">*</span>
      </label>
      <div
        ref={containerRef}
        className="border-2 border-gray-300 rounded-md bg-white relative overflow-hidden"
        style={{ width: '100%', height: '200px', touchAction: 'none' }}
      >
        <SignatureCanvas
          ref={canvasRef}
          canvasProps={{
            className: 'signature-canvas w-full h-full',
            style: { 
              width: '100%', 
              height: '200px',
              display: 'block',
              touchAction: 'none'
            }
          }}
          onEnd={handleEnd}
          backgroundColor="white"
          penColor="black"
          minWidth={1}
          maxWidth={3}
          throttle={16}
        />
      </div>
      <button
        type="button"
        onClick={handleClear}
        className="mt-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      >
        Clear Signature
      </button>
    </div>
  )
}

