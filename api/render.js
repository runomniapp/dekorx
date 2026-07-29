import { buildRenderPrompt } from './_scenePrompt.js';

// AI RENDER ENDPOINT
// Blockout 3D karesini + sahne verisini alıp fotogerçek bir görsele çevirir.
// İki sağlayıcı desteklenir; API key'leri YALNIZCA sunucu tarafında okunur ve
// istemciye asla gönderilmez.
//
//   openrouter : OpenRouter (görsel çıktı veren sohbet modelleri)
//   aistudio   : Google AI Studio (Gemini generateContent)
//
// Yerelde Vite dev middleware'i, üretimde Vercel serverless function olarak
// aynı handler çalışır.
//
// NOT: FLUX (Schnell dahil) OpenRouter kataloğunda bulunmuyor; ayrıca FLUX
// yalnızca metinden görsel üretir, girdi görselini yapısal referans olarak
// alamadığı için sahnenin yerleşimini koruyamaz. Bu yüzden görsel girdi kabul
// eden düzenleme modelleri kullanılıyor.

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Kalite sırası: ilk çalışan model kullanılır.
const OPENROUTER_MODELS = [
  'google/gemini-3-pro-image',      // en gerçekçi, ~$0.14/görsel
  'google/gemini-3.1-flash-image',
  'google/gemini-2.5-flash-image',  // en ucuz, ~$0.04/görsel
  'openai/gpt-5-image'
];

const AISTUDIO_MODELS = [
  'gemini-3-pro-image',
  'gemini-3.1-flash-image',
  'gemini-2.5-flash-image'
];

const env = (...names) => {
  for (const n of names) if (process.env[n]) return process.env[n];
  return '';
};

const getOpenRouterKey = () => env('OPENROUTER_API_KEY', 'open_router_api_key', 'OPEN_ROUTER_API_KEY');
const getAiStudioKey = () => env('AISTUDIO_API_KEY', 'aistudio_api_key', 'GOOGLE_AI_STUDIO_API_KEY');

const resolveProvider = () => {
  const forced = env('RENDER_PROVIDER').toLowerCase();
  if (forced === 'openrouter' || forced === 'aistudio') return forced;
  if (getOpenRouterKey()) return 'openrouter';
  if (getAiStudioKey()) return 'aistudio';
  return null;
};

// Vercel gövdeyi hazır verir; Vite middleware'inde ham akışı okumak gerekir.
const readJsonBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
};

const stripDataUrl = (dataUrl = '') => {
  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) return null;
  return { mimeType: match[1], data: match[2], url: dataUrl.trim() };
};

const sendJson = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

// ── Sağlayıcı hatalarını kullanıcıya gösterilebilir kodlara çevirir ─────────
const classifyError = (status, message = '') => {
  if (/prepayment credits are depleted|credits are depleted/i.test(message)) {
    return {
      code: 'CREDITS_DEPLETED',
      userMessage: 'Google AI Studio projesinin ön ödemeli bakiyesi tükenmiş. ai.studio/projects → Billing üzerinden kredi yükleyin.'
    };
  }
  if (status === 402 || /insufficient credits|more credits|negative balance/i.test(message)) {
    return {
      code: 'CREDITS_DEPLETED',
      userMessage: 'OpenRouter bakiyeniz bu render için yetersiz. openrouter.ai/credits üzerinden kredi yükleyin. Görsel başına yaklaşık 0,04–0,14 USD.'
    };
  }
  if (status === 401 || /no auth credentials|invalid api key|API key not valid/i.test(message)) {
    return {
      code: 'INVALID_KEY',
      userMessage: 'API key geçersiz. .env.local içindeki anahtarı kontrol edin.'
    };
  }
  if (status === 403) {
    return { code: 'FORBIDDEN', userMessage: 'API key bu modele erişemiyor (403).' };
  }
  if (status === 404) {
    return { code: 'MODEL_NOT_FOUND', userMessage: 'Model bu key için mevcut değil (404).' };
  }
  if (status === 429 && /limit:\s*0|free_tier/i.test(message)) {
    return {
      code: 'BILLING_REQUIRED',
      userMessage: 'Bu modeller ücretsiz katmanda kullanılamıyor (kota 0). Projede faturalandırmayı açın.'
    };
  }
  if (status === 429) {
    return { code: 'RATE_LIMITED', userMessage: 'İstek sınırı aşıldı. Bir dakika sonra tekrar deneyin.' };
  }
  return { code: 'PROVIDER_ERROR', userMessage: message || 'Görsel sağlayıcı beklenmeyen bir hata döndürdü.' };
};

