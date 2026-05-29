import { GitCompare, Check } from 'lucide-react'

type Props = {
  id: string
  isSelected: boolean
  onToggle: (id: string) => 'limit' | null
}

export function CompareButton({ id, isSelected, onToggle }: Props) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const result = onToggle(id)
    if (result === 'limit') {
      const el = document.getElementById('compare-bar')
      el?.classList.add('ring-2', 'ring-amber-400/50')
      setTimeout(() => el?.classList.remove('ring-2', 'ring-amber-400/50'), 1200)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-all ${
        isSelected
          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
          : 'text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-white/10'
      }`}
      title={isSelected ? 'Remove from compare' : 'Add to compare'}
    >
      {isSelected ? <Check className="h-3.5 w-3.5" /> : <GitCompare className="h-3.5 w-3.5" />}
      {isSelected ? 'Comparing' : 'Compare'}
    </button>
  )
}
