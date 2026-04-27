'use client';

import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  Type
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<string[]>([]);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const executeCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    checkActiveFormats();
  };

  const checkActiveFormats = () => {
    const formats = [];
    if (document.queryCommandState('bold')) formats.push('bold');
    if (document.queryCommandState('italic')) formats.push('italic');
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
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
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
        </div>
        
        <div className="flex items-center gap-1 pr-2 border-r border-slate-200 mr-1">
          <ToolbarButton command="formatBlock" value="h1" format="h1" icon={Heading1} label="Heading 1" />
          <ToolbarButton command="formatBlock" value="h2" format="h2" icon={Heading2} label="Heading 2" />
          <ToolbarButton command="formatBlock" value="p" format="p" icon={Type} label="Paragraph" />
        </div>

        <div className="flex items-center gap-1 pr-2 border-r border-slate-200 mr-1">
          <ToolbarButton command="insertUnorderedList" format="ul" icon={List} label="Bullet List" />
          <ToolbarButton command="insertOrderedList" format="ol" icon={ListOrdered} label="Numbered List" />
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
