#!/bin/bash
# 在服务器上只需运行一次：安装 Caddy（网页服务器），建好网站目录。
# 用法：sudo bash setup.sh
set -e

apt-get update
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl rsync
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy

mkdir -p /var/www/zsmi
# 网站目录交给 admin 用户，上传文件时不需要管理员权限
chown -R admin:admin /var/www/zsmi
echo "安装完成。Caddy 版本：$(caddy version)"
