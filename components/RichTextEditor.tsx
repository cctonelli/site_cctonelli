
import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder = "Digite o conteúdo completo aqui..." }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: content || `<p style="color: #64748b; font-style: italic;">${placeholder}</p>`,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const MenuButton = ({ onClick, active, children }: any) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
        active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5 hover:text-white'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden bg-slate-950/50 backdrop-blur-xl">
      <div className="p-3 border-b border-white/5 flex flex-wrap gap-2 bg-slate-900/50">
        <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>B</MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>I</MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}>U</MenuButton>
        <div className="w-px h-6 bg-white/10 mx-1"></div>
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>H2</MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>H3</MenuButton>
        <div className="w-px h-6 bg-white/10 mx-1"></div>
        <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>List</MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>Quote</MenuButton>
      </div>
      <EditorContent 
        editor={editor} 
        className="p-8 min-h-[300px] text-slate-300 font-light prose prose-invert prose-blue max-w-none focus:outline-none"
      />
      <style>{`
        .ProseMirror { min-height: 300px; outline: none !important; }
        .ProseMirror p { margin-bottom: 1.5rem; line-height: 1.8; font-size: 1rem; }
        .ProseMirror blockquote { border-left: 4px solid #2563eb; padding-left: 1.5rem; font-style: italic; color: #94a3b8; margin: 2rem 0; }
        .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.5rem; }
        .ProseMirror h2 { font-family: 'Playfair Display', serif; font-size: 2rem; margin-top: 2rem; margin-bottom: 1rem; color: #fff; }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
