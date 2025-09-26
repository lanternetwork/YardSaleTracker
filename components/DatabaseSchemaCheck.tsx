'use client'
import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'

interface SchemaInfo {
  tables: {
    name: string
    exists: boolean
    columns: string[]
    rowCount: number
  }[]
  errors: string[]
}

export default function DatabaseSchemaCheck() {
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkSchema = async () => {
    setIsLoading(true)
    const errors: string[] = []
    const tables = []

    try {
      const supabase = createSupabaseBrowser()

      // Check each expected table
      const expectedTables = [
        'yard_sales',
        'favorites', 
        'sale_items',
        'profiles'
      ]

      for (const tableName of expectedTables) {
        try {
          // Try to get table info
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1)

          if (error) {
            tables.push({
              name: tableName,
              exists: false,
              columns: [],
              rowCount: 0
            })
            errors.push(`${tableName}: ${error.message}`)
          } else {
            // Get column names from the first row
            const columns = data && data.length > 0 ? Object.keys(data[0]) : []
            
            // Get row count
            const { count } = await supabase
              .from(tableName)
              .select('*', { count: 'exact', head: true })

            tables.push({
              name: tableName,
              exists: true,
              columns,
              rowCount: count || 0
            })
          }
        } catch (err: any) {
          tables.push({
            name: tableName,
            exists: false,
            columns: [],
            rowCount: 0
          })
          errors.push(`${tableName}: ${err.message}`)
        }
      }

    } catch (err: any) {
      errors.push(`Schema check failed: ${err.message}`)
    }

    setSchemaInfo({ tables, errors })
    setIsLoading(false)
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-green-800 font-medium">Database Schema Check</h3>
        <button
          onClick={checkSchema}
          disabled={isLoading}
          className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 disabled:opacity-50"
        >
          {isLoading ? 'Checking...' : 'Check Schema'}
        </button>
      </div>
      
      {schemaInfo && (
        <div className="space-y-3">
          {schemaInfo.tables.map((table) => (
            <div key={table.name} className="border rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{table.name}</h4>
                <span className={`px-2 py-1 rounded text-xs ${
                  table.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {table.exists ? 'EXISTS' : 'MISSING'}
                </span>
              </div>
              
              {table.exists && (
                <div className="text-sm text-gray-600">
                  <div>Rows: {table.rowCount}</div>
                  <div>Columns: {table.columns.length > 0 ? table.columns.join(', ') : 'None'}</div>
                </div>
              )}
            </div>
          ))}

          {schemaInfo.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-red-800 mb-2">Schema Errors</h4>
              <div className="text-sm space-y-1">
                {schemaInfo.errors.map((error, index) => (
                  <div key={index} className="text-red-600">• {error}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
