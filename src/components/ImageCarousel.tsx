import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

type Props = {
  images: string[]
  onClose?: () => void
}

export function ImageCarousel({ images, onClose }: Props) {
  const [idx, setIdx] = useState(0)

  if (!images.length) return null

  const prev = () => setIdx((i) => (i === 0 ? images.length - 1 : i - 1))
  const next = () => setIdx((i) => (i === images.length - 1 ? 0 : i + 1))

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={prev}
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <img
            src={images[idx]}
            alt=""
            className="max-h-[75vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl"
          />
          <button
            onClick={next}
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-10 w-14 overflow-hidden rounded-lg border-2 transition-all ${
                i === idx ? 'border-cyan-400 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}
