@echo off
echo ===============================
echo Git auto push
echo ===============================

git add .

set /p msg="Nhap commit message: "
git commit -m "%msg%"

git push

echo.
echo DONE! Bam phim bat ky de thoat...
pause > nul
