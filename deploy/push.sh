#!/bin/bash
# 在自己电脑上运行：重新生成网站并上传到服务器。以后每次更新网站只需要跑这一条。
# 用法：bash deploy/push.sh
# 注意：生成过程会重建 .next 目录，运行前请先停掉本地的开发服务器（dev）。
set -e
cd "$(dirname "$0")/.."

# 这台服务器只开放 admin 用户登录；需要管理员权限的步骤用 sudo
HOST="${DEPLOY_HOST:-admin@47.242.143.68}"
# 这台服务器专用的登录密钥（只存在这台电脑上，不要提交到仓库）
KEY="${DEPLOY_KEY:-$HOME/.ssh/id_ed25519_zskt}"
SSH="ssh -i $KEY -o IdentitiesOnly=yes"

echo "==> 生成静态文件"
rm -rf out .next
STATIC_EXPORT=1 npx next build

echo "==> 上传网站文件到 $HOST"
rsync -az --delete --human-readable --stats -e "$SSH" out/ "$HOST:/var/www/zsmi/"

echo "==> 更新服务器配置"
rsync -az -e "$SSH" deploy/Caddyfile "$HOST:/tmp/Caddyfile"
$SSH "$HOST" "sudo caddy validate --config /tmp/Caddyfile --adapter caddyfile >/dev/null && sudo install -m 644 /tmp/Caddyfile /etc/caddy/Caddyfile && sudo systemctl reload caddy"

echo "==> 完成"
