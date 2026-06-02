import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ChatMessageRow = {
  id: string;
  sender_email: string;
  sender_role: "admin" | "trainer" | "student" | null;
  recipient_email: string;
  body: string;
  created_at: string;
};

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function mapRoleForDatabase(role?: string) {
  if (role === "admin") return "admin";
  if (role === "personal" || role === "trainer") return "trainer";
  return "student";
}

async function getCurrentChatUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user?.email) {
    return {
      userId: data.user.id,
      email: normalizeEmail(data.user.email),
      role: mapRoleForDatabase(data.user.app_metadata?.role ?? data.user.user_metadata?.role),
    };
  }

  const store = await cookies();
  const appRole = store.get("app-role")?.value ?? store.get("demo-role")?.value;
  const appEmail = store.get("app-user-email")?.value ?? store.get("demo-user-email")?.value;

  return {
    userId: null,
    email: normalizeEmail(appEmail),
    role: mapRoleForDatabase(appRole),
  };
}

export async function GET(request: Request) {
  const currentUser = await getCurrentChatUser();
  const peerEmail = normalizeEmail(new URL(request.url).searchParams.get("peer_email"));

  if (!currentUser.email) {
    return NextResponse.json({ ok: false, error: "Sessao nao encontrada." }, { status: 401 });
  }

  if (!peerEmail) {
    return NextResponse.json({ ok: false, error: "peer_email obrigatorio." }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase admin nao configurado." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, sender_email, sender_role, recipient_email, body, created_at")
    .or(`sender_email.eq.${currentUser.email},recipient_email.eq.${currentUser.email}`)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const messages = ((data ?? []) as ChatMessageRow[]).filter((message) => (
    (message.sender_email === currentUser.email && message.recipient_email === peerEmail)
    || (message.sender_email === peerEmail && message.recipient_email === currentUser.email)
  ));

  return NextResponse.json({ ok: true, current_email: currentUser.email, messages });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentChatUser();
  const body = await request.json();
  const recipientEmail = normalizeEmail(body.recipient_email);
  const messageBody = String(body.body ?? "").trim();

  if (!currentUser.email) {
    return NextResponse.json({ ok: false, error: "Sessao nao encontrada." }, { status: 401 });
  }

  if (!recipientEmail || !messageBody) {
    return NextResponse.json({ ok: false, error: "Destinatario e mensagem sao obrigatorios." }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase admin nao configurado." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      sender_user_id: currentUser.userId,
      sender_email: currentUser.email,
      sender_role: currentUser.role,
      recipient_email: recipientEmail,
      body: messageBody,
      metadata: {
        source: "app-chat",
      },
    })
    .select("id, sender_email, sender_role, recipient_email, body, created_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, current_email: currentUser.email, message: data });
}
