#!/bin/zsh

# SPX 開獎秀 — 線上／電子BN 08_SKBN_APP左右 Manual Verification launcher
# ---------------------------------------------------------------------------
# Finder 雙擊後：啟動（或安全重用）開獎秀本機 HTTP Server（port 4176），
# 並以 Google Chrome 開啟 08_SKBN_APP左右 Manual Verification Viewer。
#
# document root 為 SPX Repository root：Viewer 需要讀取根層 fonts/ 與
# 開獎秀 JS／CSS／assets，因此不可只開到 開獎秀/ 或 01_線上電子BN/。
#
# Port 原則（Jamie 裁決）：
#   4174 = SPX root 平台 server、4175 = 快速取件 launcher，
#   online-bn 全版位共用 4176，不為每個版位新增 port。
#   01～08 指向同一份 viewer.html 與同一個 marker，可安全重用同一個 server。
#
# Viewer 為 online-bn 全版位共用，版位以 ?layout= 指定；本 launcher 固定帶
# layout=08-skbn-app-lr。
#
# 不依賴 file://：ES module、FontFace 與 canvas 在 file:// 下都會失敗。

set -u

readonly SPX_LAUNCH_DIR="${0:A:h}"
readonly SPX_ROOT="${SPX_LAUNCH_DIR:h:h:h}"
readonly SPX_HOST="127.0.0.1"
readonly SPX_PORT="4176"
readonly SPX_BASE_URL="http://${SPX_HOST}:${SPX_PORT}"
readonly SPX_VIEWER_PATH="/%E9%96%8B%E7%8D%8E%E7%A7%80/01_%E7%B7%9A%E4%B8%8A%E9%9B%BB%E5%AD%90BN/launch/viewer.html?layout=08-skbn-app-lr"
readonly SPX_VIEWER_URL="${SPX_BASE_URL}${SPX_VIEWER_PATH}"
readonly SPX_VIEWER_MARKER='data-spx-lottery-show-online-bn-viewer="true"'
readonly SPX_PYTHON="/usr/bin/python3"
readonly SPX_CURL="/usr/bin/curl"
readonly SPX_LSOF="/usr/sbin/lsof"
readonly SPX_GREP="/usr/bin/grep"
readonly SPX_OPEN="/usr/bin/open"

spx_server_pid=""

# 只清理由本 launcher 自己啟動的 server；重用既有 server 時 pid 為空，不誤殺。
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

open_viewer() {
  if ! "${SPX_OPEN}" -a "Google Chrome" "${SPX_VIEWER_URL}"; then
    echo "Viewer 已就緒，但無法自動以 Google Chrome 開啟。"
    echo "請手動開啟：${SPX_VIEWER_URL}"
    return 1
  fi
}

trap stop_spx_server EXIT INT TERM HUP

# 4176 上已有能回應正確開獎秀 marker 的 server → 安全重用，直接開啟。
if viewer_is_ready; then
  echo "重用既有開獎秀 Server：${SPX_BASE_URL}"
  open_viewer || pause_before_exit
  exit
fi

# 4176 有人監聽但不是開獎秀 Viewer → fail-closed，不默默開到錯誤 server。
if "${SPX_LSOF}" -nP -iTCP:"${SPX_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port ${SPX_PORT} 已被其他程式占用，無法啟動 08_SKBN_APP左右 Viewer。"
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
  echo "無法啟動 08_SKBN_APP左右 本機 HTTP Server。請確認連接埠 ${SPX_PORT} 未被其他程式使用。"
  pause_before_exit
  exit 1
fi

if ! open_viewer; then
  pause_before_exit
  exit 1
fi

echo
echo "08_SKBN_APP左右 Viewer 已啟動：${SPX_VIEWER_URL}"
echo "關閉此視窗或按 Control-C 即可停止 Server。"
echo

wait "${spx_server_pid}"
