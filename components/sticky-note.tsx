"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { X } from "lucide-react"

interface Note {
  id: string
  x: number
  y: number
  content: string
  isPublic: boolean
}

interface StickyNoteProps {
  note: Note
  isActive: boolean
  updateNote: (id: string, content: string, isPublic: boolean) => void
  deleteNote: (id: string) => void
  setActiveNote: (id: string | null) => void
}

export function StickyNote({ note, isActive, updateNote, deleteNote, setActiveNote }: StickyNoteProps) {
  const [content, setContent] = useState(note.content)
  const [isPublic, setIsPublic] = useState(note.isPublic)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isActive && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isActive])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    updateNote(note.id, e.target.value, isPublic)
  }

  const handlePublicToggle = () => {
    setIsPublic(!isPublic)
    updateNote(note.id, content, !isPublic)
  }

  const handleNoteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveNote(note.id)
  }

  return (
    <div
      className={`absolute bg-yellow-200 p-2 rounded shadow-md w-48 ${isActive ? "z-50" : "z-40"}`}
      style={{ left: `${note.x}px`, top: `${note.y}px` }}
      onClick={handleNoteClick}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium">{isPublic ? "Public" : "Personal"}</span>
          <Switch checked={isPublic} onCheckedChange={handlePublicToggle} />
        </div>
        <Button variant="ghost" size="sm" onClick={() => deleteNote(note.id)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        placeholder="Add your note here..."
        className="w-full bg-transparent border-none focus:ring-0 text-sm"
        rows={3}
      />
    </div>
  )
}

