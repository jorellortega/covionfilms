"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Bot, Minimize2, Maximize2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { AIMessage } from "@/types/ai"

const INITIAL_ASSISTANT_MESSAGE: AIMessage = {
  role: "assistant",
  content: "Hello! I'm Covion Intelligence, your AI assistant for COVION FILMS. I can help you discover movies, answer questions about our platform, or assist with anything else you need. How can I help you today?",
  timestamp: new Date().toISOString(),
}

// Helper to convert markdown links to clickable links
function renderMessage(content: string) {
  // Simple markdown link conversion: [text](url) -> <a>text</a>
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts: (string | JSX.Element)[] = []
  let lastIndex = 0
  let match
  let key = 0

  while ((match = linkRegex.exec(content)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index))
    }
    // Add the link
    parts.push(
      <a
        key={key++}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyan-400 hover:text-cyan-300 underline"
      >
        {match[1]}
      </a>
    )
    lastIndex = match.index + match[0].length
  }
  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex))
  }

  return parts.length > 0 ? parts : content
}

export function AIChat() {
  const [messages, setMessages] = useState<AIMessage[]>([INITIAL_ASSISTANT_MESSAGE])
  const [input, setInput] = useState("")
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Check if user has sent any messages (to determine if chat should be expanded)
  const hasUserMessages = messages.some((msg) => msg.role === "user")
  const isCompact = !hasUserMessages

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }, 100)
      }
    }
  }, [messages, isLoading])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: AIMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    // Optimistically add user message
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    try {
      // Build conversation history (exclude system messages and initial assistant message)
      const conversationHistory = updatedMessages
        .filter((msg, idx) => msg.role !== "system" && !(idx === 0 && msg.role === "assistant"))
        .map(({ role, content }) => ({ role, content }))

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
        }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to get AI response"
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch (e) {
          // If response is not JSON, get text
          const text = await response.text()
          errorMessage = text || errorMessage
        }
        throw new Error(errorMessage)
      }

      let responseData
      try {
        responseData = await response.json()
      } catch (e) {
        console.error("Failed to parse response as JSON:", e)
        throw new Error("Invalid response from server")
      }

      const { message } = responseData
      if (!message) {
        throw new Error("No message in response")
      }
      const assistantMessage: AIMessage = {
        role: "assistant",
        content: message,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      console.error("Error sending message:", error)
      // Rollback: remove the user message on error
      setMessages((prev) => prev.filter((msg) => msg !== userMessage))
      
      // Show error message
      const errorMessage: AIMessage = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${error.message || "Please try again later."}`,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-cyan-500/20 w-full max-w-4xl mx-auto">
      <CardHeader className={isCompact ? "pb-3" : "pb-3"}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-primary">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-primary">AI Assistant</CardTitle>
              <p className="text-xs text-muted-foreground">Ask me anything about COVION FILMS</p>
            </div>
          </div>
          {!isCompact && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8"
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      {isCompact ? (
        // Compact view - just input and send button
        <CardContent className="p-4 pt-0">
          <form onSubmit={handleSend}>
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about COVION FILMS..."
                className="flex-1 bg-background border-gray-700 focus:border-cyan-500"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-cyan-500 to-primary text-white hover:from-cyan-600 hover:to-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      ) : (
        // Expanded view - full chat interface
        !isMinimized && (
          <CardContent className="p-0">
            <ScrollArea className="h-[400px] w-full border-b border-gray-700" ref={scrollAreaRef}>
              <div className="p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-primary to-[#8e2de2] text-white"
                          : "bg-card border border-gray-700 text-foreground"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.role === "assistant" ? renderMessage(message.content) : message.content}
                      </p>
                      {message.timestamp && (
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-card border border-gray-700 rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <form onSubmit={handleSend} className="p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about COVION FILMS..."
                  className="flex-1 bg-background border-gray-700 focus:border-cyan-500"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-cyan-500 to-primary text-white hover:from-cyan-600 hover:to-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        )
      )}
    </Card>
  )
}

