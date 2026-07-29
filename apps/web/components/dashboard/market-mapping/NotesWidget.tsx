'use client';

import { BusinessNote } from '@/types/affiliate-market-mapping';
import { StickyNote, Mic, CalendarClock, MessageSquarePlus, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface NotesWidgetProps {
  notes: BusinessNote[];
}

export default function NotesWidget({ notes }: NotesWidgetProps) {
  const [activeTab, setActiveTab] = useState<'NOTES' | 'TASKS'>('NOTES');
  
  const filteredNotes = notes.filter(n => 
    activeTab === 'NOTES' ? (n.type === 'TEXT' || n.type === 'VOICE') : (n.type === 'TASK' || n.type === 'REMINDER')
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row overflow-hidden">
      
      {/* Left sidebar / Tabs */}
      <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-5 shrink-0">
        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 mb-6">
          <StickyNote className="w-5 h-5 text-amber-500" />
          Field Notes
        </h3>
        
        <div className="flex md:flex-col gap-2">
          <button 
            onClick={() => setActiveTab('NOTES')}
            className={cn("px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors flex-1 md:flex-none justify-start", activeTab === 'NOTES' ? "bg-white border border-slate-200 shadow-sm text-slate-900" : "text-slate-500 hover:bg-slate-200/50")}
          >
            <MessageSquarePlus className="w-4 h-4" />
            General Notes
          </button>
          <button 
            onClick={() => setActiveTab('TASKS')}
            className={cn("px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors flex-1 md:flex-none justify-start", activeTab === 'TASKS' ? "bg-white border border-slate-200 shadow-sm text-slate-900" : "text-slate-500 hover:bg-slate-200/50")}
          >
            <CalendarClock className="w-4 h-4" />
            Follow-ups & Tasks
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1 space-y-3 mb-4">
          {filteredNotes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm py-8">
              No items found.
            </div>
          ) : (
            filteredNotes.map(note => (
              <div key={note.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                {note.type === 'TASK' || note.type === 'REMINDER' ? (
                  note.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 cursor-pointer" /> : <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5 cursor-pointer hover:text-blue-500 transition-colors" />
                ) : note.type === 'VOICE' ? (
                  <Mic className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                ) : (
                  <StickyNote className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                )}
                
                <div className="flex-1">
                  <p className={cn("text-sm font-medium text-slate-700", note.completed && "line-through text-slate-400")}>{note.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-bold text-slate-400">{new Date(note.createdAt).toLocaleDateString()}</span>
                    {note.dueDate && (
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded border", note.completed ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-rose-50 text-rose-600 border-rose-100")}>
                        Due: {new Date(note.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="relative">
          <input 
            type="text" 
            placeholder={activeTab === 'NOTES' ? "Type a quick note..." : "Add a new task or reminder..."}
            className="w-full pl-4 pr-24 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 shadow-sm"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {activeTab === 'NOTES' && (
              <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <Mic className="w-4 h-4" />
              </button>
            )}
            <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">
              Save
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
