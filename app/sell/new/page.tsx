import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SaleForm from '@/components/forms/SaleForm'

export default async function NewSalePage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?returnTo=/sell/new')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Sale</h1>
            <p className="text-gray-600">List your yard sale to reach more buyers in your area</p>
          </div>
          
          <SaleForm />
        </div>
      </div>
    </div>
  )
}