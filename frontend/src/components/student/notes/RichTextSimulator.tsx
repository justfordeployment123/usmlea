import { useEffect, useRef } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, Heading2 } from 'lucide-react'

interface RichTextSimulatorProps {
  content: string
  onChange: (nextContent: string) => void
}

export default function RichTextSimulator({ content, onChange }: RichTextSimulatorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)

  const toHtml = (value: string) => {
    if (!value) return ''

    const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(value)
    const containsHtmlEntity = /&(?:nbsp|amp|lt|gt|quot|#\d+);/i.test(value)
    if (looksLikeHtml || containsHtmlEntity) return value

    const escaped = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    return escaped.replace(/\n/g, '<br>')
  }

  const getPlainText = (value: string) => {
    const withoutHtml = value.replace(/<[^>]*>/g, ' ')
    const withoutMarkdown = withoutHtml
      .replace(/[*_`~]/g, '')
      .replace(/^\s*[-+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')

    const decoded = withoutMarkdown
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')

    return decoded.replace(/\s+/g, ' ').trim()
  }

  const words = getPlainText(content).trim()
    ? getPlainText(content).trim().split(/\s+/).length
    : 0

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const nextHtml = toHtml(content)
    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml
    }
  }, [content])

  const applyCommand = (command: string, value?: string) => {
    const editor = editorRef.current
    if (!editor) return

    editor.focus()
    document.execCommand(command, false, value)
    onChange(editor.innerHTML)
  }

  return (
    <div className="rich-editor">
      <div className="rich-editor__toolbar" role="toolbar" aria-label="Formatting controls">
        <button
          type="button"
          aria-label="Heading"
          onClick={() => applyCommand('formatBlock', 'h2')}
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          aria-label="Bold"
          onClick={() => applyCommand('bold')}
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          aria-label="Italic"
          onClick={() => applyCommand('italic')}
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          aria-label="Underline"
          onClick={() => applyCommand('underline')}
        >
          <Underline size={16} />
        </button>
        <button
          type="button"
          aria-label="Bullet List"
          onClick={() => applyCommand('insertUnorderedList')}
        >
          <List size={16} />
        </button>
        <button
          type="button"
          aria-label="Numbered List"
          onClick={() => applyCommand('insertOrderedList')}
        >
          <ListOrdered size={16} />
        </button>
      </div>

      <div
        ref={editorRef}
        className="rich-editor__editable"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Start typing your note..."
        onInput={event => onChange((event.currentTarget as HTMLDivElement).innerHTML)}
      />

      <div className="rich-editor__footer">
        <span>{words} words</span>
        <span>Auto-save enabled</span>
      </div>
    </div>
  )
}
