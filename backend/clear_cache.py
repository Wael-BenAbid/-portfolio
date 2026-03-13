#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio.settings.dev')
django.setup()

from django.core.cache import cache
cache.clear()
print('Cache cleared successfully')
