# Sustituto simple del módulo imghdr eliminado en Python 3.13
def what(file, h=None):
    if h is None:
        if hasattr(file, 'read'):
            pos = file.tell()
            h = file.read(32)
            file.seek(pos)
        else:
            with open(file, 'rb') as f:
                h = f.read(32)
    if h.startswith(b'\xff\xd8'):
        return 'jpeg'
    if h.startswith(b'\x89PNG\r\n\x1a\n'):
        return 'png'
    if h[:6] in (b'GIF87a', b'GIF89a'):
        return 'gif'
    if h.startswith(b'BM'):
        return 'bmp'
    if h[0:4] == b'RIFF' and h[8:12] == b'WEBP':
        return 'webp'
    return None
