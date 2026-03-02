import requests
from io import BytesIO

# Create a minimal valid MP4 file
mp4_data = b'\x00\x00\x00\x18ftypisom\x00\x00\x02\x00isomiso2avc1mp41\x00\x00\x00\x08free\x00\x00\x00\x08mdat'

# Prepare the request
url = 'http://localhost:8000/api/projects/media/create/'
files = {'file': ('test_video.mp4', BytesIO(mp4_data), 'video/mp4')}
data = {'project': 'bb', 'media_type': 'video', 'order': 0}
cookies = {'sessionid': 'your_session_id'}

try:
    response = requests.post(url, files=files, data=data, cookies=cookies)
    print(f'Status Code: {response.status_code}')
    print(f'Response Headers: {dict(response.headers)}')
    print(f'Response Body: {response.text}')
except Exception as e:
    print(f'Error: {e}')
