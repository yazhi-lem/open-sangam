from ..image_backend import get_image_backend
from ..schemas import ImageResult

def generate_image(prompt: str, aspect_ratio: str = "1:1") -> ImageResult:
    """Generates an image from a detailed descriptive prompt using the configured image backend.
    
    Args:
        prompt: A highly detailed description of the scene to generate. Include details on landscape, time of day, mood, flora, and fauna.
        aspect_ratio: The aspect ratio of the image. Must be one of "1:1", "3:4", "4:3", "9:16", or "16:9". Defaults to "1:1".
        
    Returns:
        An ImageResult object containing the 'prompt', 'aspect_ratio', and an 'image_data_uri'.
    """
    valid_aspect_ratios = {"1:1", "3:4", "4:3", "9:16", "16:9"}
    if aspect_ratio not in valid_aspect_ratios:
        raise ValueError(f"Invalid aspect_ratio '{aspect_ratio}'. Must be one of: {', '.join(valid_aspect_ratios)}")
        
    backend = get_image_backend()
    return backend.generate(prompt=prompt, aspect_ratio=aspect_ratio)
