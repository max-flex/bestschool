param([int]$Port = 8124)
# Kleiner lokaler Webserver für BestSchool (ohne Installation). Wird von Start.bat aufgerufen.
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = New-Object System.Net.HttpListener
$lanMode = $true
try {
  $listener.Prefixes.Add("http://+:$Port/")
  $listener.Start()
} catch {
  $lanMode = $false
  $listener = New-Object System.Net.HttpListener
  $listener.Prefixes.Add("http://localhost:$Port/")
  $listener.Start()
}
Write-Host "Serving $root"
Write-Host "  Auf diesem PC: http://localhost:$Port/"
if ($lanMode) {
  $ips = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) |
    Where-Object { $_.AddressFamily -eq 'InterNetwork' -and $_.ToString() -ne '127.0.0.1' }
  foreach ($ip in $ips) { Write-Host "  Im WLAN (z.B. vom Handy): http://$($ip):$Port/" }
} else {
  Write-Host "  Hinweis: Kein WLAN-Zugriff moeglich. Fuer Zugriff vom Handy Start.bat einmalig"
  Write-Host "  per Rechtsklick -> 'Als Administrator ausfuehren' starten."
}
$mime = @{ ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8"; ".js"="application/javascript; charset=utf-8"; ".json"="application/json"; ".png"="image/png"; ".jpg"="image/jpeg"; ".svg"="image/svg+xml"; ".md"="text/plain; charset=utf-8" }
while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrEmpty($rel)) { $rel = "index.html" }
    $path = [System.IO.Path]::GetFullPath((Join-Path $root $rel))
    if ($path.StartsWith($root) -and (Test-Path $path -PathType Leaf)) {
      $bytes = [System.IO.File]::ReadAllBytes($path)
      $ext = [System.IO.Path]::GetExtension($path).ToLower()
      if ($mime.ContainsKey($ext)) { $ctx.Response.ContentType = $mime[$ext] }
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
    }
    $ctx.Response.Close()
  } catch { }
}
