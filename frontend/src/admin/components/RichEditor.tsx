import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
  Table as TableIcon,
  Type,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Markdown } from "tiptap-markdown";
import "./RichEditor.css";

const lowlight = createLowlight(common);

interface RichEditorProps {
  content: string;
  onChange: (content: string) => void;
  format?: "html" | "markdown";
}

interface SlashMenuItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  command: () => void;
}

export function RichEditor({
  content,
  onChange,
  format = "html",
}: RichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuFilter, setSlashMenuFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Markdown.configure({
        html: true,
        tightLists: true,
        bulletListMarker: "-",
        linkify: true,
        breaks: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      if (format === "markdown") {
        onChange(editor.storage.markdown.getMarkdown());
      } else {
        onChange(editor.getHTML());
      }
    },
  });

  // Sync content from parent
  useEffect(() => {
    if (!editor) return;
    const currentContent =
      format === "markdown"
        ? editor.storage.markdown.getMarkdown()
        : editor.getHTML();
    if (content !== currentContent) {
      editor.commands.setContent(content);
    }
  }, [content, editor, format]);

  const closeSlashMenu = useCallback(() => {
    setSlashMenuOpen(false);
    setSlashMenuFilter("");
    setSelectedIndex(0);
  }, []);

  const deleteSlashCommand = useCallback(() => {
    if (!editor) return;
    const { state } = editor;
    const { from } = state.selection;
    const textBefore = state.doc.textBetween(
      Math.max(0, from - 20),
      from,
      "\n",
    );
    const slashMatch = textBefore.match(/\/(\w*)$/);
    if (slashMatch) {
      editor.commands.deleteRange({
        from: from - slashMatch[0].length,
        to: from,
      });
    }
  }, [editor]);

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const slashMenuItems: SlashMenuItem[] = useMemo(
    () =>
      editor
        ? [
            {
              title: "Text",
              description: "Just start writing with plain text",
              icon: <Type size={18} />,
              command: () => {
                deleteSlashCommand();
                editor.chain().focus().setParagraph().run();
              },
            },
            {
              title: "Heading 1",
              description: "Large section heading",
              icon: <Heading1 size={18} />,
              command: () => {
                deleteSlashCommand();
                editor.chain().focus().toggleHeading({ level: 1 }).run();
              },
            },
            {
              title: "Heading 2",
              description: "Medium section heading",
              icon: <Heading2 size={18} />,
              command: () => {
                deleteSlashCommand();
                editor.chain().focus().toggleHeading({ level: 2 }).run();
              },
            },
            {
              title: "Heading 3",
              description: "Small section heading",
              icon: <Heading3 size={18} />,
              command: () => {
                deleteSlashCommand();
                editor.chain().focus().toggleHeading({ level: 3 }).run();
              },
            },
            {
              title: "Bullet List",
              description: "Create a simple bullet list",
              icon: <List size={18} />,
              command: () => {
                deleteSlashCommand();
                editor.chain().focus().toggleBulletList().run();
              },
            },
            {
              title: "Numbered List",
              description: "Create a numbered list",
              icon: <ListOrdered size={18} />,
              command: () => {
                deleteSlashCommand();
                editor.chain().focus().toggleOrderedList().run();
              },
            },
            {
              title: "Quote",
              description: "Capture a quote",
              icon: <Quote size={18} />,
              command: () => {
                deleteSlashCommand();
                editor.chain().focus().toggleBlockquote().run();
              },
            },
            {
              title: "Code Block",
              description: "Add a code snippet",
              icon: <Code size={18} />,
              command: () => {
                deleteSlashCommand();
                editor.chain().focus().toggleCodeBlock().run();
              },
            },
            {
              title: "Divider",
              description: "Visual divider line",
              icon: <Minus size={18} />,
              command: () => {
                deleteSlashCommand();
                editor.chain().focus().setHorizontalRule().run();
              },
            },
            {
              title: "Image",
              description: "Upload an image",
              icon: <ImageIcon size={18} />,
              command: () => {
                handleImageUpload();
              },
            },
            {
              title: "Table",
              description: "Add a table",
              icon: <TableIcon size={18} />,
              command: () => {
                deleteSlashCommand();
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run();
              },
            },
          ]
        : [],
    [editor, deleteSlashCommand, handleImageUpload],
  );

  const filteredItems = useMemo(
    () =>
      slashMenuItems.filter(
        (item) =>
          item.title.toLowerCase().includes(slashMenuFilter.toLowerCase()) ||
          item.description
            .toLowerCase()
            .includes(slashMenuFilter.toLowerCase()),
      ),
    [slashMenuItems, slashMenuFilter],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !editor) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        deleteSlashCommand();
        editor.chain().focus().setImage({ src: base64 }).run();
      };
      reader.readAsDataURL(file);
      event.target.value = "";
      closeSlashMenu();
    },
    [editor, deleteSlashCommand, closeSlashMenu],
  );

  // Ref for filtered items to use in effect
  const filteredItemsRef = useRef(filteredItems);
  filteredItemsRef.current = filteredItems;

  // Slash command keyboard handler
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (slashMenuOpen) {
        const items = filteredItemsRef.current;
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSelectedIndex((i) => (i + 1) % items.length);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setSelectedIndex((i) => (i - 1 + items.length) % items.length);
        } else if (event.key === "Enter") {
          event.preventDefault();
          items[selectedIndex]?.command();
          closeSlashMenu();
        } else if (event.key === "Escape") {
          closeSlashMenu();
        } else if (event.key === "Backspace" && slashMenuFilter === "") {
          closeSlashMenu();
        }
      }
    };

    editor.view.dom.addEventListener("keydown", handleKeyDown);
    return () => {
      editor.view.dom.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor, slashMenuOpen, slashMenuFilter, selectedIndex, closeSlashMenu]);

  // Slash command input detection
  useEffect(() => {
    if (!editor) return;

    const handleInput = () => {
      const { state } = editor;
      const { from } = state.selection;
      const textBefore = state.doc.textBetween(
        Math.max(0, from - 20),
        from,
        "\n",
      );

      const slashMatch = textBefore.match(/\/(\w*)$/);
      if (slashMatch) {
        setSlashMenuOpen(true);
        setSlashMenuFilter(slashMatch[1] || "");
        setSelectedIndex(0);
      } else if (slashMenuOpen) {
        closeSlashMenu();
      }
    };

    editor.on("update", handleInput);
    return () => {
      editor.off("update", handleInput);
    };
  }, [editor, slashMenuOpen, closeSlashMenu]);

  if (!editor) {
    return null;
  }

  return (
    <div className="rich-editor">
      {/* Bubble Menu - appears on text selection */}
      <BubbleMenu editor={editor} className="bubble-menu">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "active" : ""}
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "active" : ""}
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? "active" : ""}
        >
          <Strikethrough size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={editor.isActive("code") ? "active" : ""}
        >
          <Code size={16} />
        </button>
        <div className="bubble-divider" />
        <button
          type="button"
          onClick={setLink}
          className={editor.isActive("link") ? "active" : ""}
        >
          <LinkIcon size={16} />
        </button>
      </BubbleMenu>

      {/* Floating Menu - appears on empty lines */}
      <FloatingMenu editor={editor} className="floating-menu">
        <span className="floating-hint">Type '/' for commands</span>
      </FloatingMenu>

      {/* Slash Command Menu */}
      {slashMenuOpen && filteredItems.length > 0 && (
        <div className="slash-menu">
          {filteredItems.map((item, index) => (
            <button
              key={item.title}
              type="button"
              className={`slash-menu-item ${index === selectedIndex ? "selected" : ""}`}
              onClick={() => {
                item.command();
                closeSlashMenu();
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="slash-menu-icon">{item.icon}</div>
              <div className="slash-menu-content">
                <div className="slash-menu-title">{item.title}</div>
                <div className="slash-menu-description">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      <EditorContent editor={editor} className="editor-content" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
