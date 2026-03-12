"""
Custom Cloudinary storage backends.
"""
import os

import cloudinary
import cloudinary.uploader
from cloudinary_storage.storage import MediaCloudinaryStorage
from django.core.files.uploadedfile import UploadedFile

# Separator that is never valid inside a Cloudinary public_id.
_RT_SEP = '~'


class AutoCloudinaryStorage(MediaCloudinaryStorage):
    """
    Cloudinary storage that uploads with resource_type='auto' so Cloudinary
    accepts both image and video files.

    After upload, Cloudinary tells us the actual resource_type it used
    ('image', 'video', or 'raw').  We encode that into the stored field name
    as  '{resource_type}~{public_id}'  (e.g. 'video~media/uploads/2026/…').
    At URL-generation time we decode it so the delivery URL uses the correct
    path  (/image/upload/…  or  /video/upload/…)  instead of the unsupported
    /auto/upload/… path (which Cloudinary returns HTTP 400 for).

    Backward-compatible: names stored without the separator (pre-existing
    image-only records) default to resource_type='image'.
    """

    # ── helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _encode(resource_type: str, public_id: str) -> str:
        return f"{resource_type}{_RT_SEP}{public_id}"

    @staticmethod
    def _decode(name: str):
        """Return (resource_type, public_id).

        Falls back to ('image', name) for pre-existing records without prefix.
        """
        if _RT_SEP in name:
            rt, pid = name.split(_RT_SEP, 1)
            if rt in ('image', 'video', 'raw'):
                return rt, pid
        return 'image', name  # backward compat

    # ── override storage API ─────────────────────────────────────────

    def _upload(self, name, content):
        """Always upload with resource_type='auto'."""
        options = {
            'use_filename': True,
            'resource_type': 'auto',
            'tags': self.TAG,
        }
        folder = os.path.dirname(name)
        if folder:
            options['folder'] = folder
        return cloudinary.uploader.upload(content, **options)

    def _save(self, name, content):
        name = self._normalise_name(name)
        name = self._prepend_prefix(name)
        content = UploadedFile(content, name)
        response = self._upload(name, content)
        actual_type = response.get('resource_type', 'image')
        return self._encode(actual_type, response['public_id'])

    def _get_resource_type(self, name: str) -> str:
        return self._decode(name)[0]

    def _get_url(self, name: str) -> str:
        resource_type, public_id = self._decode(name)
        public_id = self._prepend_prefix(public_id)
        return cloudinary.CloudinaryResource(
            public_id, default_resource_type=resource_type
        ).url

    def delete(self, name: str) -> bool:
        resource_type, public_id = self._decode(name)
        response = cloudinary.uploader.destroy(
            public_id, invalidate=True, resource_type=resource_type,
        )
        return response['result'] == 'ok'
