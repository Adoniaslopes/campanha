// Função "voz": transforma o texto de cada membro da equipe em áudio pelo ElevenLabs.
// A chave fica no segredo ELEVENLABS_API_KEY do Supabase (nunca na página).
// Só atende quem está logado (o Supabase confere o token antes de chamar a função).
//   GET  /voz            → lista as vozes da conta ElevenLabs (id, nome, idioma)
//   POST /voz {texto, voz} → áudio MP3
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
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (!(await ehMembro(req))) return json({ erro: "Acesso restrito ao escritório" }, 403);
  const chave = Deno.env.get("ELEVENLABS_API_KEY");
  if (!chave) return json({ erro: "A chave do ElevenLabs ainda não foi cadastrada no Supabase (segredo ELEVENLABS_API_KEY)." }, 503);

  if (req.method === "GET") {
    const r = await fetch("https://api.elevenlabs.io/v2/voices?page_size=100", { headers: { "xi-api-key": chave } });
    if (!r.ok) return json({ erro: `ElevenLabs respondeu ${r.status}`, detalhe: await r.text() }, 502);
    const d = await r.json();
    return json((d.voices || []).map((v: any) => ({ id: v.voice_id, nome: v.name, categoria: v.category, rotulos: v.labels || {} })));
  }

  if (req.method !== "POST") return json({ erro: "Método não aceito" }, 405);
  let corpo: { texto?: string; voz?: string; modelo?: string };
  try { corpo = await req.json(); } catch { return json({ erro: "Corpo inválido" }, 400); }
  const texto = (corpo.texto || "").trim();
  if (!texto || !corpo.voz) return json({ erro: "Informe texto e voz" }, 400);
  if (texto.length > 2500) return json({ erro: "Texto longo demais para uma fala" }, 400);
  if (!/^[A-Za-z0-9]{10,40}$/.test(corpo.voz)) return json({ erro: "Identificador de voz inválido" }, 400);

  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${corpo.voz}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": chave, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text: texto,
      model_id: corpo.modelo || "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!r.ok) return json({ erro: `ElevenLabs respondeu ${r.status}`, detalhe: await r.text() }, 502);
  return new Response(r.body, { headers: { ...CORS, "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
});
