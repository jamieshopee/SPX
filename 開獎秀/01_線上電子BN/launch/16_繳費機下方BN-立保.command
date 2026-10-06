#!/bin/zsh
set -u

readonly SPX_LAUNCH_DIR="${0:A:h}"
readonly SPX_ROOT="${SPX_LAUNCH_DIR:h:h:h}"
readonly SPX_HOST="127.0.0.1"
readonly SPX_PORT="4176"
readonly SPX_BASE_URL="http://${SPX_HOST}:${SPX_PORT}"
readonly SPX_VIEWER_PATH="/%E9%96%8B%E7%8D%8E%E7%A7%80/01_%E7%B7%9A%E4%B8%8A%E9%9B%BB%E5%AD%90BN/launch/viewer.html?layout=16-payment-bottom"
readonly SPX_VIEWER_URL="${SPX_BASE_URL}${SPX_VIEWER_PATH}"
readonly SPX_VIEWER_MARKER='data-spx-lottery-show-online-bn-viewer="true"'
readonly SPX_PYTHON="/usr/bin/python3"
readonly SPX_CURL="/usr/bin/curl"
readonly SPX_LSOF="/usr/sbin/lsof"
readonly SPX_GREP="/usr/bin/grep"
readonly SPX_OPEN="/usr/bin/open"
spx_server_pid=""

stop_spx_server() {
  if [[ -n "${spx_server_pid}" ]] && kill -0 "${spx_server_pid}" 2>/dev/null; then
    kill "${spx_server_pid}" 2>/dev/null
    wait "${spx_server_pid}" 2>/dev/null
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

trap stop_spx_server EXIT INT TERM HUP

if viewer_is_ready; then
  echo "重用既有開獎秀 Server：${SPX_BASE_URL}"
  open_viewer || pause_before_exit
  exit
fi

if "${SPX_LSOF}" -nP -iTCP:"${SPX_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port ${SPX_PORT} 已被其他程式占用，無法啟動 16_繳費機下方BN-立保 Viewer。"
  echo "請先關閉占用 ${SPX_PORT} 的程式後再試。"
  pause_before_exit
  exit 1
fi

if [[ ! -x "${SPX_PYTHON}" ]]; then
  echo "找不到 macOS 的 Python 3，無法啟動本機 HTTP Server。"
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
        if request_path.endswith((".js", ".css")):
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

ThreadingHTTPServer((sys.argv[2], int(sys.argv[1])), NoCacheHTTPRequestHandler).serve_forever()
PYTHON
spx_server_pid=$!

spx_server_ready=false
for _ in {1..50}; do
  if ! kill -0 "${spx_server_pid}" 2>/dev/null; then
    break
  fi
  if viewer_is_ready; then
    spx_server_ready=true
    break
  fi
  sleep 0.1
done

if [[ "${spx_server_ready}" != true ]]; then
  echo
  echo "無法啟動 16_繳費機下方BN-立保 本機 HTTP Server。請確認連接埠 ${SPX_PORT} 未被其他程式使用。"
  pause_before_exit
  exit 1
fi

if ! open_viewer; then
  pause_before_exit
  exit 1
fi

echo
echo "16_繳費機下方BN-立保 Viewer 已啟動：${SPX_VIEWER_URL}"
echo "關閉此視窗或按 Control-C 即可停止 Server。"
echo
wait "${spx_server_pid}"
