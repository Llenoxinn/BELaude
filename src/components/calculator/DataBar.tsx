import { useRef, useState } from 'react'
import { DownloadSimple, UploadSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/dialog'
import { exportFileName, parseImport } from '@/lib/state'
import { useStore } from '@/lib/store'
import { downloadBlob } from '@/lib/utils'

/** Autosave note plus Export / Import / Start over. Data lives only on this device, so backups matter. */
export function DataBar() {
  const { state, replace, reset, savedTick, storageOk } = useStore()
  const file = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  const exportData = () => {
    downloadBlob(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }), exportFileName())
    setMessage('Backup saved')
  }

  const importData = async (f: File | undefined) => {
    if (!f) return
    try {
      replace(parseImport(await f.text()))
      setMessage('Backup loaded')
    } catch (e) {
      setMessage(e instanceof Error && e.message.startsWith('This file') ? e.message : 'That file could not be read.')
    }
    if (file.current) file.current.value = ''
  }

  const [confirming, setConfirming] = useState(false)

  return (
    <div className="mt-10 rounded-lg bg-surface-alt p-5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground">
          {storageOk ? 'Your data stays on this device. Back it up!' : "Couldn’t save on this device (private browsing?). Export a backup to keep your data."}
          <span aria-live="polite" className="ml-2 font-medium text-up-green">
            {savedTick > 0 && storageOk && (
              <span key={savedTick} className="flash inline-block">
                Saved on this device
              </span>
            )}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportData}>
            <DownloadSimple aria-hidden /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => file.current?.click()}>
            <UploadSimple aria-hidden /> Import
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
            Start over
          </Button>
          <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => importData(e.target.files?.[0])} />
        </div>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Start over?"
        description="This clears everything you entered on this device. Export a backup first if you want to keep it."
        confirmLabel="Clear everything"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false)
          reset()
        }}
      />
      {/* Rendered before it has text, so screen readers announce each update */}
      <p role="status" className="mt-2 text-caption text-muted-foreground empty:mt-0">
        {message}
      </p>
    </div>
  )
}
