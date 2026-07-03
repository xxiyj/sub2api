@echo off
setlocal EnableExtensions

rem Sync official Sub2API updates into this fork/template workflow.
rem Defaults:
rem   upstream/main -> local main -> origin/main
rem   local main -> local my-template -> optional origin/my-template

set "MAIN_BRANCH=main"
set "TEMPLATE_BRANCH=my-template"
set "UPSTREAM_REMOTE=upstream"
set "ORIGIN_REMOTE=origin"

cd /d "%~dp0\.."
if errorlevel 1 goto :fail

git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 (
  echo [ERROR] This script must run inside the sub2api git repository.
  goto :fail
)

call :require_remote "%UPSTREAM_REMOTE%"
if errorlevel 1 goto :fail

call :require_remote "%ORIGIN_REMOTE%"
if errorlevel 1 goto :fail

call :require_clean_worktree
if errorlevel 1 goto :fail

echo.
echo [1/6] Fetching official updates from %UPSTREAM_REMOTE%...
git fetch "%UPSTREAM_REMOTE%"
if errorlevel 1 goto :fail

echo.
echo [2/6] Switching to %MAIN_BRANCH%...
git checkout "%MAIN_BRANCH%"
if errorlevel 1 goto :fail

echo.
echo [3/6] Fast-forwarding %MAIN_BRANCH% from %UPSTREAM_REMOTE%/%MAIN_BRANCH%...
git merge --ff-only "%UPSTREAM_REMOTE%/%MAIN_BRANCH%"
if errorlevel 1 (
  echo.
  echo [ERROR] %MAIN_BRANCH% cannot fast-forward from %UPSTREAM_REMOTE%/%MAIN_BRANCH%.
  echo         Keep %MAIN_BRANCH% as the clean official tracking branch, then retry.
  goto :fail
)

echo.
echo [4/6] Pushing %MAIN_BRANCH% to %ORIGIN_REMOTE%...
git push "%ORIGIN_REMOTE%" "%MAIN_BRANCH%"
if errorlevel 1 goto :fail

echo.
echo [5/6] Switching to %TEMPLATE_BRANCH%...
git checkout "%TEMPLATE_BRANCH%"
if errorlevel 1 goto :fail

echo.
echo [6/6] Merging %MAIN_BRANCH% into %TEMPLATE_BRANCH%...
git merge --no-edit "%MAIN_BRANCH%"
if errorlevel 1 (
  echo.
  echo [CONFLICT] Merge stopped on %TEMPLATE_BRANCH%.
  echo            Resolve conflicts, then run:
  echo              git status
  echo              git add ^<resolved-files^>
  echo              git commit
  echo              git push %ORIGIN_REMOTE% %TEMPLATE_BRANCH%
  goto :fail
)

echo.
choice /C YN /N /M "Push %TEMPLATE_BRANCH% to %ORIGIN_REMOTE% now? [Y/N] "
if errorlevel 2 goto :done_no_push

git push "%ORIGIN_REMOTE%" "%TEMPLATE_BRANCH%"
if errorlevel 1 goto :fail

echo.
echo [OK] Official updates synced and %TEMPLATE_BRANCH% pushed.
goto :done

:done_no_push
echo.
echo [OK] Official updates synced locally. Push later with:
echo      git push %ORIGIN_REMOTE% %TEMPLATE_BRANCH%
goto :done

:require_remote
git remote get-url %~1 >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Missing git remote: %~1
  exit /b 1
)
exit /b 0

:require_clean_worktree
for /f "usebackq delims=" %%S in (`git status --porcelain`) do (
  echo [ERROR] Working tree is not clean.
  echo         Commit or stash your changes before syncing official updates.
  echo.
  git status --short
  exit /b 1
)
exit /b 0

:fail
echo.
echo [FAILED] Sync did not complete.
exit /b 1

:done
echo.
git status --short
exit /b 0
