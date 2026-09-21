/**
 * avaiService.js — Client communication service for Sangam Avai Pulavar Multi-Agent Swarm.
 * Integrates with FastAPI /avai/ask endpoint with resilient offline fallback.
 */

const AVAI_API_BASE = import.meta.env.VITE_AVAI_API_URL || ''

const STORAGE_KEY_PREFIX = 'open_sangam_avai_chat_'

async function executeFetch(url, payload, timeoutMs = 25000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    return { res, error: null }
  } catch (err) {
    return { res: null, error: err }
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Send a user query to a specific Pulavar agent or the Avai Swarm.
 *
 * @param {Object} params
 * @param {string} [params.pulavar] - 'nakkirar' | 'avvaiyar' | 'kapilar' | 'tholkappiyar' | 'paranar' | 'swarm'
 * @param {string} [params.poet] - Alias for pulavar
 * @param {string} params.message - User prompt text
 * @param {string} [params.workflow] - 'qa' | 'search' | 'scenario' | 'imagery' | 'general'
 * @param {string} [params.sessionId] - Session ID for multi-turn conversation
 * @param {Object} [params.context] - { tinai: string, poem: string, limit: number }
 * @returns {Promise<Object>} AskResponse object
 */
export async function askAvaiAgent({
  pulavar = null,
  poet = null,
  message,
  workflow = null,
  sessionId,
  context = {},
}) {
  const targetPulavar = pulavar || poet || null
  const targetWorkflow = workflow || (targetPulavar ? getWorkflowForPulavar(targetPulavar) : null)
  const payload = {
    message,
    workflow: targetWorkflow,
    pulavar: targetPulavar,
    poet: targetPulavar,
    session_id: sessionId || undefined,
    context: {
      tinai: context.tinai || null,
      poem: context.poem || null,
      limit: context.limit || 10,
    },
  }

  // Attempt 1: primary endpoint (${AVAI_API_BASE}/avai/ask)
  const primaryUrl = `${AVAI_API_BASE}/avai/ask`
  let { res, error } = await executeFetch(primaryUrl, payload)

  // Attempt 2: direct localhost fallback if primary failed on network error and was a relative proxy URL
  if (error && !AVAI_API_BASE) {
    const fallbackUrl = 'http://127.0.0.1:8080/avai/ask'
    const fallback = await executeFetch(fallbackUrl, payload)
    if (fallback.res) {
      res = fallback.res
      error = null
    } else {
      error = fallback.error
    }
  }

  if (res) {
    if (res.ok) {
      const data = await res.json()
      return {
        ...data,
        isLive: true,
      }
    }

    // Inspect non-OK HTTP responses: FastAPI JSON error vs gateway/proxy 502/empty
    const contentType = res.headers.get('content-type') || ''
    let isJson = contentType.includes('application/json')
    let errorDetail = ''

    if (isJson) {
      try {
        const errorJson = await res.json()
        errorDetail = errorJson.message || errorJson.detail || (typeof errorJson === 'string' ? errorJson : JSON.stringify(errorJson))
      } catch {
        isJson = false
      }
    }

    // FastAPI errors (structured JSON with error message/detail)
    if (isJson && errorDetail) {
      console.warn(`[AvaiService] Backend error HTTP ${res.status}: ${errorDetail}`)
      return generateBackendErrorResponse({
        pulavar: targetPulavar || 'nakkirar',
        sessionId,
        status: res.status,
        errorDetail,
      })
    }

    // Proxy-generated failures (empty body or non-JSON, like Vite 502 Bad Gateway)
    console.warn(`[AvaiService] Proxy gateway failure (HTTP ${res.status}). Returning offline notice.`)
    return generateClientFallbackResponse({ pulavar: targetPulavar || 'nakkirar', sessionId })
  }

  // Network down, timeout, or DNS resolution failure
  console.warn(`[AvaiService] Live backend unreachable (${error?.message || 'network error'}). Returning offline notice.`)
  return generateClientFallbackResponse({ pulavar: targetPulavar || 'nakkirar', sessionId })
}

/**
 * Maps pulavar ID to default ADK workflow ID
 */
export function getWorkflowForPulavar(pulavarId) {
  switch (pulavarId) {
    case 'kapilar':
      return 'search'
    case 'tholkappiyar':
      return 'scenario'
    case 'paranar':
      return 'imagery'
    case 'nakkirar':
      return 'general'
    case 'swarm':
      return 'qa'
    case 'avvaiyar':
    default:
      return 'qa'
  }
}

/**
 * Clearly labeled backend error message returned when backend responds with a FastAPI error (4xx/5xx JSON).
 */
function generateBackendErrorResponse({ pulavar, sessionId, status, errorDetail }) {
  const currentSessionId = sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const detailText = errorDetail ? `\n\n**பிழை விவரம் / Error Details:** \`${errorDetail}\`` : ''

  const responseText = `⚠️ **சேவையகப் பிழை • Backend Error (HTTP ${status})**

மன்னிக்கவும், சங்க அவை சேவையகம் கோரிக்கையைச் செயலாக்கும் போது பிழையைத் தந்துள்ளது (HTTP ${status}).${detailText}

The Sangam Avai backend responded with an HTTP ${status} error. Please check your query or verify backend service logs.`

  return {
    session_id: currentSessionId,
    workflow: getWorkflowForPulavar(pulavar || 'nakkirar'),
    pulavar: pulavar || 'nakkirar',
    poet: pulavar || 'nakkirar',
    response_text: responseText,
    citations: [],
    scenario: null,
    imageUrl: null,
    metadata: {
      model: 'error',
      elapsed_ms: 0,
      timestamp: new Date().toISOString(),
      error: true,
      status,
    },
    isFallback: true,
    isLive: false,
  }
}

/**
 * Clearly labeled offline fallback message returned when live backend is unreachable.
 */
function generateClientFallbackResponse({ pulavar, sessionId }) {
  const currentSessionId = sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

  const responseText = `⚠️ **அவை சேவையகம் இணைப்பிலில்லை • Avai Backend Unreachable**

மன்னிக்கவும், சங்க அவை முகவர் சேவையகத்துடன் (Avai Multi-Agent Backend on port 8080) தொடர்புகொள்ள முடியவில்லை. நேரலை புலவர் உரையாடலைப் பெற சேவையகம் இயங்குவதை உறுதிசெய்யவும்.

The Sangam Avai agent backend is currently unreachable. Live poet inference and multi-agent debate require the backend service to be running.

**சேவையகத்தை இயக்கும் முறை / How to start the backend:**
1. \`agents/\` அடைவிலிருந்து சேவையகத்தை இயக்கவும்:
   \`python -m uvicorn avai.api.app:app --host 127.0.0.1 --port 8080\`
   (அல்லது \`./start_open_sangam.sh\` ஸ்கிரிப்டைப் பயன்படுத்தவும்)
2. சேவையகம் இயங்கிய பின்னர், உங்கள் வினாவை **மீண்டும் வினவவும் (Retry / Send again)**.`

  return {
    session_id: currentSessionId,
    workflow: getWorkflowForPulavar(pulavar || 'nakkirar'),
    pulavar: pulavar || 'nakkirar',
    poet: pulavar || 'nakkirar',
    response_text: responseText,
    citations: [],
    scenario: null,
    imageUrl: null,
    metadata: {
      model: 'offline',
      elapsed_ms: 0,
      timestamp: new Date().toISOString(),
      offline: true,
    },
    isFallback: true,
    isLive: false,
  }
}

/**
 * Storage helpers for chat history
 */
export function getSavedChat(pulavarId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${pulavarId}`)
    if (!raw) return { messages: [], title: '' }

    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return { messages: parsed, title: '' }
    } else if (typeof parsed === 'object' && parsed !== null) {
      return { messages: parsed.messages || [], title: parsed.title || '' }
    }
    return { messages: [], title: '' }
  } catch {
    return { messages: [], title: '' }
  }
}

export function saveChat(pulavarId, messages, title = '') {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${pulavarId}`, JSON.stringify({ messages, title }))
  } catch (err) {
    console.error('[AvaiService] Failed to persist chat history:', err)
  }
}

export function clearSavedChat(pulavarId) {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${pulavarId}`)
  } catch (err) {
    console.error('[AvaiService] Failed to clear chat history:', err)
  }
}