// ── OpenRouter (sohbet biçimli, görsel çıktılı) ─────────────────────────────
const callOpenRouter = async ({ model, apiKey, prompt, image, referer }) => {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      // OpenRouter atıf başlıkları (zorunlu değil, panelde görünürlük sağlar)
      'HTTP-Referer': referer || 'http://localhost:5173',
      'X-Title': 'DekorX 3D Studio'
    },
    body: JSON.stringify({
      model,
      modalities: ['image', 'text'],
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: image.url } }
        ]
      }]
    })
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw = json?.error?.metadata?.raw;
    return { ok: false, status: res.status, message: json?.error?.message + (raw ? ` — ${String(raw).slice(0, 200)}` : '') };
  }

  const message = json.choices?.[0]?.message || {};
  const url = message.images?.[0]?.image_url?.url;

  if (!url) {
    return {
      ok: false,
      status: 502,
      message: `Model görsel döndürmedi (finish: ${json.choices?.[0]?.finish_reason || '?'}). ${String(message.content || '').slice(0, 160)}`.trim()
    };
  }

  return {
    ok: true,
    model,
    dataUrl: url,
    usage: json.usage ? { cost: json.usage.cost, totalTokens: json.usage.total_tokens } : null
  };
};

// ── Google AI Studio (yedek sağlayıcı) ─────────────────────────────────────
const callGemini = async ({ model, apiKey, prompt, image, aspectRatio, imageSize }) => {
  const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inline_data: { mime_type: image.mimeType, data: image.data } }
        ]
      }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio, imageSize }
      }
    })
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, status: res.status, message: json?.error?.message || '' };

  const parts = json.candidates?.[0]?.content?.parts || [];
  const inline = parts.map((p) => p.inlineData || p.inline_data).find((i) => i?.data);

  if (!inline?.data) {
    return {
      ok: false,
      status: 502,
      message: `Model görsel döndürmedi (finishReason: ${json.candidates?.[0]?.finishReason || '?'}).`
    };
  }

  return {
    ok: true,
    model,
    dataUrl: `data:${inline.mimeType || inline.mime_type || 'image/png'};base64,${inline.data}`,
    usage: json.usageMetadata ? { totalTokens: json.usageMetadata.totalTokenCount } : null
  };
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Yalnızca POST' });

  const provider = resolveProvider();
  if (!provider) {
    return sendJson(res, 500, {
      code: 'MISSING_KEY',
      error: 'Sağlayıcı anahtarı yok. .env.local (yerel) veya Vercel Environment Variables içine OPENROUTER_API_KEY ekleyin.'
    });
  }

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { code: 'BAD_JSON', error: 'Gövde JSON olarak ayrıştırılamadı.' });
  }

  const image = stripDataUrl(payload.image);
  if (!image) {
    return sendJson(res, 400, { code: 'NO_IMAGE', error: 'Geçerli bir base64 PNG data URL bekleniyordu (image).' });
  }
  if (!payload.scene?.room) {
    return sendJson(res, 400, { code: 'NO_SCENE', error: 'scene.room alanı zorunlu.' });
  }

  const aspectRatio = payload.aspectRatio || '16:9';
  const imageSize = payload.imageSize || '2K';
  const prompt = buildRenderPrompt({ ...payload.scene, aspectRatio });

  const isOpenRouter = provider === 'openrouter';
  const apiKey = isOpenRouter ? getOpenRouterKey() : getAiStudioKey();
  const configured = env(isOpenRouter ? 'OPENROUTER_MODEL' : 'AISTUDIO_MODEL');
  const models = configured
    ? [configured]
    : (isOpenRouter ? OPENROUTER_MODELS : AISTUDIO_MODELS);

  const referer = req.headers?.origin || req.headers?.referer;
  const attempts = [];
  let lastStatus = 502;
  let lastClassified = { code: 'PROVIDER_ERROR', userMessage: 'Denenen tüm görsel modelleri başarısız oldu.' };

  for (const model of models) {
    const result = isOpenRouter
      ? await callOpenRouter({ model, apiKey, prompt, image, referer })
      : await callGemini({ model, apiKey, prompt, image, aspectRatio, imageSize });

    if (result.ok) {
      return sendJson(res, 200, {
        image: result.dataUrl,
        model: result.model,
        provider,
        usage: result.usage,
        attempts,
        promptChars: prompt.length
      });
    }

    const classified = classifyError(result.status, result.message || '');
    lastStatus = result.status;
    lastClassified = classified;

    attempts.push({
      model,
      status: result.status,
      code: classified.code,
      // Teşhis için sağlayıcının ham mesajı da taşınır
      message: String(result.message || '').slice(0, 400)
    });

    // Anahtar / bakiye / izin sorunları modeli değiştirerek çözülmez
    if (['INVALID_KEY', 'FORBIDDEN', 'CREDITS_DEPLETED'].includes(classified.code)) break;
  }

  return sendJson(res, lastStatus, {
    code: lastClassified.code,
    error: lastClassified.userMessage,
    provider,
    attempts
  });
}
