@echo off
rem Add Git to PATH for this script
set "PATH=C:\Program Files\Git\cmd;%PATH%"

rem Switch to the main branch
    git checkout master

    rem Stage all changes
    git add -A

    rem Commit with descriptive message
    git commit -m "Update hero title"
    
rem Push to remote origin
git push -u origin master
