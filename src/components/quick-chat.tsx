"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";
import { Avatar, Badge, Card } from "@/components/ui";

type ChatMessage = {
  id: string;
  from: "student" | "trainer";
  text: string;
  time: string;
};

type ApiChatMessage = {
  id: string;
  sender_email: string;
  recipient_email: string;
  body: string;
  created_at: string;
};

export function QuickChat({ currentEmail, mode, peerEmail, peerName }: { currentEmail: string; mode: "student" | "trainer"; peerEmail: string; peerName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "error">("idle");
  const endpoint = useMemo(() => `/api/chat/messages?peer_email=${encodeURIComponent(peerEmail)}`, [peerEmail]);

  function formatMessageTime(value: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  const mapApiMessage = useCallback((message: ApiChatMessage, loggedEmail: string): ChatMessage => {
    const sentByMe = message.sender_email === loggedEmail;
    return {
      id: message.id,
      from: sentByMe ? mode : mode === "trainer" ? "student" : "trainer",
      text: message.body,
      time: formatMessageTime(message.created_at),
    };
  }, [mode]);

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      const response = await fetch(endpoint);
      const result = await response.json();

      if (!active || !response.ok || !result.ok || !result.messages?.length) return;

      const loggedEmail = result.current_email ?? currentEmail;
      setMessages(result.messages.map((message: ApiChatMessage) => mapApiMessage(message, loggedEmail)));
    }

    loadMessages().catch(() => {
      if (active) setSyncStatus("error");
    });

    return () => {
      active = false;
    };
  }, [currentEmail, endpoint, mapApiMessage]);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed) return;

    const optimisticMessage: ChatMessage = {
      id: crypto.randomUUID(),
      from: mode,
      text: trimmed,
      time: "agora",
    };

    setMessages((items) => [
      ...items,
      optimisticMessage,
    ]);
    setText("");
    setSyncStatus("saving");

    const response = await fetch("/api/chat/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient_email: peerEmail,
        body: trimmed,
      }),
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      setSyncStatus("error");
      return;
    }

    setSyncStatus("idle");
    setMessages((items) => items.map((item) => (
      item.id === optimisticMessage.id
        ? mapApiMessage(result.message, result.current_email ?? currentEmail)
        : item
    )));
  }

  return (
    <section className="px-5">
      <Card className="mb-4">
        <div className="flex items-center gap-3">
          <Avatar name={peerName} size={46} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-bold">{peerName}</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {mode === "trainer" ? "Aluno · duvidas de treino" : "Personal · resposta rapida"} · {peerEmail}
            </p>
          </div>
          <Badge tone="success" dot>ONLINE</Badge>
        </div>
      </Card>

      <div className="space-y-3">
        {messages.map((message) => {
          const mine = message.from === mode;
          return (
            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] rounded-[18px] px-4 py-3 text-sm leading-6 shadow-sm ${mine ? "bg-[var(--blue)] text-white" : "border border-[var(--hair)] bg-white text-[var(--ink)]"}`}>
                <p>{message.text}</p>
                <p className={`mono mt-1 text-[10px] font-bold ${mine ? "text-white/60" : "text-[var(--ink-4)]"}`}>{message.time}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-24 mt-5 flex items-center gap-2 rounded-[18px] border border-[var(--hair)] bg-white p-2 shadow-[0_12px_32px_rgba(16,18,24,.12)]">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") send();
          }}
          className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm font-medium outline-none"
          placeholder={mode === "trainer" ? "Responder aluno..." : "Falar com personal..."}
        />
        <button onClick={send} className="pressable grid size-11 place-items-center rounded-[14px] bg-[var(--blue)] text-white" type="button">
          <Send className="size-4" />
        </button>
      </div>
      {syncStatus === "error" ? <p className="mt-2 px-2 text-xs font-semibold text-amber-700">Nao foi possivel salvar no Supabase.</p> : null}
      {syncStatus === "saving" ? <p className="mt-2 px-2 text-xs font-semibold text-neutral-400">Salvando no Supabase...</p> : null}
    </section>
  );
}
