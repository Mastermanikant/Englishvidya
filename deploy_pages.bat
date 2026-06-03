@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
rem Deploy Cloudflare Pages using Wrangler, bypass PowerShell execution policy
npx wrangler pages deploy ./website
