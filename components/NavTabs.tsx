'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function NavTabs() {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'list'

  const tabs = [
    { href: '/explore?tab=list', label: 'Browse Sales', key: 'list' },
    { href: '/explore?tab=map', label: 'Map View', key: 'map' },
    { href: '/explore?tab=add', label: 'Add Sale', key: 'add' },
    { href: '/explore?tab=find', label: 'Find More', key: 'find' }
  ]

  return (
    <div className="flex gap-2 border-b mb-4">
      {tabs.map(tab => (
        <Link 
          key={tab.href} 
          className={`px-3 py-2 hover:bg-neutral-100 rounded ${
            currentTab === tab.key ? 'bg-amber-100 text-amber-800 font-medium' : ''
          }`} 
          href={tab.href}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
