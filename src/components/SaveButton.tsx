import { Heart } from 'lucide-react'

type Props = {
  id: string
  isFavorite: boolean
  onToggle: (id: string) => void
  compact?: boolean
}

export function SaveButton({ id, isFavorite, onToggle, compact }: Props) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(id) }}
      className={`flex items-center justify-center transition-all duration-200 ${
        isFavorite
          ? 'text-red-400'
          : 'text-zinc-500 hover:text-red-300'
      } ${compact ? 'h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm' : 'gap-1.5 rounded-lg px-2 py-1 text-xs'}`}
      title={isFavorite ? 'Remove from saved' : 'Save listing'}
    >
      <Heart className={isFavorite ? 'h-4 w-4 fill-red-400' : 'h-4 w-4'} />
      {!compact && (isFavorite ? 'Saved' : 'Save')}
    </button>
  )
}
