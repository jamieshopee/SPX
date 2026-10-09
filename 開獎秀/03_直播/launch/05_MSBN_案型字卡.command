#!/bin/zsh

# SPX 開獎秀 — 直播 05 Viewer launcher
set -u

readonly LIVE_LAUNCH_DIR="${0:A:h}"
readonly SPX_ROOT="${LIVE_LAUNCH_DIR:h:h:h}"
readonly SPX_HOST="127.0.0.1"
readonly SPX_PORT="4178"
readonly SPX_BASE_URL="http://${SPX_HOST}:${SPX_PORT}"
readonly SPX_VIEWER_PATH="/%E9%96%8B%E7%8D%8E%E7%A7%80/03_%E7%9B%B4%E6%92%AD/viewer.html?layout=05&style=smart-locker"
readonly SPX_VIEWER_URL="${SPX_BASE_URL}${SPX_VIEWER_PATH}"
readonly SPX_VIEWER_MARKER='data-spx-lottery-show-live-01-viewer="true"'
readonly SPX_PYTHON="/usr/bin/python3"
readonly SPX_CURL="/usr/bin/curl"
readonly SPX_LSOF="/usr/sbin/lsof"
readonly SPX_GREP="/usr/bin/grep"
readonly SPX_OPEN="/usr/bin/open"

live_server_pid=""

stop_live_server() {
  if [[ -n "${live_server_pid}" ]] && kill -0 "${live_server_pid}" 2>/dev/null; then
    kill "${live_server_pid}" 2>/dev/null
    wait "${live_server_pid}" 2>/dev/null
  fi
}

pause_before_exit() { echo; read -r "?按 Enter 關閉視窗…"; }

viewer_is_ready() {
  "${SPX_CURL}" --silent --fail --max-time 1 "${SPX_VIEWER_URL}" 2>/dev/null |
    "${SPX_GREP}" --fixed-strings --quiet "${SPX_VIEWER_MARKER}"
}

open_viewer() {
  if ! "${SPX_OPEN}" -a "Google Chrome" "${SPX_VIEWER_URL}"; then
    echo "Viewer 已就緒，但無法自動以 Google Chrome 開啟。"
    echo "請手動開啟：${SPX_VIEWER_URL}"
    return 1
  fi
}

trap stop_live_server EXIT INT TERM HUP

if viewer_is_ready; then
  echo "重用既有直播 Viewer Server：http://${SPX_HOST}:${SPX_PORT}"
  open_viewer || pause_before_exit
  exit
fi

if "${SPX_LSOF}" -nP -iTCP:"${SPX_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port ${SPX_PORT} 已被其他程式占用，直播 05 Viewer fail-closed。"
  pause_before_exit
  exit 1
fi

if [[ ! -x "${SPX_PYTHON}" ]]; then
  echo "找不到 macOS Python 3，無法啟動直播 05 Viewer。"
  pause_before_exit
  exit 1
fi

if ! cd "${SPX_ROOT}"; then
  echo "無法切換到 SPX 根目錄：${SPX_ROOT}"
  pause_before_exit
  exit 1
fi

"${SPX_PYTHON}" - "${SPX_PORT}" "${SPX_HOST}" <<'PYTHON' &
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import sys

class NoCacheHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        request_path = self.path.split("?", 1)[0].lower()
        if request_path.endswith((".js", ".css", ".html")):
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

ThreadingHTTPServer((sys.argv[2], int(sys.argv[1])), NoCacheHTTPRequestHandler).serve_forever()
PYTHON
live_server_pid=$!

live_server_ready=false
for _ in {1..50}; do
  if ! kill -0 "${live_server_pid}" 2>/dev/null; then break; fi
  if viewer_is_ready; then live_server_ready=true; break; fi
  sleep 0.1
done

if [[ "${live_server_ready}" != true ]]; then
  echo "無法啟動直播 05 HTTP Server。"
  pause_before_exit
  exit 1
fi

if ! open_viewer; then pause_before_exit; exit 1; fi
echo "直播 05 Viewer 已啟動：${SPX_VIEWER_URL}"
echo "關閉此視窗或按 Control-C 即可停止 Server。"
wait "${live_server_pid}"
