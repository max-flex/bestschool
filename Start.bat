@echo off
rem Startet BestSchool im Standardbrowser (mit lokalem Server, damit Vorlesen und Offline-Modus funktionieren).
echo Starte BestSchool ...
start "BestSchool-Server" powershell -ExecutionPolicy Bypass -WindowStyle Minimized -File "%~dp0serve.ps1" -Port 8124
timeout /t 2 >nul
start "" http://localhost:8124/
echo.
echo Die App laeuft jetzt im Browser unter http://localhost:8124/
echo Dieses Fenster kann geschlossen werden. Zum Beenden den minimierten
echo PowerShell-Server (BestSchool-Server) schliessen.
echo.
echo Online (auch fuers Handy): https://max-flex.github.io/bestschool/
echo.
echo Zugriff vom Handy im selben WLAN (falls Firewall/Rechte es erlauben):
powershell -NoProfile -Command "[System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) | Where-Object { $_.AddressFamily -eq 'InterNetwork' -and $_.ToString() -ne '127.0.0.1' } | ForEach-Object { Write-Host ('  http://' + $_.ToString() + ':8124/') }"
echo Falls keine Adresse erscheint oder das Handy sich nicht verbinden kann:
echo Start.bat einmalig per Rechtsklick "Als Administrator ausfuehren" starten.
