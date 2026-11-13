// Função "ouvir": recebe o áudio gravado no celular e devolve o texto, pelo Speech-to-Text do ElevenLabs.
// A chave fica no segredo ELEVENLABS_API_KEY do Supabase. Só membros do escritório usam.
// POST (corpo = áudio, Content-Type do áudio) → { texto }
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erro: "Método não aceito" }, 405);
  if (!(await ehMembro(req))) return json({ erro: "Acesso restrito ao escritório" }, 403);
  const chave = Deno.env.get("ELEVENLABS_API_KEY");
  if (!chave) return json({ erro: "A chave do ElevenLabs ainda não foi cadastrada no servidor.", code: "sem_chave" }, 503);
  const tipo = req.headers.get("Content-Type") || "audio/webm";
  const audio = await req.arrayBuffer();
  if (!audio.byteLength) return json({ erro: "Áudio vazio" }, 400);
  if (audio.byteLength > 20_000_000) return json({ erro: "Áudio longo demais" }, 400);
  const ext = tipo.includes("mp4") || tipo.includes("aac") ? "m4a" : tipo.includes("ogg") ? "ogg" : tipo.includes("wav") ? "wav" : "webm";
  const form = new FormData();
  form.append("model_id", "scribe_v1");
  form.append("language_code", "por");
  form.append("file", new Blob([audio], { type: tipo }), `fala.${ext}`);
  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": chave }, body: form });
  if (!r.ok) return json({ erro: `ElevenLabs respondeu ${r.status}`, detalhe: (await r.text()).slice(0, 500) }, 502);
  const d = await r.json();
  return json({ texto: String(d.text || "").trim() });
});
