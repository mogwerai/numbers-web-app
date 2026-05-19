from pathlib import Path
import random

from flask import Flask, jsonify, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

app = Flask(__name__, static_folder=str(FRONTEND_DIST), static_url_path="")


@app.get("/api/new-game")
def new_game():
    return jsonify({"numbers": random.sample(range(1, 10), 9)})


@app.get("/")
def index():
    if (FRONTEND_DIST / "index.html").exists():
        return send_from_directory(FRONTEND_DIST, "index.html")
    return (
        "Frontend build not found. Run `npm run build` in /frontend first.",
        503,
    )


@app.get("/<path:path>")
def static_proxy(path: str):
    file_path = FRONTEND_DIST / path
    if file_path.exists():
        return send_from_directory(FRONTEND_DIST, path)
    return send_from_directory(FRONTEND_DIST, "index.html")


if __name__ == "__main__":
    app.run(debug=True)
