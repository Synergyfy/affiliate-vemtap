'use client';

import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline,
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  Type,
  Link2,
  Image as ImageIcon,
  Film,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const FONT_FAMILIES = [
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: "'Courier New', monospace", label: 'Courier New' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
  { value: "'Trebuchet MS', sans-serif", label: 'Trebuchet MS' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
];

const FONT_SIZES = [
  { value: '1', label: 'Extra Small' },
  { value: '2', label: 'Small' },
  { value: '3', label: 'Normal' },
  { value: '4', label: 'Medium' },
  { value: '5', label: 'Large' },
  { value: '6', label: 'Extra Large' },
  { value: '7', label: 'Huge' },
];

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<string[]>([]);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const emitChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    emitChange();
    checkActiveFormats();
  };

  const insertHtml = (html: string) => {
    document.execCommand('insertHTML', false, html);
    emitChange();
  };

  const wrapSelection = (style: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.setAttribute('style', style);
    try {
      range.surroundContents(span);
    } catch (e) {
      const fragment = range.extractContents();
      span.appendChild(fragment);
      range.insertNode(span);
    }
    emitChange();
    checkActiveFormats();
  };

  const handleInsertLink = () => {
    const url = window.prompt('Enter link URL (https://...)');
    if (!url) return;
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      document.execCommand('createLink', false, url);
    } else {
      insertHtml(`<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">${url}</a>`);
    }
    emitChange();
  };

  const handleInsertImage = () => {
    const url = window.prompt('Enter image URL');
    if (!url) return;
    insertHtml(`<img src="${url}" alt="" class="rounded-xl max-w-full my-4" style="max-width:100%" />`);
  };

  const handleInsertVideo = () => {
    const url = window.prompt('Enter video URL (YouTube / Vimeo / direct mp4)');
    if (!url) return;
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]+)/);
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    let embedHtml = '';
    if (youtubeMatch) {
      embedHtml = `<div class="my-4"><iframe width="100%" height="360" src="https://www.youtube.com/embed/${youtubeMatch[1]}" title="Video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="rounded-2xl"></iframe></div>`;
    } else if (vimeoMatch) {
      embedHtml = `<div class="my-4"><iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" width="100%" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="rounded-2xl"></iframe></div>`;
    } else {
      embedHtml = `<div class="my-4"><video controls style="width:100%;border-radius:1rem" src="${url}"></video></div>`;
    }
    insertHtml(embedHtml);
  };

  const checkActiveFormats = () => {
    const formats = [];
    if (document.queryCommandState('bold')) formats.push('bold');
    if (document.queryCommandState('italic')) formats.push('italic');
    if (document.queryCommandState('underline')) formats.push('underline');
    if (document.queryCommandState('insertUnorderedList')) formats.push('ul');
    if (document.queryCommandState('insertOrderedList')) formats.push('ol');
    
    // Check block type
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let parent = selection.getRangeAt(0).commonAncestorContainer as HTMLElement;
      if (parent.nodeType === 3) parent = parent.parentElement as HTMLElement;
      
      const tag = parent.closest('h1, h2, h3, h4, blockquote')?.tagName.toLowerCase();
      if (tag) formats.push(tag);
    }
    
    setActiveFormats(formats);
  };

  const handleInput = () => {
    emitChange();
    checkActiveFormats();
  };

  const ToolbarButton = ({ 
    command, 
    value = '', 
    icon: Icon, 
    label,
    format 
  }: { 
    command: string; 
    value?: string; 
    icon: any; 
    label: string;
    format: string;
  }) => (
    <button
      type="button"
      onClick={() => executeCommand(command, value)}
      className={cn(
        "p-2 rounded-lg transition-all hover:bg-slate-100 flex items-center justify-center",
        activeFormats.includes(format) ? "bg-blue-50 text-blue-600" : "text-slate-500"
      )}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="flex flex-col h-full border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-1 p-2 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-1 pr-2 border-r border-slate-200 mr-1">
          <ToolbarButton command="bold" format="bold" icon={Bold} label="Bold" />
          <ToolbarButton command="italic" format="italic" icon={Italic} label="Italic" />
          <ToolbarButton command="underline" format="underline" icon={Underline} label="Underline" />
        </div>
        
        <div className="flex items-center gap-1 pr-2 border-r border-slate-200 mr-1">
          <ToolbarButton command="formatBlock" value="h1" format="h1" icon={Heading1} label="Heading 1" />
          <ToolbarButton command="formatBlock" value="h2" format="h2" icon={Heading2} label="Heading 2" />
          <ToolbarButton command="formatBlock" value="p" format="p" icon={Type} label="Paragraph" />
        </div>

        <div className="flex items-center gap-1 pr-2 border-r border-slate-200 mr-1">
          <ToolbarButton command="justifyLeft" format="justifyLeft" icon={AlignLeft} label="Align Left" />
          <ToolbarButton command="justifyCenter" format="justifyCenter" icon={AlignCenter} label="Align Center" />
          <ToolbarButton command="justifyRight" format="justifyRight" icon={AlignRight} label="Align Right" />
        </div>

        <div className="flex items-center gap-1 pr-2 border-r border-slate-200 mr-1">
          <ToolbarButton command="insertUnorderedList" format="ul" icon={List} label="Bullet List" />
          <ToolbarButton command="insertOrderedList" format="ol" icon={ListOrdered} label="Numbered List" />
          <ToolbarButton command="formatBlock" value="blockquote" format="blockquote" icon={Quote} label="Quote" />
        </div>

        <div className="flex items-center gap-1 pr-2 border-r border-slate-200 mr-1">
          <button
            type="button"
            onClick={handleInsertLink}
            className={cn(
              "p-2 rounded-lg transition-all hover:bg-slate-100 flex items-center justify-center text-slate-500",
              activeFormats.includes('link') && "bg-blue-50 text-blue-600"
            )}
            title="Insert Link"
          >
            <Link2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleInsertImage}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-all"
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleInsertVideo}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-all"
            title="Insert Video"
          >
            <Film className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 pr-2 border-r border-slate-200 mr-1">
          <select
            onChange={(e) => {
              if (e.target.value) {
                document.execCommand('styleWithCSS', false, 'true');
                executeCommand('fontName', e.target.value);
              }
              e.target.value = '';
            }}
            defaultValue=""
            className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:bg-slate-50"
            title="Font Family"
          >
            <option value="" disabled>Font</option>
            {FONT_FAMILIES.map((f) => (
              <option key={f.label} value={f.value}>{f.label}</option>
            ))}
          </select>
          <select
            onChange={(e) => {
              if (e.target.value) {
                document.execCommand('styleWithCSS', false, 'true');
                executeCommand('fontSize', e.target.value);
              }
              e.target.value = '';
            }}
            defaultValue=""
            className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer hover:bg-slate-50"
            title="Font Size"
          >
            <option value="" disabled>Size</option>
            {FONT_SIZES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => executeCommand('undo')}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('redo')}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editable Area */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onMouseUp={checkActiveFormats}
        onKeyUp={checkActiveFormats}
        className="flex-grow p-8 outline-none prose prose-slate max-w-none prose-h4:text-slate-900 prose-h4:font-black prose-p:text-slate-600 prose-strong:text-slate-900 min-h-[500px]"
        style={{ minHeight: '500px' }}
      />
    </div>
  );
}
