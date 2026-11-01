import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

type Art = { w: number; h: number; palette: string[]; text: string; colors: string }

/** Paints the libcaca art (one char per cell, fg/bg as two hex digits) onto a canvas. */
function NashArt() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let alive = true
    import('@/assets/haha/nash.json').then(({ default: art }: { default: Art }) => {
      const canvas = ref.current
      if (!alive || !canvas) return
      const cw = 6
      const ch = 10
      canvas.width = art.w * cw
      canvas.height = art.h * ch
      const ctx = canvas.getContext('2d')!
      ctx.font = `bold ${ch}px ui-monospace, monospace`
      ctx.textBaseline = 'top'
      for (let i = 0; i < art.text.length; i++) {
        const x = (i % art.w) * cw
        const y = Math.floor(i / art.w) * ch
        ctx.fillStyle = art.palette[parseInt(art.colors[i * 2 + 1], 16)]
        ctx.fillRect(x, y, cw, ch)
        ctx.fillStyle = art.palette[parseInt(art.colors[i * 2], 16)]
        ctx.fillText(art.text[i], x, y)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  return <canvas ref={ref} aria-hidden className="mt-4 block aspect-square w-full rounded-md bg-[#555]" />
}

/** The footer's GitHub link asks once more before it lets you go. */
export function NashDialog({ open, onYes, onNo }: { open: boolean; onYes: () => void; onNo: () => void }) {
  return (
    <Dialog open={open} onClose={onNo} title="Sure ka ba talaga? hahahahhahahhaha">
      {open && <NashArt />}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="outline" autoFocus onClick={onNo}>
          Hindi
        </Button>
        <Button className="bg-up-maroon hover:bg-accent-hover" onClick={onYes}>
          Oo
        </Button>
      </div>
    </Dialog>
  )
}
