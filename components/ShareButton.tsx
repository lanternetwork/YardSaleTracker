'use client'
import { useState } from 'react'

interface ShareButtonProps {
  sale: {
    id: string
    title: string
    description?: string
    address?: string
    photos?: string[]
  }
  className?: string
}

export default function ShareButton({ sale, className = '' }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = `${window.location.origin}/sale/${sale.id}`
  const shareText = `Check out this yard sale: ${sale.title}`
  const shareTitle = `Yard Sale: ${sale.title}`

  const handleShare = async () => {
    setIsSharing(true)

    try {
      // Check if Web Share API is supported
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (error) {
      console.error('Error sharing:', error)
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError)
        alert('Unable to share. Please copy the link manually.')
      }
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-neutral-50 disabled:opacity-50 ${className}`}
    >
      {isSharing ? (
        <>
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          Sharing...
        </>
      ) : copied ? (
        <>
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          Share
        </>
      )}
    </button>
  )
}
