#!/bin/zsh

# 07_TVBN_有人店 專屬 launcher：Finder 雙擊後自動啟動 SPX 本機 HTTP Server（port 4175），
# 並以 Google Chrome 開啟快速取件 Viewer（item=07）。
# 依 SPX 架構（啟動 SPX.command pattern），不依賴 FSS runtime。
# 與 01～06 launcher 共用 port 4175：既有正確 server（Viewer marker 命中）會被安全重用。

set -u

readonly SPX_LAUNCH_DIR="${0:A:h}"
readonly SPX_ROOT="${SPX_LAUNCH_DIR:h:h}"
readonly SPX_HOST="127.0.0.1"
readonly SPX_PORT="4175"
readonly SPX_BASE_URL="http://${SPX_HOST}:${SPX_PORT}"
readonly SPX_VIEWER_PATH="/%E5%BF%AB%E9%80%9F%E5%8F%96%E4%BB%B6/launch/viewer.html"
readonly SPX_VIEWER_URL="${SPX_BASE_URL}${SPX_VIEWER_PATH}"
readonly SPX_ITEM_URL="${SPX_VIEWER_URL}?item=07"
readonly SPX_VIEWER_MARKER='data-spx-quick-pickup-viewer="true"'
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

pause_before_exit() {
  echo
  read -r "?按 Enter 關閉視窗…"
}

viewer_is_ready() {
  "${SPX_CURL}" --silent --fail --max-time 1 "${SPX_VIEWER_URL}" 2>/dev/null |
    "${SPX_GREP}" --fixed-strings --quiet "${SPX_VIEWER_MARKER}"
}

open_item_viewer() {
  if ! "${SPX_OPEN}" -a "Google Chrome" "${SPX_ITEM_URL}"; then
    echo "Viewer 已就緒，但無法自動以 Google Chrome 開啟。"
    echo "請手動開啟：${SPX_ITEM_URL}"
    return 1
  fi
}

trap stop_spx_server EXIT INT TERM HUP

# 既有本工具 4175 server（可回應正確 Viewer marker）→ 安全重用，直接開啟。
if viewer_is_ready; then
  open_item_viewer || pause_before_exit
  exit
fi

# Port 4175 有人監聽但不是本工具的 Viewer → 明確報錯，不默默開到錯誤 server。
if "${SPX_LSOF}" -nP -iTCP:"${SPX_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port ${SPX_PORT} 已被其他程式占用，無法啟動 07_TVBN_有人店 Viewer。"
  pause_before_exit
  exit 1
fi

if [[ ! -x "${SPX_PYTHON}" ]]; then
  echo "找不到 macOS 的 Python 3，無法啟動本機 HTTP Server。"
  pause_before_exit
  exit 1
fi

if ! cd "${SPX_ROOT}"; then
  echo "無法切換到 SPX 根目錄。"
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
  echo "無法啟動 07_TVBN_有人店 本機 HTTP Server。請確認連接埠 ${SPX_PORT} 未被其他程式使用。"
  pause_before_exit
  exit 1
fi

if ! open_item_viewer; then
  pause_before_exit
  exit 1
fi

echo
echo "07_TVBN_有人店 Viewer 已啟動：${SPX_ITEM_URL}"
echo "關閉此視窗或按 Control-C 即可停止 Server。"
echo

wait "${spx_server_pid}"
