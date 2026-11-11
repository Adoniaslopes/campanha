// Função "equipe": a inteligência da equipe fora do claude.ai, pela API da Anthropic.
// A chave fica no segredo ANTHROPIC_API_KEY do Supabase. Só membros do escritório usam.
// POST { system?, messages, tools?, max_tokens? } → resposta da API de mensagens (JSON).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// Confere se quem chama é membro do escritório (tabela escritorio_membros, protegida por RLS).
async function ehMembro(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/escritorio_membros?select=email`, {
    headers: { apikey: Deno.env.get("SUPABASE_ANON_KEY") || "", Authorization: auth },
  });
  if (!r.ok) return false;
  const linhas = await r.json();
  return Array.isArray(linhas) && linhas.length > 0;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (d: unknown, status = 200) => new Response(JSON.stringify(d), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const MODELO = Deno.env.get("MODELO_EQUIPE") || "claude-sonnet-5-5";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erro: "Método não aceito" }, 405);
  if (!(await ehMembro(req))) return json({ erro: "Acesso restrito ao escritório" }, 403);
  const chave = Deno.env.get("ANTHROPIC_API_KEY");
  if (!chave) return json({ erro: "A chave da Anthropic ainda não foi cadastrada no Supabase (segredo ANTHROPIC_API_KEY).", code: "sem_chave" }, 503);
  let c: { system?: string; messages?: unknown[]; tools?: unknown[]; max_tokens?: number };
  try { c = await req.json(); } catch { return json({ erro: "Corpo inválido" }, 400); }
  if (!Array.isArray(c.messages) || !c.messages.length) return json({ erro: "Sem mensagens" }, 400);
  const corpo: Record<string, unknown> = { model: MODELO, max_tokens: Math.min(c.max_tokens || 2500, 8000), messages: c.messages };
  if (c.system) corpo.system = c.system;
  if (Array.isArray(c.tools) && c.tools.length) corpo.tools = c.tools;
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": chave, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const texto = await r.text();
  return new Response(texto, { status: r.status, headers: { ...CORS, "Content-Type": "application/json" } });
});
