"""
Custom Cloudinary storage backends.
"""
from cloudinary_storage.storage import MediaCloudinaryStorage


class AutoCloudinaryStorage(MediaCloudinaryStorage):
    """
    Cloudinary storage that sets resource_type='auto' so Cloudinary
    auto-detects whether the uploaded file is an image, video, or raw.

    This allows the same storage backend to handle both image and video
    uploads without Cloudinary rejecting video files with "Invalid image
    file".
    """
    RESOURCE_TYPE = 'auto'
