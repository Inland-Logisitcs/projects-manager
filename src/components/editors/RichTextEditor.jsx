import { useEditor, EditorContent } from '@tiptap/react';
import { useRef, useState } from 'react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import Toast from '../common/Toast';
import { uploadImage } from '../../services/storageService';
import { cleanupUnusedImages } from '../../utils/imageCleanup';
import '../../styles/RichTextEditor.css';

const MenuBar = ({ editor, onImageUpload, isUploading }) => {
  const fileInputRef = useRef(null);

  if (!editor) return null;

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      await onImageUpload(file);
    }
    // Limpiar input
    event.target.value = '';
  };

  return (
    <div className="editor-menubar flex items-center gap-xs p-sm">
      <div className="flex gap-2xs">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`editor-menu-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
          title="Negrita (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`editor-menu-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
          title="Cursiva (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`editor-menu-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
          title="Tachado"
        >
          <s>S</s>
        </button>
      </div>

      <div className="divider-vertical" style={{ height: '24px' }}></div>

      <div className="flex gap-2xs">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`editor-menu-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
          title="Título 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`editor-menu-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
          title="Título 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`editor-menu-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
          title="Título 3"
        >
          H3
        </button>
      </div>

      <div className="divider-vertical" style={{ height: '24px' }}></div>

      <div className="flex gap-2xs">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`editor-menu-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
          title="Lista con viñetas"
        >
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`editor-menu-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
          title="Lista numerada"
        >
          1.
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`editor-menu-btn ${editor.isActive('taskList') ? 'is-active' : ''}`}
          title="Lista de tareas"
        >
          ✓
        </button>
      </div>

      <div className="divider-vertical" style={{ height: '24px' }}></div>

      <div className="flex gap-2xs">
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`editor-menu-btn ${editor.isActive('codeBlock') ? 'is-active' : ''}`}
          title="Bloque de código"
        >
          {'</>'}
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`editor-menu-btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
          title="Cita"
        >
          "
        </button>
      </div>

      <div className="divider-vertical" style={{ height: '24px' }}></div>

      <div className="flex gap-2xs">
        <button
          onClick={() => {
            const url = window.prompt('URL del enlace:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`editor-menu-btn ${editor.isActive('link') ? 'is-active' : ''}`}
          title="Insertar enlace"
        >
          🔗
        </button>
        <button
          onClick={handleImageClick}
          disabled={isUploading}
          className="editor-menu-btn"
          title="Insertar imagen"
        >
          {isUploading ? '⏳' : '🖼️'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

const RichTextEditor = ({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  readOnly = false,
  taskId
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const previousHtmlRef = useRef(value || '');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      TextStyle,
      Color,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: value || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (!readOnly) {
        const newHtml = editor.getHTML();

        // Detectar y eliminar imágenes borradas inmediatamente
        if (taskId && previousHtmlRef.current) {
          cleanupUnusedImages(previousHtmlRef.current, newHtml, taskId);
        }

        // Actualizar referencia del HTML anterior
        previousHtmlRef.current = newHtml;

        // Notificar cambio al padre
        if (onChange) {
          onChange(newHtml);
        }
      }
    },
    editorProps: {
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handleImageUpload(file, view.state.selection.from);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
              const file = items[i].getAsFile();
              if (file) {
                event.preventDefault();
                handleImageUpload(file, view.state.selection.from);
                return true;
              }
            }
          }
        }
        return false;
      },
    },
  });

  // Manejar subida de imagen
  const handleImageUpload = async (file, position = null) => {
    if (!taskId) {
      setToast({ message: 'No se puede subir imágenes sin un ID de tarea', type: 'error' });
      return;
    }

    setIsUploading(true);
    const result = await uploadImage(file, taskId);
    setIsUploading(false);

    if (result.success && result.url) {
      if (position !== null) {
        editor.chain().focus().insertContentAt(position, {
          type: 'image',
          attrs: { src: result.url },
        }).run();
      } else {
        editor.chain().focus().setImage({ src: result.url }).run();
      }
    } else {
      setToast({ message: result.error || 'Error al subir imagen', type: 'error' });
    }
  };

  // Actualizar contenido cuando cambia externamente
  if (editor && value !== editor.getHTML()) {
    editor.commands.setContent(value || '');
    previousHtmlRef.current = value || '';
  }

  return (
    <div className={`tiptap-editor ${readOnly ? 'read-only' : ''}`}>
      {!readOnly && (
        <MenuBar
          editor={editor}
          onImageUpload={handleImageUpload}
          isUploading={isUploading}
        />
      )}
      <EditorContent editor={editor} />
      {isUploading && (
        <div className="editor-upload-overlay">
          Subiendo imagen...
        </div>
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default RichTextEditor;
