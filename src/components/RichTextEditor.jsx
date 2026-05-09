import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { memo } from 'react'

function RichTextEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) return null

  const btn = (action, label, isActive = false) => (
    <button
      type="button"
      onClick={action}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
        isActive
          ? 'bg-indigo-100 text-indigo-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
      {/* Barra de herramientas */}
      <div className="flex flex-wrap gap-1 p-2 bg-slate-50 border-b border-slate-200">
        {btn(() => editor.chain().focus().toggleBold().run(), 'N', editor.isActive('bold'))}
        {btn(() => editor.chain().focus().toggleItalic().run(), 'I', editor.isActive('italic'))}
        {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', editor.isActive('heading', { level: 2 }))}
        {btn(() => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3', editor.isActive('heading', { level: 3 }))}
        {btn(() => editor.chain().focus().toggleBulletList().run(), '• Lista', editor.isActive('bulletList'))}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), '1. Lista', editor.isActive('orderedList'))}
        {btn(() => editor.chain().focus().toggleBlockquote().run(), '❝', editor.isActive('blockquote'))}
        <div className="w-px bg-slate-200 mx-1" />
        {btn(() => editor.chain().focus().undo().run(), '↩')}
        {btn(() => editor.chain().focus().redo().run(), '↪')}
      </div>

      {/* Área de escritura */}
      <EditorContent
        editor={editor}
        className="prose prose-indigo max-w-none p-4 min-h-48 focus:outline-none text-slate-700"
      />
    </div>
  )
}

export default memo(RichTextEditor)