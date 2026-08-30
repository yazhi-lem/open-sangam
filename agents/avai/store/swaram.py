"""Swaram akshara segmentation — lightweight mirror of Layer A from
repos/adhan/src/adhan_slm/tokenizer/swaram_tokenizer.py (the Adhan Tamil SLM's
tokenizer). Vendored rather than imported: Adhan's package pulls in its own
core/config/JAX training stack, which open-sangam's agents venv has no reason
to depend on, and Layer A (lossless akshara grapheme-cluster segmentation) is
pure-stdlib and self-contained.

This module intentionally stops at Layer A. Layer B (the learned BPE
morpheme-merge layer) needs Adhan's trained merges.txt/vocab.json and belongs
to Adhan's own pipeline — open-sangam only pre-segments so Avai's response
artifacts arrive at Adhan already akshara-tokenized, not fully SLM-tokenized.

Keep in sync by hand if adhan/.../swaram_tokenizer.py's segment_aksharas
changes — there is no runtime dependency between the two repos.
"""

import unicodedata

_TAMIL_MATRAS = set(range(0x0BBE, 0x0BCD))
_TAMIL_PULLI = 0x0BCD
_COMBINING = _TAMIL_MATRAS | {_TAMIL_PULLI}


def segment_aksharas(text: str) -> list[str]:
    """Lossless akshara (grapheme-cluster) segmentation: ''.join(out) == text
    after NFC normalization. Each Tamil consonant absorbs any following
    vowel-sign (matra) or virama (pulli); everything else is one code point
    per token."""
    text = unicodedata.normalize("NFC", text)
    out: list[str] = []
    for ch in text:
        if out and ord(ch) in _COMBINING:
            out[-1] += ch
        else:
            out.append(ch)
    return out
