'use client'

import EquipmentRequestForm from '@/components/EquipmentRequestForm'
import RegisterSW from './register-sw'

export default function Home() {
  return (
    <>
      <RegisterSW />
      <main 
        className="min-h-screen py-4 sm:py-8 px-4 relative"
        style={{
          backgroundImage: 'url(/images/equip.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto">
          <EquipmentRequestForm />
        </div>
      </main>
    </>
  )
}

