<?php
/**
 * Debug SNMP Script — jalankan dengan: php debug_snmp.php
 * Script ini test langsung ke perangkat MikroTik tanpa perlu Laravel
 */

// ==============================
// KONFIGURASI — sesuaikan di sini
// ==============================
$host      = '192.168.88.1';  // IP MikroTik
$community = 'public';         // SNMP community
$port      = 161;
$timeout   = 3000000; // 3 detik
$retries   = 1;

// ==============================

snmp_set_oid_output_format(SNMP_OID_OUTPUT_NUMERIC);
snmp_set_quick_print(false);

$target = $host . ':' . $port;

echo "===========================================\n";
echo " SNMP Debug untuk MikroTik\n";
echo " Target : $target\n";
echo " Community: $community\n";
echo "===========================================\n\n";

// Helper
function dbgSnmpGet($target, $community, $oid, $timeout, $retries) {
    $val = @snmpget($target, $community, $oid, $timeout, $retries);
    return $val;
}

function dbgSnmpWalk($target, $community, $oid, $timeout, $retries) {
    $val = @snmpwalk($target, $community, $oid, $timeout, $retries);
    return $val;
}

function parseVal($raw) {
    if (!is_string($raw)) return (string)$raw;
    if (preg_match('/^[A-Za-z0-9-]+:\s*(.+)$/', $raw, $m)) {
        return trim($m[1], '"');
    }
    return trim($raw, '"');
}

function parseNum($raw) {
    $str = parseVal((string)$raw);
    $str = trim($str);
    if (str_starts_with(strtolower($str), '0x')) {
        return hexdec(substr($str, 2));
    }
    if (preg_match('/^(\d+\.?\d*)/', $str, $m)) {
        return strpos($m[1], '.') !== false ? (float)$m[1] : (int)$m[1];
    }
    return 0;
}

// ==============================
// 1. Test koneksi
// ==============================
echo "1. TEST KONEKSI\n";
echo "---------------\n";
$sysname = dbgSnmpGet($target, $community, '.1.3.6.1.2.1.1.5.0', $timeout, $retries);
if ($sysname === false) {
    echo "❌ GAGAL: Device tidak merespons!\n";
    echo "   Cek: IP address, community string, SNMP enabled di MikroTik\n";
    exit(1);
}
echo "✅ Koneksi OK\n";
echo "   SysName: " . parseVal($sysname) . "\n\n";

// ==============================
// 2. Memory OID MikroTik
// ==============================
echo "2. MEMORY (MikroTik OID)\n";
echo "------------------------\n";
$freeRaw  = dbgSnmpGet($target, $community, '.1.3.6.1.4.1.14988.1.1.3.7.0', $timeout, $retries);
$totalRaw = dbgSnmpGet($target, $community, '.1.3.6.1.4.1.14988.1.1.3.8.0', $timeout, $retries);

echo "Free  OID raw : " . json_encode($freeRaw)  . "\n";
echo "Total OID raw : " . json_encode($totalRaw) . "\n";

if ($freeRaw !== false && $totalRaw !== false) {
    $free  = parseNum($freeRaw);
    $total = parseNum($totalRaw);
    $used  = $total - $free;
    echo "Free  (parsed): {$free} bytes = " . round($free/1048576, 2) . " MB\n";
    echo "Total (parsed): {$total} bytes = " . round($total/1048576, 2) . " MB\n";
    if ($total > 0) {
        echo "Used  : " . round($used/1048576, 2) . " MB (" . round(($used/$total)*100, 1) . "%)\n";
    }
    echo "✅ Memory MikroTik OID berhasil\n";
} else {
    echo "❌ Memory MikroTik OID tidak merespons (mungkin RouterOS 7 non-hEx?)\n";
}
echo "\n";

