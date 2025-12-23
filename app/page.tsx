'use client'

import EquipmentRequestForm from '@/components/EquipmentRequestForm'
import RegisterSW from './register-sw'

export default function Home() {
  return (
    <>
      <RegisterSW />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-4 sm:py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <EquipmentRequestForm />
        </div>
      </main>
    </>
  )
}

