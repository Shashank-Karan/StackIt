import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CodeBlock from '@tiptap/extension-code-block';
import Blockquote from '@tiptap/extension-blockquote';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Underline from '@tiptap/extension-underline';
import Code from '@tiptap/extension-code';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Smile,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code as CodeIcon,
  Code2,
  Quote,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Type,
  Upload,
  Eye,
  EyeOff,
  Separator
} from 'lucide-react';
import { useCallback, useState } from 'react';
import TurndownService from 'turndown';
import MarkdownIt from 'markdown-it';

interface TiptapEditorProps {
  content: string;
  onUpdate: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const turndownService = new TurndownService();
const markdownIt = new MarkdownIt();

export function TiptapEditor({ content, onUpdate, placeholder, className }: TiptapEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState('16px');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:text-blue-700 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-2',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300 my-4',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border border-gray-300',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 bg-gray-50 font-bold p-2',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 rounded-lg p-4 my-4 overflow-x-auto',
        },
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: 'border-l-4 border-blue-500 pl-4 italic my-4',
        },
      }),
      TextStyle,
      FontFamily,
      Underline,
      Code.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 px-2 py-1 rounded text-sm',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
        style: `font-size: ${currentFontSize};`,
      },
    },
  });

  const addLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('Image URL');

    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        editor?.chain().focus().setImage({ src }).run();
        setUploadedImages(prev => [...prev, src]);
      };
      reader.readAsDataURL(file);
    }
  }, [editor]);

  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addEmoji = useCallback(() => {
    const emoji = window.prompt('Enter emoji');
    if (emoji) {
      editor?.chain().focus().insertContent(emoji).run();
    }
  }, [editor]);

  const setFontSize = useCallback((size: string) => {
    setCurrentFontSize(size);
    const editorElement = document.querySelector('.ProseMirror');
    if (editorElement) {
      (editorElement as HTMLElement).style.fontSize = size;
    }
  }, []);

  const getMarkdownContent = useCallback(() => {
    if (!editor) return '';
    return turndownService.turndown(editor.getHTML());
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Enhanced Toolbar */}
      <div className="p-3 border-b border-gray-200 bg-gray-50 space-y-2">
        {/* Row 1: Font Controls */}
        <div className="flex items-center space-x-2 flex-wrap">
          <Select value={currentFontSize} onValueChange={setFontSize}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12px">12px</SelectItem>
              <SelectItem value="14px">14px</SelectItem>
              <SelectItem value="16px">16px</SelectItem>
              <SelectItem value="18px">18px</SelectItem>
              <SelectItem value="20px">20px</SelectItem>
              <SelectItem value="24px">24px</SelectItem>
              <SelectItem value="28px">28px</SelectItem>
              <SelectItem value="32px">32px</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="w-px h-6 bg-gray-300" />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-blue-100' : ''}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-blue-100' : ''}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'bg-blue-100' : ''}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'bg-blue-100' : ''}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={editor.isActive('code') ? 'bg-blue-100' : ''}
            title="Inline Code"
          >
            <CodeIcon className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300" />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'bg-blue-100' : ''}
            title="Blockquote"
          >
            <Quote className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive('codeBlock') ? 'bg-blue-100' : ''}
            title="Code Block"
          >
            <Code2 className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Row 2: Lists and Alignment */}
        <div className="flex items-center space-x-2 flex-wrap">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-blue-100' : ''}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-blue-100' : ''}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300" />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100' : ''}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100' : ''}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100' : ''}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300" />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addLink}
            className={editor.isActive('link') ? 'bg-blue-100' : ''}
            title="Add Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addImage}
            title="Add Image from URL"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          
          <label className="inline-flex">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              title="Upload Image"
              asChild
            >
              <span>
                <Upload className="h-4 w-4" />
              </span>
            </Button>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addTable}
            title="Insert Table"
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300" />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className={showPreview ? 'bg-blue-100' : ''}
            title="Toggle Markdown Preview"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="ml-1 text-xs">Preview</span>
          </Button>
        </div>
        
        {/* Table Controls (shown when table is active) */}
        {editor.isActive('table') && (
          <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded border">
            <span className="text-sm font-medium">Table:</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addRowBefore().run()}
              title="Add Row Before"
            >
              ↑ Row
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="Add Row After"
            >
              ↓ Row
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              title="Add Column Before"
            >
              ← Col
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="Add Column After"
            >
              → Col
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteRow().run()}
              title="Delete Row"
              className="text-red-600"
            >
              Del Row
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              title="Delete Column"
              className="text-red-600"
            >
              Del Col
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().deleteTable().run()}
              title="Delete Table"
              className="text-red-600"
            >
              Del Table
            </Button>
          </div>
        )}
      </div>
      
      {/* Editor Content or Preview */}
      {showPreview ? (
        <Card className="m-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Markdown Preview</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Back to Editor
              </Button>
            </div>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
                {getMarkdownContent()}
              </pre>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EditorContent 
          editor={editor}
          className="min-h-[200px]"
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
