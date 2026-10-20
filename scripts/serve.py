"""Local preview without stale HTML or assets."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from pathlib import Path


class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()


if __name__ == "__main__":
    directory = Path(__file__).resolve().parents[1] / "dist"
    server = ThreadingHTTPServer(
        ("127.0.0.1", 8765), partial(PreviewHandler, directory=str(directory))
    )
    print("Preview: http://127.0.0.1:8765", flush=True)
    server.serve_forever()
