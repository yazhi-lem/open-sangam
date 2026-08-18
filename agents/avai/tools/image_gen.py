"""Image generation backend for Paranar.

Provides a pluggable image generation interface supporting:
- none: returns crafted prompt only (default, no API key needed)
- gemini: generates images via Google Gemini Imagen API

Configure via SANGAM_IMAGE_BACKEND env var.
"""

import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


class ImageBackend:
    """Base class for image generation backends."""

    def generate(self, prompt: str, aspect_ratio: str = "1:1") -> dict:
        raise NotImplementedError


class NoneBackend(ImageBackend):
    """Prompt-only backend — returns the crafted prompt without generating an image."""

    def generate(self, prompt: str, aspect_ratio: str = "1:1") -> dict:
        return {
            "status": "prompt_only",
            "prompt": prompt,
            "aspect_ratio": aspect_ratio,
            "image_url": None,
            "message": (
                "Image prompt crafted. Set SANGAM_IMAGE_BACKEND=gemini "
                "with a GEMINI_API_KEY to generate actual images."
            ),
        }


class GeminiBackend(ImageBackend):
    """Generate images via Google Gemini / Imagen API."""

    def generate(self, prompt: str, aspect_ratio: str = "1:1") -> dict:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {
                "status": "error",
                "prompt": prompt,
                "aspect_ratio": aspect_ratio,
                "image_url": None,
                "message": "GEMINI_API_KEY not set. Cannot generate image.",
            }

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)

            response = client.models.generate_images(
                model="imagen-3.0-generate-002",
                prompt=prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio=aspect_ratio,
                ),
            )

            if response.generated_images:
                image = response.generated_images[0]
                # Return base64-encoded image.
                import base64
                image_data = base64.b64encode(image.image.image_bytes).decode("utf-8")
                return {
                    "status": "success",
                    "prompt": prompt,
                    "aspect_ratio": aspect_ratio,
                    "image_url": f"data:image/png;base64,{image_data}",
                    "message": "Image generated successfully.",
                }
            else:
                return {
                    "status": "error",
                    "prompt": prompt,
                    "aspect_ratio": aspect_ratio,
                    "image_url": None,
                    "message": "No image returned from Gemini API.",
                }

        except Exception as e:
            return {
                "status": "error",
                "prompt": prompt,
                "aspect_ratio": aspect_ratio,
                "image_url": None,
                "message": f"Image generation failed: {str(e)}",
            }


def get_image_backend() -> ImageBackend:
    """Return the configured image generation backend."""
    backend = os.getenv("SANGAM_IMAGE_BACKEND", "none")
    if backend == "gemini":
        return GeminiBackend()
    return NoneBackend()
