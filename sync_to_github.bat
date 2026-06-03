@echo off
rem Add Git to PATH for this script
set "PATH=C:\Program Files\Git\cmd;%PATH%"

rem Create (or switch to) the main branch
git checkout -b master

rem Stage all files
git add -A

rem Commit with message
git commit -m "Initial commit"

rem Push to remote origin
git push -u origin master
