"""Tests for the image generation backend."""

from ..tools.image_gen import NoneBackend, get_image_backend


def test_none_backend_returns_prompt_only():
    backend = NoneBackend()
    result = backend.generate("A mountain landscape in Sangam style")
    assert result["status"] == "prompt_only"
    assert result["prompt"] == "A mountain landscape in Sangam style"
    assert result["image_url"] is None
    assert "prompt" in result["message"].lower()


def test_get_image_backend_default_is_none():
    # Default should be NoneBackend when SANGAM_IMAGE_BACKEND is not set.
    import os
    os.environ.pop("SANGAM_IMAGE_BACKEND", None)
    backend = get_image_backend()
    assert isinstance(backend, NoneBackend)


def test_none_backend_preserves_aspect_ratio():
    backend = NoneBackend()
    result = backend.generate("test", aspect_ratio="16:9")
    assert result["aspect_ratio"] == "16:9"
