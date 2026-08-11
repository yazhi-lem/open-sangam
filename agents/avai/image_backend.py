"""Pluggable image backend for Paranar's imagery generation."""

import os
import base64
from typing import Protocol, Dict, Optional

from .schemas import ImageResult

class ImageBackend(Protocol):
    """Protocol for generating images from prompts."""
    def generate(self, prompt: str, aspect_ratio: str = "1:1") -> ImageResult:
        ...

class NoneImageBackend:
    """Scaffold default. Returns the crafted prompt only, no image generated."""
    def generate(self, prompt: str, aspect_ratio: str = "1:1") -> ImageResult:
        return ImageResult(
            prompt=prompt,
            aspect_ratio=aspect_ratio,
            image_data_uri=None
        )

class GeminiImageBackend:
    """Production target using google-genai SDK (Imagen)."""
    def __init__(self):
        # We import here so that google-genai is only strictly required if this backend is used,
        # or we assume it's already installed as part of vertexai or adk dependencies.
        try:
            from google import genai
            # Client picks up GEMINI_API_KEY from environment by default
            self.client = genai.Client()
        except ImportError:
            raise ImportError("The 'google-genai' package is required for the GeminiImageBackend.")

    def generate(self, prompt: str, aspect_ratio: str = "1:1") -> ImageResult:
        from google.genai import types

        result = self.client.models.generate_images(
            model='imagen-3.0-generate-002',
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/jpeg",
                aspect_ratio=aspect_ratio
            )
        )
        
        if not result.generated_images:
            raise RuntimeError("Gemini generate_images returned no images.")
            
        image_bytes = result.generated_images[0].image.image_bytes
        b64_data = base64.b64encode(image_bytes).decode('utf-8')
        data_uri = f"data:image/jpeg;base64,{b64_data}"
        
        return ImageResult(
            prompt=prompt,
            aspect_ratio=aspect_ratio,
            image_data_uri=data_uri
        )

def get_image_backend() -> ImageBackend:
    """Return the ImageBackend selected by SANGAM_IMAGE_BACKEND."""
    backend = os.getenv("SANGAM_IMAGE_BACKEND", "none")
    
    if backend == "none":
        return NoneImageBackend()
    if backend == "gemini":
        return GeminiImageBackend()
        
    raise ValueError(f"Unknown SANGAM_IMAGE_BACKEND={backend!r}; expected 'none' or 'gemini'")
