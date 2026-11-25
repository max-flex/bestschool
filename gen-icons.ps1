# Erzeugt die App-Icons für BestSchool (PWA / Handy-Startbildschirm).
# Aufruf: powershell -ExecutionPolicy Bypass -File gen-icons.ps1
Add-Type -AssemblyName System.Drawing

function New-RoundedRect([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure()
  return $p
}

function New-Star([float]$cx, [float]$cy, [float]$rOuter, [float]$rInner) {
  $pts = @()
  for ($i = 0; $i -lt 10; $i++) {
    $r = if ($i % 2 -eq 0) { $rOuter } else { $rInner }
    $a = [Math]::PI / 5 * $i - [Math]::PI / 2
    $pts += New-Object System.Drawing.PointF ([float]($cx + $r * [Math]::Cos($a))), ([float]($cy + $r * [Math]::Sin($a)))
  }
  return [System.Drawing.PointF[]]$pts
}

function New-SchoolIcon {
  param([int]$Size, [string]$Path, [double]$SafeScale = 1.0)

  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $blue   = [System.Drawing.Color]::FromArgb(255, 58, 134, 255)   # --blue  #3a86ff
  $yellow = [System.Drawing.Color]::FromArgb(255, 255, 201, 60)   # --yellow #ffc93c
  $orange = [System.Drawing.Color]::FromArgb(255, 255, 140, 66)   # --orange #ff8c42
  $white  = [System.Drawing.Color]::White

  $g.Clear($blue)
  $s = $Size * $SafeScale
  $c = $Size / 2.0

  # weiße Tafel
  $bw = $s * 0.74; $bh = $s * 0.50
  $board = New-RoundedRect ($c - $bw / 2) ($c - $bh / 2 + $s * 0.06) $bw $bh ($s * 0.08)
  $g.FillPath((New-Object System.Drawing.SolidBrush $white), $board)

  # "123" in Orange auf der Tafel
  $font = New-Object System.Drawing.Font "Arial Black", ([float]($s * 0.26)), ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = [System.Drawing.StringAlignment]::Center
  $fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
  $rect = New-Object System.Drawing.RectangleF ([float]($c - $bw / 2)), ([float]($c - $bh / 2 + $s * 0.06)), ([float]$bw), ([float]$bh)
  $g.DrawString("123", $font, (New-Object System.Drawing.SolidBrush $orange), $rect, $fmt)

  # gelber Stern oben rechts
  $star = New-Star ($c + $bw * 0.40) ($c - $bh * 0.62) ($s * 0.15) ($s * 0.065)
  $g.FillPolygon((New-Object System.Drawing.SolidBrush $yellow), $star)

  $dir = Split-Path -Parent $Path
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
New-SchoolIcon -Size 192 -Path (Join-Path $root "icons\icon-192.png")
New-SchoolIcon -Size 512 -Path (Join-Path $root "icons\icon-512.png")
New-SchoolIcon -Size 512 -Path (Join-Path $root "icons\icon-512-maskable.png") -SafeScale 0.72
New-SchoolIcon -Size 180 -Path (Join-Path $root "icons\apple-touch-icon.png")
Write-Host "Icons erzeugt in $root\icons"
