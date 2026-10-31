import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge the type scale in index.css. Otherwise it reads `text-label` as a color
// and drops it whenever a `text-white` or `text-muted-foreground` follows.
const twMerge = extendTailwindMerge({
  extend: { classGroups: { 'font-size': [{ text: ['pixel', 'label', 'caption', 'body-sm', 'lead'] }] } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
