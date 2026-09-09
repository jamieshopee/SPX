#!/bin/zsh

set -u

readonly SPX_SCRIPT_DIR="${0:A:h}"
readonly SPX_HOST="127.0.0.1"
readonly SPX_PORT="4174"
readonly SPX_URL="http://${SPX_HOST}:${SPX_PORT}/"
readonly SPX_PYTHON="/usr/bin/python3"
readonly SPX_CURL="/usr/bin/curl"
readonly SPX_LSOF="/usr/sbin/lsof"
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

trap stop_spx_server EXIT INT TERM HUP

if ! cd "${SPX_SCRIPT_DIR}"; then
  echo "無法切換到 SPX 根目錄。"
  pause_before_exit
  exit 1
fi

if [[ ! -x "${SPX_PYTHON}" ]]; then
  echo "找不到 macOS 的 Python 3，無法啟動本機 HTTP Server。"
  pause_before_exit
  exit 1
fi

if "${SPX_LSOF}" -nP -iTCP:"${SPX_PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port ${SPX_PORT} 已被占用，可能已有舊 SPX Server 正在執行。請先關閉舊的 SPX Server 後再重新啟動。"
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

  if "${SPX_CURL}" --silent --fail --max-time 1 "${SPX_URL}" >/dev/null 2>&1; then
    if kill -0 "${spx_server_pid}" 2>/dev/null; then
      spx_server_ready=true
    fi
    break
  fi

  sleep 0.1
done

if [[ "${spx_server_ready}" != true ]]; then
  echo
  echo "無法啟動 SPX 本機 HTTP Server。請確認連接埠 ${SPX_PORT} 未被其他程式使用。"
  pause_before_exit
  exit 1
fi

if ! "${SPX_OPEN}" -a "Google Chrome" "${SPX_URL}"; then
  echo
  echo "Server 已啟動，但無法自動以 Google Chrome 開啟。"
  echo "請手動開啟：${SPX_URL}"
fi

echo
echo "SPX 本機 HTTP Server 已啟動：${SPX_URL}"
echo "關閉此視窗或按 Control-C 即可停止 Server。"
echo

wait "${spx_server_pid}"
