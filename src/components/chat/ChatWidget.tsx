"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

const SESSION_KEY = "cunpollo-chat-session";
const BOT_AVATAR = "https://igwu4bqzucdjjkup.public.blob.vercel-storage.com/Public/botsitocunpollo.png";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function ChatWidget() {
  const t = useTranslations("chat");
  const locale = useLocale();
  const { addItem, removeItem } = useCart();
  const [open, setOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef("");

  useEffect(() => {
    sessionIdRef.current = getSessionId();
  }, []);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { locale, sessionId: sessionIdRef.current },
      }),
    [locale]
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    onFinish: () => {
      scrollToBottom();
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Process cart actions from tool invocations in message parts
  const processedActions = useRef(new Set<string>());

  const processCartActions = useCallback(() => {
    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      for (const part of msg.parts) {
        if (!part.type?.startsWith("tool-")) continue;
        const toolPart = part as { type: string; state: string; toolCallId?: string; output?: Record<string, unknown> };
        if (toolPart.state !== "output-available" || !toolPart.output) continue;

        const { action, menuItemId, quantity } = toolPart.output as {
          action?: string;
          menuItemId?: string;
          quantity?: number;
        };
        if (!action || !menuItemId) continue;

        const key = `${msg.id}-${toolPart.toolCallId}-${action}`;
        if (processedActions.current.has(key)) continue;
        processedActions.current.add(key);

        if (action === "addToCart") {
          addItem(menuItemId, (quantity as number) || 1);
        } else if (action === "removeFromCart") {
          removeItem(menuItemId);
        }
      }
    }
  }, [messages, addItem, removeItem]);

  useEffect(() => {
    processCartActions();
  }, [processCartActions]);

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open]);

  function handleSend(text: string) {
    sendMessage({ text });
  }

  function handleAddToCart(menuItemId: string, quantity: number) {
    addItem(menuItemId, quantity);
  }

  function handleQuickReply(text: string) {
    sendMessage({ text });
  }

  const showSuggestions = messages.length === 0 && !isLoading;

  return (
    <>
      {/* Floating button + label */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        className="fixed bottom-4 left-4 z-40 flex items-end gap-1"
      >
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? t("close") : t("open")}
          className="relative w-20 h-20 transition-transform hover:scale-105 flex items-center justify-center"
        >
          {open ? (
            <div className="w-12 h-12 bg-red-600 rounded-full shadow-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ) : (
            <img
              src={BOT_AVATAR}
              alt="CunPollo Bot"
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
          )}
        </button>
        {!open && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5 }}
            className="bg-white rounded-xl shadow-md border border-gray-200 px-3 py-1.5 mb-2 max-w-[160px]"
          >
            <p className="text-xs font-medium text-gray-800">{t("tagline")}</p>
          </motion.div>
        )}
      </motion.div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 left-4 z-40 w-[calc(100vw-2rem)] max-w-[400px] h-[min(500px,calc(100vh-8rem))] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-red-600 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
              <img
                src={BOT_AVATAR}
                alt="CunPollo Bot"
                className="w-10 h-10 object-contain"
              />
              <div className="flex-1">
                <p className="font-semibold text-sm">{t("title")}</p>
                <p className="text-xs text-red-100">{t("subtitle")}</p>
              </div>
              <button
                onClick={() => {
                  setMessages([]);
                  processedActions.current.clear();
                }}
                aria-label={t("newChat")}
                className="text-red-200 hover:text-white transition-colors"
                title={t("newChat")}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {messages.length === 0 && (
                <div className="flex justify-start mb-3">
                  <div className="max-w-[85%] bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md px-4 py-2">
                    <p className="text-sm leading-relaxed">{t("welcome")}</p>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onAddToCart={handleAddToCart}
                />
              ))}

              {isLoading && (
                <div className="flex justify-start mb-3">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {showSuggestions && (
              <div className="px-3 pb-2 flex flex-wrap gap-2">
                {[t("suggestMenu"), t("suggestPromos"), t("suggestHours")].map(
                  (text) => (
                    <button
                      key={text}
                      onClick={() => handleQuickReply(text)}
                      className="text-xs bg-red-50 text-red-700 border border-red-200 rounded-full px-3 py-1.5 hover:bg-red-100 transition-colors"
                    >
                      {text}
                    </button>
                  )
                )}
              </div>
            )}

            <ChatInput onSend={handleSend} disabled={isLoading} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
