"""Portfolio serveri (faqat standart kutubxona, o'rnatish shart emas).
Ishga tushirish:  python server.py   →   http://localhost:8000
"""
import json, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).parent
MESSAGES = ROOT / "messages.json"
PROFILE = {
    "name": "Abdulaziz Abdullayev",
    "birth": "2008-10-19",
    "role": "Frontend dasturchi",
    "education": ["PDP Academy (Foundation)", "PDP Junior Frontend (sertifikat)", "PDP University (talaba)"],
    "contact": {"phone": "+998779661848", "telegram": "@oo7_AAB", "instagram": "_abdulaziz232_"},
}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def _json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/api/profile":
            return self._json(200, PROFILE)
        if self.path in ("/messages.json", "/server.py"):  # shaxsiy fayllar yopiq
            return self._json(404, {"error": "topilmadi"})
        super().do_GET()

    def do_POST(self):
        if self.path != "/api/contact":
            return self._json(404, {"error": "topilmadi"})
        try:
            n = int(self.headers.get("Content-Length", 0))
            if n > 4000:
                raise ValueError
            d = json.loads(self.rfile.read(n))
            name, text = str(d["name"]).strip()[:60], str(d["message"]).strip()[:800]
            if not name or not text:
                raise ValueError
        except (ValueError, KeyError, json.JSONDecodeError):
            return self._json(400, {"error": "noto'g'ri ma'lumot"})
        items = json.loads(MESSAGES.read_text("utf-8")) if MESSAGES.exists() else []
        items.append({"name": name, "message": text, "time": time.strftime("%Y-%m-%d %H:%M:%S")})
        MESSAGES.write_text(json.dumps(items, ensure_ascii=False, indent=2), "utf-8")
        self._json(200, {"ok": True})

if __name__ == "__main__":
    print("Server: http://localhost:8000  (to'xtatish: Ctrl+C)")
    ThreadingHTTPServer(("0.0.0.0", 8000), Handler).serve_forever()