// ==============================
// 3. Memory via HR-MIB
// ==============================
echo "3. MEMORY (HR Storage MIB fallback)\n";
echo "-------------------------------------\n";
$descs  = dbgSnmpWalk($target, $community, '.1.3.6.1.2.1.25.2.3.1.3', $timeout, $retries);
$sizes  = dbgSnmpWalk($target, $community, '.1.3.6.1.2.1.25.2.3.1.5', $timeout, $retries);
$useds  = dbgSnmpWalk($target, $community, '.1.3.6.1.2.1.25.2.3.1.6', $timeout, $retries);
$allocs = dbgSnmpWalk($target, $community, '.1.3.6.1.2.1.25.2.3.1.4', $timeout, $retries);

if ($descs) {
    echo "Storage entries ditemukan:\n";
    foreach ($descs as $i => $d) {
        $desc = parseVal($d);
        $alloc = parseNum($allocs[$i] ?? 0);
        $size  = parseNum($sizes[$i]  ?? 0);
        $used  = parseNum($useds[$i]  ?? 0);
        $total = $size * $alloc;
        $usedB = $used * $alloc;
        $pct   = $total > 0 ? round(($usedB/$total)*100, 1) : 0;
        echo "  [{$i}] {$desc}: size={$size} alloc={$alloc} used={$used} → " . round($total/1048576,2) . "MB total, {$pct}% used\n";
    }
} else {
    echo "❌ HR-MIB Storage walk tidak merespons\n";
}
echo "\n";

// ==============================
// 4. Health Table (Suhu RouterOS 7)
// ==============================
echo "4. HEALTH TABLE (Suhu/Temperature)\n";
echo "-------------------------------------\n";
$hNames  = dbgSnmpWalk($target, $community, '.1.3.6.1.4.1.14988.1.1.19.1.1.4', $timeout, $retries);
$hValues = dbgSnmpWalk($target, $community, '.1.3.6.1.4.1.14988.1.1.19.1.1.2', $timeout, $retries);

echo "Health names  raw: " . json_encode($hNames)  . "\n";
echo "Health values raw: " . json_encode($hValues) . "\n";

if ($hNames && $hValues && count($hNames) === count($hValues)) {
    echo "Health entries:\n";
    foreach ($hNames as $i => $n) {
        $name = strtolower(trim(parseVal($n), '"'));
        $val  = parseNum($hValues[$i]);
        echo "  {$name} = {$val}\n";
    }
    echo "✅ Health Table OK\n";
} else {
    echo "❌ Health Table tidak merespons atau data tidak match\n";

    // Coba legacy temperature OID
    echo "\nMencoba legacy temperature OID (.1.3.6.1.4.1.14988.1.1.3.18.0):\n";
    $tempRaw = dbgSnmpGet($target, $community, '.1.3.6.1.4.1.14988.1.1.3.18.0', $timeout, $retries);
    echo "Raw: " . json_encode($tempRaw) . "\n";
    if ($tempRaw !== false) {
        $raw = parseNum($tempRaw);
        $temp = $raw > 200 ? round($raw/10, 1) : $raw;
        echo "✅ Legacy temp: raw={$raw} → {$temp}°C\n";
    } else {
        echo "❌ Legacy temperature OID juga tidak merespons\n";
    }
}
echo "\n";

// ==============================
// 5. CPU Load
// ==============================
echo "5. CPU LOAD\n";
echo "-----------\n";
$cpuRaw = dbgSnmpGet($target, $community, '.1.3.6.1.4.1.14988.1.1.3.14.0', $timeout, $retries);
echo "MikroTik CPU OID raw: " . json_encode($cpuRaw) . "\n";
if ($cpuRaw !== false) {
    echo "✅ CPU: " . parseNum($cpuRaw) . "%\n";
} else {
    echo "❌ MikroTik CPU OID tidak merespons\n";
    // HR-MIB fallback
    $hrCpu = dbgSnmpWalk($target, $community, '.1.3.6.1.2.1.25.3.3.1.2', $timeout, $retries);
    if ($hrCpu) {
        $vals = array_map(fn($v) => parseNum($v), $hrCpu);
        echo "HR-MIB CPU cores: " . implode(', ', $vals) . " → avg: " . round(array_sum($vals)/count($vals), 1) . "%\n";
    }
}
echo "\n";

echo "===========================================\n";
echo " SELESAI\n";
echo "===========================================\n";
