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
    <div className="segmented-control mb-6">
      {tabs.map(tab => (
        <Link 
          key={tab.href} 
          className={`${
            currentTab === tab.key ? 'aria-pressed="true"' : ''
          }`}
          href={tab.href}
          aria-pressed={currentTab === tab.key}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
