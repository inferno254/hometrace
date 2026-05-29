import { Share2, Check } from 'lucide-react'
import { useState } from 'react'

type Props = {
  url: string
  title: string
}

export function ShareButton({ url, title }: Props) {
  const [copied, setCopied] = useState(false)

  const fullUrl = `${window.location.origin}${url}`

  const shareViaWA = () => {
    const text = `*${title}*\n\nCheck this listing on HomeTrace:\n${fullUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); shareViaWA() }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
      >
        <Share2 className="h-3.5 w-3.5" /> Share
      </button>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyLink() }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Share2 className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  )
}
