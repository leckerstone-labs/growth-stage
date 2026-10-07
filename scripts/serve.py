"""Local dev server with caching disabled, so edits always show on reload.
Run from the project root: python3 scripts/serve.py  (http://localhost:8642)"""
import http.server, functools, mimetypes, os

mimetypes.add_type('application/manifest+json', '.webmanifest')

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
http.server.ThreadingHTTPServer(('', 8642), functools.partial(NoCache, directory=root)).serve_forever()
