# Android Emulator Disk Space Fix Script
# Resolve problemas de espaço em disco para emuladores Android

Write-Host "🔧 Android Emulator - Diagnóstico e Correção de Espaço em Disco" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

# Verificar espaço disponível
Write-Host "`n📊 Verificando espaço em disco..." -ForegroundColor Yellow
$avdPath = "$env:USERPROFILE\.android\avd"
$drive = (Get-Item $avdPath).PSDrive
$freeSpace = [math]::Round($drive.Free / 1GB, 2)
$totalSpace = [math]::Round(($drive.Free + $drive.Used) / 1GB, 2)

Write-Host "   Pasta AVD: $avdPath" -ForegroundColor White
Write-Host "   Espaço livre: $freeSpace GB" -ForegroundColor White
Write-Host "   Espaço total: $totalSpace GB" -ForegroundColor White

# Verificar tamanho dos AVDs existentes
Write-Host "`n📱 Verificando emuladores existentes..." -ForegroundColor Yellow
if (Test-Path $avdPath) {
    $avds = Get-ChildItem $avdPath -Directory | Where-Object { $_.Name -like "*.avd" }
    
    if ($avds.Count -gt 0) {
        Write-Host "   Emuladores encontrados:" -ForegroundColor White
        foreach ($avd in $avds) {
            $size = [math]::Round((Get-ChildItem $avd.FullName -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1GB, 2)
            Write-Host "   - $($avd.Name): $size GB" -ForegroundColor White
        }
    } else {
        Write-Host "   Nenhum emulador encontrado." -ForegroundColor White
    }
} else {
    Write-Host "   Pasta AVD não encontrada." -ForegroundColor Red
}

# Verificar se há espaço suficiente
$requiredSpace = 80 # GB necessários para emulador
if ($freeSpace -lt $requiredSpace) {
    Write-Host "`n⚠️  PROBLEMA IDENTIFICADO: Espaço insuficiente!" -ForegroundColor Red
    Write-Host "   Necessário: $requiredSpace GB" -ForegroundColor Red
    Write-Host "   Disponível: $freeSpace GB" -ForegroundColor Red
    Write-Host "   Faltam: $([math]::Round($requiredSpace - $freeSpace, 2)) GB" -ForegroundColor Red
    
    Write-Host "`n🔧 SOLUÇÕES POSSÍVEIS:" -ForegroundColor Yellow
    Write-Host "   1. Limpar arquivos temporários" -ForegroundColor White
    Write-Host "   2. Remover emuladores não utilizados" -ForegroundColor White
    Write-Host "   3. Criar emulador com menos espaço" -ForegroundColor White
    Write-Host "   4. Mover AVDs para outro drive" -ForegroundColor White
    
    # Opção 1: Limpeza automática
    Write-Host "`n🧹 Executando limpeza automática..." -ForegroundColor Yellow
    
    # Limpar cache do Gradle
    $gradleCache = "$env:USERPROFILE\.gradle\caches"
    if (Test-Path $gradleCache) {
        $gradleSize = [math]::Round((Get-ChildItem $gradleCache -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1GB, 2)
        Write-Host "   Cache do Gradle: $gradleSize GB" -ForegroundColor White
        Write-Host "   Para limpar: Remove-Item '$gradleCache' -Recurse -Force" -ForegroundColor Gray
    }
    
    # Limpar cache do Android SDK
    $androidCache = "$env:USERPROFILE\.android\cache"
    if (Test-Path $androidCache) {
        $androidCacheSize = [math]::Round((Get-ChildItem $androidCache -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1GB, 2)
        Write-Host "   Cache do Android: $androidCacheSize GB" -ForegroundColor White
        Write-Host "   Para limpar: Remove-Item '$androidCache' -Recurse -Force" -ForegroundColor Gray
    }
    
    # Verificar node_modules
    $nodeModules = "node_modules"
    if (Test-Path $nodeModules) {
        $nodeSize = [math]::Round((Get-ChildItem $nodeModules -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1GB, 2)
        Write-Host "   Node modules: $nodeSize GB" -ForegroundColor White
    }
    
} else {
    Write-Host "`n✅ Espaço suficiente disponível!" -ForegroundColor Green
}

# Opção 3: Criar emulador menor
Write-Host "`n💡 SOLUÇÃO RECOMENDADA: Criar emulador otimizado" -ForegroundColor Green
Write-Host "   Vamos criar um emulador menor e mais eficiente:" -ForegroundColor White

$createEmulator = @"
# Comando para criar emulador otimizado:
`$env:ANDROID_HOME\cmdline-tools\latest\bin\avdmanager create avd ``
    -n "CrowbarDev" ``
    -k "system-images;android-33;google_apis;x86_64" ``
    -d "pixel_2" ``
    --force

# Configurações otimizadas (adicionar ao config.ini):
# hw.ramSize=2048
# vm.heapSize=256
# disk.dataPartition.size=2048MB
# hw.gpu.enabled=yes
# hw.gpu.mode=host
"@

Write-Host $createEmulator -ForegroundColor Gray

Write-Host "`n🚀 PRÓXIMOS PASSOS:" -ForegroundColor Green
Write-Host "   1. Execute este script como Administrador se necessário" -ForegroundColor White
Write-Host "   2. Limpe espaço em disco conforme sugerido" -ForegroundColor White
Write-Host "   3. Crie um emulador otimizado" -ForegroundColor White
Write-Host "   4. Teste o emulador: emulator -avd CrowbarDev" -ForegroundColor White

Write-Host "`n📋 COMANDOS ÚTEIS:" -ForegroundColor Yellow
Write-Host "   Listar AVDs: emulator -list-avds" -ForegroundColor Gray
Write-Host "   Iniciar emulador: emulator -avd NOME_DO_AVD" -ForegroundColor Gray
Write-Host "   Verificar dispositivos: adb devices" -ForegroundColor Gray
