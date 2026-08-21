import pytest
import os
from unittest.mock import patch, MagicMock
from agents.avai.image_backend import get_image_backend, NoneImageBackend, GeminiImageBackend
from agents.avai.tools.image import generate_image
from agents.avai.schemas import ImageResult

def test_get_image_backend_none():
    with patch.dict(os.environ, {"SANGAM_IMAGE_BACKEND": "none"}):
        backend = get_image_backend()
        assert isinstance(backend, NoneImageBackend)

def test_get_image_backend_invalid():
    with patch.dict(os.environ, {"SANGAM_IMAGE_BACKEND": "invalid"}):
        with pytest.raises(ValueError, match="Unknown SANGAM_IMAGE_BACKEND"):
            get_image_backend()

def test_none_backend_generate():
    backend = NoneImageBackend()
    result = backend.generate("A beautiful mountain")
    assert result.prompt == "A beautiful mountain"
    assert result.aspect_ratio == "1:1"
    assert result.image_data_uri is None

@patch("google.genai.Client")
def test_gemini_backend_generate(mock_client_cls):
    mock_client = MagicMock()
    mock_client_cls.return_value = mock_client
    
    # Mock the response from generate_images
    mock_result = MagicMock()
    mock_image = MagicMock()
    mock_image.image.image_bytes = b"fake_image_data"
    mock_result.generated_images = [mock_image]
    mock_client.models.generate_images.return_value = mock_result
    
    with patch.dict(os.environ, {"SANGAM_IMAGE_BACKEND": "gemini"}):
        backend = GeminiImageBackend()
        result = backend.generate("A beautiful forest", aspect_ratio="16:9")
        
        assert result.prompt == "A beautiful forest"
        assert result.aspect_ratio == "16:9"
        # base64.b64encode(b"fake_image_data") -> "ZmFrZV9pbWFnZV9kYXRh"
        assert result.image_data_uri == "data:image/jpeg;base64,ZmFrZV9pbWFnZV9kYXRh"
        
        mock_client.models.generate_images.assert_called_once()
        _, kwargs = mock_client.models.generate_images.call_args
        assert kwargs["model"] == "imagen-3.0-generate-002"
        assert kwargs["prompt"] == "A beautiful forest"
        assert kwargs["config"].aspect_ratio == "16:9"

import agents.avai.tools.image

@patch.object(agents.avai.tools.image, "get_image_backend")
def test_generate_image_tool(mock_get_backend):
    mock_backend = MagicMock()
    mock_backend.generate.return_value = ImageResult(prompt="Test", aspect_ratio="1:1", image_data_uri=None)
    mock_get_backend.return_value = mock_backend
    
    result = generate_image(prompt="Test")
    assert result.prompt == "Test"
    assert result.aspect_ratio == "1:1"
    assert result.image_data_uri is None
    mock_backend.generate.assert_called_once_with(prompt="Test", aspect_ratio="1:1")

def test_generate_image_tool_invalid_aspect_ratio():
    with pytest.raises(ValueError, match="Invalid aspect_ratio"):
        generate_image(prompt="Test", aspect_ratio="2:3")
