/**
 * avaiService.js — Client communication service for Sangam Avai Pulavar Multi-Agent Swarm.
 * Integrates with FastAPI /avai/ask endpoint with resilient offline fallback.
 */

const AVAI_API_BASE = import.meta.env.VITE_AVAI_API_URL || ''

const STORAGE_KEY_PREFIX = 'open_sangam_avai_chat_'

/**
 * Send a user query to a specific Pulavar agent or the Avai Swarm.
 *
 * @param {Object} params
 * @param {string} params.pulavar - 'nakkirar' | 'avvaiyar' | 'kapilar' | 'tholkappiyar' | 'paranar' | 'swarm'
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

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000)

    let res
    try {
      res = await fetch(`${AVAI_API_BASE}/avai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
    } catch {
      if (!AVAI_API_BASE) {
        res = await fetch('http://127.0.0.1:8080/avai/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })
      }
    }

    clearTimeout(timeoutId)

    if (res && res.ok) {
      const data = await res.json()
      return {
        ...data,
        isLive: true,
      }
    }
  } catch (err) {
    console.warn(`[AvaiService] Live backend unavailable (${err.message}). Returning offline notice.`)
  }

  // Fallback offline notice when backend is unreachable
  return generateClientFallbackResponse({ pulavar: targetPulavar || 'nakkirar', message, workflow: targetWorkflow || 'general', context, sessionId })
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
