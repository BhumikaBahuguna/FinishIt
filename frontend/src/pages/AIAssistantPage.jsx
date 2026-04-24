/**
 * AIAssistantPage.jsx — AI PRODUCTIVITY ASSISTANT (/ai-assistant)
 *
 * A premium chat-based AI assistant that helps users:
 *   - Plan tasks efficiently using their real data
 *   - Summarize weekly progress
 *   - Analyze habit performance
 *   - Answer free-form productivity questions
 *
 * Features a modern chat interface with quick action buttons,
 * typing indicators, and markdown-like formatted responses.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  gatherUserContext,
  sendAIMessage,
  QUICK_ACTIONS,
} from "../services/aiAssistantApi";

const WELCOME_MESSAGE = {
  role: "assistant",
  content: `Hey! 👋 I'm your **FinishIt AI** assistant. I have access to all your tasks, habits, and productivity data.

Here's what I can help you with:

• **Plan your tasks** — I'll create an optimized schedule based on deadlines & priorities
• **Weekly summaries** — Get a comprehensive progress report
• **Habit analysis** — Discover your most/least consistent habits
• **Focus recommendations** — Know exactly what to work on today
• **Productivity coaching** — Personalized tips from your data

Use the quick actions below or ask me anything! 🚀`,
  timestamp: new Date().toISOString(),
};

/**
 * Render message content with basic markdown-like formatting.
 */
function renderFormattedContent(text) {
  const lines = text.split("\n");
  const elements = [];
  let listBuffer = [];

  function flushList() {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="ai-msg-list">
          {listBuffer.map((item, i) => (
            <li key={i}>{renderInlineFormatting(item)}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headers
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h5 key={i} className="ai-msg-h3">{renderInlineFormatting(line.slice(4))}</h5>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h4 key={i} className="ai-msg-h2">{renderInlineFormatting(line.slice(3))}</h4>
      );
    } else if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h3 key={i} className="ai-msg-h1">{renderInlineFormatting(line.slice(2))}</h3>
      );
    }
    // Bullet list items
    else if (/^[\-\*•]\s/.test(line)) {
      listBuffer.push(line.replace(/^[\-\*•]\s/, ""));
    }
    // Numbered list items
    else if (/^\d+[\.\)]\s/.test(line)) {
      listBuffer.push(line);
    }
    // Empty lines
    else if (line.trim() === "") {
      flushList();
      // Don't add excessive spacing
    }
    // Regular paragraphs
    else {
      flushList();
      elements.push(
        <p key={i} className="ai-msg-p">{renderInlineFormatting(line)}</p>
      );
    }
  }

  flushList();
  return elements;
}

/**
 * Inline formatting: bold, italic, code
 */
function renderInlineFormatting(text) {
  const parts = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Bold **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Code `text`
    const codeMatch = remaining.match(/`([^`]+)`/);

    let firstMatch = null;
    let matchType = null;

    if (boldMatch && (!firstMatch || boldMatch.index < firstMatch.index)) {
      firstMatch = boldMatch;
      matchType = "bold";
    }
    if (codeMatch && (!firstMatch || codeMatch.index < firstMatch.index)) {
      firstMatch = codeMatch;
      matchType = "code";
    }

    if (!firstMatch) {
      parts.push(remaining);
      break;
    }

    // Text before the match
    if (firstMatch.index > 0) {
      parts.push(remaining.slice(0, firstMatch.index));
    }

    if (matchType === "bold") {
      parts.push(<strong key={keyIndex++}>{firstMatch[1]}</strong>);
    } else if (matchType === "code") {
      parts.push(<code key={keyIndex++} className="ai-msg-code">{firstMatch[1]}</code>);
    }

    remaining = remaining.slice(firstMatch.index + firstMatch[0].length);
  }

  return parts;
}

export function AIAssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load user context on mount
  useEffect(() => {
    async function loadContext() {
      if (!user?.id) {
        setContextLoading(false);
        return;
      }

      setContextLoading(true);
      setContextError("");

      const { context, error } = await gatherUserContext(user.id);

      if (error) {
        setContextError(error.message ?? "Unable to load your data.");
        setContextLoading(false);
        return;
      }

      setUserContext(context);
      setContextLoading(false);
    }

    loadContext();
  }, [user?.id]);

  async function handleSend(messageText) {
    const text = (messageText || inputValue).trim();
    if (!text || isLoading) return;

    // Add user message
    const userMsg = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    // If context isn't loaded yet, try to reload
    let ctx = userContext;
    if (!ctx && user?.id) {
      const { context } = await gatherUserContext(user.id);
      ctx = context;
      if (context) setUserContext(context);
    }

    if (!ctx) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm unable to access your productivity data right now. Please make sure you're logged in and try again.",
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
      setIsLoading(false);
      return;
    }

    const { response, error } = await sendAIMessage(text, ctx);

    if (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I encountered an error: ${error.message}`,
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response,
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    setIsLoading(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleQuickAction(action) {
    handleSend(action.prompt);
  }

  function handleClearChat() {
    setMessages([WELCOME_MESSAGE]);
  }

  function formatTime(isoString) {
    try {
      return new Date(isoString).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  return (
    <div className="ai-assistant-page">
      {/* Header */}
      <header className="ai-assistant-header">
        <div className="ai-assistant-header__left">
          <div className="ai-assistant-avatar">
            <span className="ai-assistant-avatar__icon">✦</span>
            <span className="ai-assistant-avatar__pulse" />
          </div>
          <div className="ai-assistant-header__info">
            <h1 className="ai-assistant-header__title">FinishIt AI</h1>
            <p className="ai-assistant-header__status">
              {contextLoading
                ? "Loading your data..."
                : contextError
                ? "Data unavailable"
                : `${userContext?.stats?.totalTasks ?? 0} tasks · ${userContext?.stats?.totalHabits ?? 0} habits analyzed`}
            </p>
          </div>
        </div>
        <div className="ai-assistant-header__right">
          <button
            className="ai-assistant-clear-btn"
            onClick={handleClearChat}
            title="Clear chat"
            type="button"
          >
            ✕ Clear
          </button>
        </div>
      </header>

      {contextError && (
        <div className="ai-assistant-context-error">
          <span>⚠️</span> {contextError}
        </div>
      )}

      {/* Quick Actions */}
      <div className="ai-quick-actions">
        <p className="ai-quick-actions__label">Quick Actions</p>
        <div className="ai-quick-actions__grid">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              className="ai-quick-action-btn"
              onClick={() => handleQuickAction(action)}
              disabled={isLoading || contextLoading}
              type="button"
              id={`ai-action-${action.id}`}
            >
              <span className="ai-quick-action-btn__icon">{action.icon}</span>
              <span className="ai-quick-action-btn__label">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="ai-chat-container">
        <div className="ai-chat-messages">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`ai-chat-bubble ${
                msg.role === "user"
                  ? "ai-chat-bubble--user"
                  : "ai-chat-bubble--assistant"
              } ${msg.isError ? "ai-chat-bubble--error" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="ai-chat-bubble__avatar">✦</div>
              )}
              <div className="ai-chat-bubble__content">
                <div className="ai-chat-bubble__text">
                  {msg.role === "assistant"
                    ? renderFormattedContent(msg.content)
                    : msg.content}
                </div>
                <span className="ai-chat-bubble__time">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="ai-chat-bubble ai-chat-bubble--assistant">
              <div className="ai-chat-bubble__avatar">✦</div>
              <div className="ai-chat-bubble__content">
                <div className="ai-typing-indicator">
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="ai-chat-input-area">
        <div className="ai-chat-input-wrapper">
          <textarea
            ref={inputRef}
            className="ai-chat-input"
            placeholder={
              contextLoading
                ? "Loading your data..."
                : "Ask me anything about your tasks, habits, or productivity..."
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || contextLoading}
            rows={1}
            id="ai-chat-input"
          />
          <button
            className="ai-chat-send-btn"
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading || contextLoading}
            title="Send message"
            type="button"
            id="ai-chat-send"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="ai-chat-disclaimer">
          AI responses are based on your data. Results may vary.
        </p>
      </div>
    </div>
  );
}
