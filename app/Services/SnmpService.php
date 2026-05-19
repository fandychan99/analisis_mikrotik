<?php

namespace App\Services;

use App\Models\Device;
use Exception;
use Illuminate\Support\Facades\Log;

class SnmpService
{
    // Standard OIDs
    const OID_SYS_DESCR       = '.1.3.6.1.2.1.1.1.0';
    const OID_SYS_NAME        = '.1.3.6.1.2.1.1.5.0';
    const OID_SYS_UPTIME      = '.1.3.6.1.2.1.1.3.0';
    const OID_SYS_CONTACT     = '.1.3.6.1.2.1.1.4.0';
    const OID_SYS_LOCATION    = '.1.3.6.1.2.1.1.6.0';

    // Interface OIDs
    const OID_IF_TABLE         = '.1.3.6.1.2.1.2.2';
    const OID_IF_INDEX         = '.1.3.6.1.2.1.2.2.1.1';
    const OID_IF_DESC          = '.1.3.6.1.2.1.2.2.1.2';
    const OID_IF_TYPE          = '.1.3.6.1.2.1.2.2.1.3';
    const OID_IF_SPEED         = '.1.3.6.1.2.1.2.2.1.5';
    const OID_IF_PHYS_ADDR     = '.1.3.6.1.2.1.2.2.1.6';
    const OID_IF_ADMIN_STATUS  = '.1.3.6.1.2.1.2.2.1.7';
    const OID_IF_OPER_STATUS   = '.1.3.6.1.2.1.2.2.1.8';
    const OID_IF_IN_OCTETS     = '.1.3.6.1.2.1.2.2.1.10';
    const OID_IF_IN_ERRORS     = '.1.3.6.1.2.1.2.2.1.14';
    const OID_IF_OUT_OCTETS    = '.1.3.6.1.2.1.2.2.1.16';
    const OID_IF_OUT_ERRORS    = '.1.3.6.1.2.1.2.2.1.20';
    const OID_IF_IN_DISCARDS   = '.1.3.6.1.2.1.2.2.1.13'; // [F-FCAPS] Paket dibuang masuk
    const OID_IF_OUT_DISCARDS  = '.1.3.6.1.2.1.2.2.1.19'; // [F-FCAPS] Paket dibuang keluar

    // IF-MIB 64bit counters
    const OID_IF_HC_IN_OCTETS  = '.1.3.6.1.2.1.31.1.1.1.6';
    const OID_IF_HC_OUT_OCTETS = '.1.3.6.1.2.1.31.1.1.1.10';
    const OID_IF_NAME          = '.1.3.6.1.2.1.31.1.1.1.1';
    const OID_IF_HIGH_SPEED    = '.1.3.6.1.2.1.31.1.1.1.15'; // Mbps

    // Host Resources MIB
    const OID_HR_PROCESSOR_LOAD   = '.1.3.6.1.2.1.25.3.3.1.2';
    const OID_HR_STORAGE_TABLE    = '.1.3.6.1.2.1.25.2.3.1';
    const OID_HR_STORAGE_TYPE     = '.1.3.6.1.2.1.25.2.3.1.2';
    const OID_HR_STORAGE_DESC     = '.1.3.6.1.2.1.25.2.3.1.3';
    const OID_HR_STORAGE_ALLOC    = '.1.3.6.1.2.1.25.2.3.1.4';
    const OID_HR_STORAGE_SIZE     = '.1.3.6.1.2.1.25.2.3.1.5';
    const OID_HR_STORAGE_USED     = '.1.3.6.1.2.1.25.2.3.1.6';

    // MikroTik specific OIDs (MIKROTIK-MIB)
    const OID_MT_CPU_LOAD         = '.1.3.6.1.4.1.14988.1.1.3.14.0';  // mtxrHlCpuLoad
    const OID_MT_FREE_MEMORY      = '.1.3.6.1.4.1.14988.1.1.3.7.0';   // mtxrHlFreeMemory
    const OID_MT_TOTAL_MEMORY     = '.1.3.6.1.4.1.14988.1.1.3.8.0';   // mtxrHlTotalMemory
    const OID_MT_FREE_HDD         = '.1.3.6.1.4.1.14988.1.1.3.9.0';   // mtxrHlFreeHddSpace
    const OID_MT_TOTAL_HDD        = '.1.3.6.1.4.1.14988.1.1.3.10.0';  // mtxrHlTotalHddSpace
    const OID_MT_BAD_BLOCKS       = '.1.3.6.1.4.1.14988.1.1.3.11.0';
    const OID_MT_WRITE_SECT_TOTAL = '.1.3.6.1.4.1.14988.1.1.3.12.0';
    const OID_MT_WRITE_SECT_SINCE = '.1.3.6.1.4.1.14988.1.1.3.13.0';
    const OID_MT_TEMPERATURE      = '.1.3.6.1.4.1.14988.1.1.3.18.0';  // mtxrHlTemperature (RouterOS 6)
    const OID_MT_VOLTAGE          = '.1.3.6.1.4.1.14988.1.1.3.16.0';  // mtxrHlVoltage (RouterOS 6)

    // RouterOS 7 Health Table (mtxrHlHealth) — replaces scalar OIDs above
    // Walk these to get name/value/type per health metric
    const OID_MT_HEALTH_NAME      = '.1.3.6.1.4.1.14988.1.1.19.1.1.4'; // health entry name (e.g. "temperature")
    const OID_MT_HEALTH_VALUE     = '.1.3.6.1.4.1.14988.1.1.19.1.1.2'; // health entry value
    const OID_MT_HEALTH_TYPE      = '.1.3.6.1.4.1.14988.1.1.19.1.1.3'; // health entry unit (C, V, %...)

    // RouterOS 7 Health Table alternative base OID (walk entire table)
    const OID_MT_HEALTH_TABLE     = '.1.3.6.1.4.1.14988.1.1.19';

    // ── PPPoE Active Sessions (A — Accounting, FCAPS) ──
    // MIKROTIK-MIB: mtxrPPPoETable
    const OID_MT_PPPOE_TABLE      = '.1.3.6.1.4.1.14988.1.1.2';     // table base
    const OID_MT_PPPOE_NAME       = '.1.3.6.1.4.1.14988.1.1.2.1.1.2'; // username
    const OID_MT_PPPOE_SERVICE    = '.1.3.6.1.4.1.14988.1.1.2.1.1.3'; // service
    const OID_MT_PPPOE_CALLER_ID  = '.1.3.6.1.4.1.14988.1.1.2.1.1.4'; // caller-id (remote IP)
    const OID_MT_PPPOE_ENCODING   = '.1.3.6.1.4.1.14988.1.1.2.1.1.5'; // encoding
    const OID_MT_PPPOE_UPTIME     = '.1.3.6.1.4.1.14988.1.1.2.1.1.7'; // session uptime (seconds)

    private Device $device;
    private string $community;
    private string $host;
    private int $port;
    private int $timeout = 2000000; // 2 seconds in microseconds
    private int $retries = 1;

    public function __construct(Device $device)
    {
        $this->device = $device;
        $this->community = $device->snmp_community;
        $this->host = $device->ip_address;
        $this->port = $device->snmp_port ?? 161;

        // Suppress SNMP errors
        snmp_set_oid_output_format(SNMP_OID_OUTPUT_NUMERIC);
    }

    /**
     * Test connectivity to device via SNMP
     */
    public function testConnection(): array
    {
        try {
            $result = @snmpget(
                $this->host . ':' . $this->port,
                $this->community,
                self::OID_SYS_NAME,
                $this->timeout,
                $this->retries
            );

            if ($result === false) {
                return ['success' => false, 'message' => 'SNMP request timeout or unreachable'];
            }

            return [
                'success' => true,
                'message' => 'Connection successful',
                'sysname' => $this->parseValue($result),
            ];
        } catch (Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Get system information
     */
    public function getSystemInfo(): array
    {
        $info = [];

        try {
            $oids = [
                'sys_descr'   => self::OID_SYS_DESCR,
                'sys_name'    => self::OID_SYS_NAME,
                'sys_contact' => self::OID_SYS_CONTACT,
                'sys_location' => self::OID_SYS_LOCATION,
            ];

            foreach ($oids as $key => $oid) {
                $val = @snmpget($this->host . ':' . $this->port, $this->community, $oid, $this->timeout, $this->retries);
                if ($val !== false) {
                    $info[$key] = $this->parseValue($val);
                }
            }

            // Uptime (in hundredths of a second)
            // Raw format: "Timeticks: (123456789) 14 days, 6:56:07.89"
            // We extract the number inside parentheses to avoid ambiguity
            $uptime = @snmpget($this->host . ':' . $this->port, $this->community, self::OID_SYS_UPTIME, $this->timeout, $this->retries);
            if ($uptime !== false) {
                if (preg_match('/\((\d+)\)/', (string) $uptime, $m)) {
                    $uptimeTicks = (int) $m[1];
                } else {
                    $uptimeTicks = $this->parseNumericValue($uptime);
                }
                $info['uptime_seconds'] = intval($uptimeTicks / 100);
                $info['uptime_ticks']   = $uptimeTicks;
            }

        } catch (Exception $e) {
            Log::error("SNMP getSystemInfo error for device {$this->device->id}: " . $e->getMessage());
        }

        return $info;
    }

    /**
     * Get CPU load (MikroTik specific first, then standard)
     */
    public function getCpuLoad(): ?float
    {
        try {
            // Try MikroTik specific OID first (returns 0-100 single value)
            $val = @snmpget($this->host . ':' . $this->port, $this->community, self::OID_MT_CPU_LOAD, $this->timeout, $this->retries);
            if ($val !== false) {
                $cpu = (float) $this->parseNumericValue($val);
                // Sanity check: MikroTik OID should be 0-100
                if ($cpu >= 0 && $cpu <= 100) {
                    return $cpu;
                }
            }

            // Fallback: HR MIB processor load — AVERAGE across all cores
            // (do NOT sum; multi-core routers return one value per core)
            $result = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_HR_PROCESSOR_LOAD, $this->timeout, $this->retries);
            if ($result && count($result) > 0) {
                $values = array_map(fn($v) => (float) $this->parseNumericValue($v), $result);
                return round(array_sum($values) / count($values), 2);
            }
        } catch (Exception $e) {
            Log::error("SNMP getCpuLoad error for device {$this->device->id}: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Get memory information
     */
    public function getMemoryInfo(): array
    {
        $memory = [];

        try {
            // MikroTik specific OIDs (bytes)
            $freeVal  = @snmpget($this->host . ':' . $this->port, $this->community, self::OID_MT_FREE_MEMORY,  $this->timeout, $this->retries);
            $totalVal = @snmpget($this->host . ':' . $this->port, $this->community, self::OID_MT_TOTAL_MEMORY, $this->timeout, $this->retries);

            Log::debug("[SnmpService] Memory OID raw — free: " . json_encode($freeVal) . " | total: " . json_encode($totalVal));

            if ($freeVal !== false && $totalVal !== false) {
                $free  = $this->parseNumericValue($freeVal);
                $total = $this->parseNumericValue($totalVal);

                if ($total > 0 && $free >= 0 && $free <= $total) {
                    $used = $total - $free;

                    $memory['free_bytes']  = $free;
                    $memory['total_bytes'] = $total;
                    $memory['used_bytes']  = $used;
                    $memory['free_mb']     = round($free  / 1048576, 2);
                    $memory['total_mb']    = round($total / 1048576, 2);
                    $memory['used_mb']     = round($used  / 1048576, 2);
                    $memory['percent']     = round(($used / $total) * 100, 2);

                    Log::debug("[SnmpService] Memory (MikroTik OID): total={$memory['total_mb']}MB used={$memory['used_mb']}MB {$memory['percent']}%");
                    return $memory;
                }
            }

            Log::debug("[SnmpService] MikroTik Memory OID failed, trying HR-MIB fallback...");

            // Fallback: HR Storage MIB
            $descs  = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_HR_STORAGE_DESC,  $this->timeout, $this->retries);
            $sizes  = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_HR_STORAGE_SIZE,  $this->timeout, $this->retries);
            $useds  = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_HR_STORAGE_USED,  $this->timeout, $this->retries);
            $allocs = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_HR_STORAGE_ALLOC, $this->timeout, $this->retries);

            if ($descs) {
                Log::debug("[SnmpService] HR Storage descs: " . implode(', ', array_map(fn($d) => $this->parseValue($d), $descs)));
            }

            if ($descs && $sizes && $useds && $allocs) {
                foreach ($descs as $i => $desc) {
                    $descStr = strtolower($this->parseValue($desc));
                    // MikroTik RouterOS reports memory as 'physical memory', 'ram', or just 'memory'
                    if (str_contains($descStr, 'physical memory')
                        || str_contains($descStr, 'ram')
                        || str_contains($descStr, 'memory')
                    ) {
                        $alloc = $this->parseNumericValue($allocs[$i] ?? 0);
                        $size  = $this->parseNumericValue($sizes[$i]  ?? 0);
                        $used  = $this->parseNumericValue($useds[$i]  ?? 0);

                        if ($alloc <= 0 || $size <= 0) continue;

                        $totalBytes = $size * $alloc;
                        $usedBytes  = $used * $alloc;
                        $freeBytes  = $totalBytes - $usedBytes;

                        $memory['total_bytes'] = $totalBytes;
                        $memory['used_bytes']  = $usedBytes;
                        $memory['free_bytes']  = $freeBytes;
                        $memory['total_mb']    = round($totalBytes / 1048576, 2);
                        $memory['used_mb']     = round($usedBytes  / 1048576, 2);
                        $memory['free_mb']     = round($freeBytes  / 1048576, 2);
                        $memory['percent']     = $totalBytes > 0 ? round(($usedBytes / $totalBytes) * 100, 2) : 0;

                        Log::debug("[SnmpService] Memory (HR-MIB, '{$descStr}'): total={$memory['total_mb']}MB used={$memory['used_mb']}MB {$memory['percent']}%");
                        break;
                    }
                }
            }
        } catch (Exception $e) {
            Log::error("SNMP getMemoryInfo error for device {$this->device->id}: " . $e->getMessage());
        }

        return $memory;
    }

    /**
     * Get disk/HDD information (MikroTik specific)
     */
    public function getDiskInfo(): array
    {
        $disk = [];

        try {
            $freeVal  = @snmpget($this->host . ':' . $this->port, $this->community, self::OID_MT_FREE_HDD, $this->timeout, $this->retries);
            $totalVal = @snmpget($this->host . ':' . $this->port, $this->community, self::OID_MT_TOTAL_HDD, $this->timeout, $this->retries);

            if ($freeVal !== false && $totalVal !== false) {
                $free  = $this->parseNumericValue($freeVal);
                $total = $this->parseNumericValue($totalVal);

                // RB750Gr3 and similar flash-only devices return total > 0 but free = 0
                // which would yield 100%. Fall through to HR-MIB in that case.
                if ($total > 0 && $free >= 0 && $free <= $total) {
                    $used = $total - $free;

                    $disk['free_bytes']  = $free;
                    $disk['total_bytes'] = $total;
                    $disk['used_bytes']  = $used;
                    $disk['free_mb']     = round($free / 1048576, 2);
                    $disk['total_mb']    = round($total / 1048576, 2);
                    $disk['used_mb']     = round($used / 1048576, 2);
                    $disk['percent']     = round(($used / $total) * 100, 2);

                    // Only return if not suspiciously 100% with zero free
                    if ($free > 0 || $used === 0) {
                        return $disk;
                    }
                }
            }

            // Fallback: HR-MIB Storage table (works for flash/NAND on MikroTik)
            $descs  = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_HR_STORAGE_DESC,  $this->timeout, $this->retries);
            $sizes  = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_HR_STORAGE_SIZE,  $this->timeout, $this->retries);
            $useds  = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_HR_STORAGE_USED,  $this->timeout, $this->retries);
            $allocs = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_HR_STORAGE_ALLOC, $this->timeout, $this->retries);

            if ($descs && $sizes && $useds && $allocs) {
                foreach ($descs as $i => $desc) {
                    $descStr = strtolower($this->parseValue($desc));
                    // Match flash, nand, disk, hdd, or storage entries
                    if (str_contains($descStr, 'flash') ||
                        str_contains($descStr, 'nand')  ||
                        str_contains($descStr, 'disk')  ||
                        str_contains($descStr, 'storage')) {

                        $alloc      = $this->parseNumericValue($allocs[$i] ?? 0);
                        $sizeBlocks = $this->parseNumericValue($sizes[$i]  ?? 0);
                        $usedBlocks = $this->parseNumericValue($useds[$i]  ?? 0);

                        if ($alloc <= 0 || $sizeBlocks <= 0) continue;

                        $totalBytes = $sizeBlocks * $alloc;
                        $usedBytes  = $usedBlocks * $alloc;
                        $freeBytes  = $totalBytes - $usedBytes;

                        $disk['total_bytes'] = $totalBytes;
                        $disk['used_bytes']  = $usedBytes;
                        $disk['free_bytes']  = $freeBytes;
                        $disk['total_mb']    = round($totalBytes / 1048576, 2);
                        $disk['used_mb']     = round($usedBytes  / 1048576, 2);
                        $disk['free_mb']     = round($freeBytes  / 1048576, 2);
                        $disk['percent']     = $totalBytes > 0 ? round(($usedBytes / $totalBytes) * 100, 2) : 0;
                        break;
                    }
                }
            }
        } catch (Exception $e) {
            Log::error("SNMP getDiskInfo error for device {$this->device->id}: " . $e->getMessage());
        }

        return $disk;
    }

    /**
     * Get RouterOS 7 Health Table as keyed array: ['temperature' => 30.0, 'voltage' => 24.1, ...]
     * RouterOS 7 replaced scalar health OIDs with a dynamic table.
     */
    public function getHealthTable(): array
    {
        $health = [];

        try {
            $names  = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_MT_HEALTH_NAME,  $this->timeout, $this->retries);
            $values = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_MT_HEALTH_VALUE, $this->timeout, $this->retries);

            Log::debug("[SnmpService] Health names raw: "  . json_encode($names));
            Log::debug("[SnmpService] Health values raw: " . json_encode($values));

            if ($names && $values && count($names) === count($values)) {
                foreach ($names as $i => $nameRaw) {
                    // Strip type prefix (STRING: "temperature") and surrounding quotes
                    $name  = strtolower(trim($this->parseValue($nameRaw), '"'));
                    $value = $this->parseNumericValue($values[$i]);
                    $health[$name] = (float) $value;
                }
                Log::debug("[SnmpService] Health table parsed: " . json_encode($health));
            } else {
                Log::warning("[SnmpService] Health table walk returned mismatched or empty data. names=" . count((array)$names) . " values=" . count((array)$values));
            }
        } catch (Exception $e) {
            Log::error("SNMP getHealthTable error for device {$this->device->id}: " . $e->getMessage());
        }

        return $health;
    }

    /**
     * Get temperature — tries RouterOS 7 health table first, then legacy OID
     */
    public function getTemperature(): ?float
    {
        try {
            // RouterOS 7: health table (value already in °C, not tenths)
            $health = $this->getHealthTable();
            Log::debug("[SnmpService] getTemperature — health keys: " . implode(', ', array_keys($health)));

            // Try various key names the health table might use
            foreach (['temperature', 'cpu-temperature', 'board-temperature', 'temp'] as $key) {
                if (isset($health[$key]) && $health[$key] > 0) {
                    Log::debug("[SnmpService] Temperature found via health table key '{$key}': {$health[$key]}°C");
                    return (float) $health[$key];
                }
            }

            // RouterOS 6 legacy OID (value in tenths of °C → divide by 10)
            $val = @snmpget($this->host . ':' . $this->port, $this->community, self::OID_MT_TEMPERATURE, $this->timeout, $this->retries);
            Log::debug("[SnmpService] Legacy temperature OID raw: " . json_encode($val));
            if ($val !== false) {
                $raw = (float) $this->parseNumericValue($val);
                // If value > 200 it is likely tenths (300 = 30°C), otherwise direct
                $result = $raw > 200 ? round($raw / 10, 1) : $raw;
                Log::debug("[SnmpService] Temperature (legacy OID): raw={$raw} → {$result}°C");
                return $result;
            }

            Log::warning("[SnmpService] Temperature could not be fetched for device {$this->device->id}");
        } catch (Exception $e) {
            Log::error("SNMP getTemperature error: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Get voltage — tries RouterOS 7 health table first, then legacy OID
     */
    public function getVoltage(): ?float
    {
        try {
            $health = $this->getHealthTable();
            if (isset($health['voltage'])) {
                return $health['voltage'];
            }

            // RouterOS 6 legacy OID (value in tenths of V)
            $val = @snmpget($this->host . ':' . $this->port, $this->community, self::OID_MT_VOLTAGE, $this->timeout, $this->retries);
            if ($val !== false) {
                $raw = (float) $this->parseNumericValue($val);
                return $raw > 100 ? round($raw / 10, 1) : $raw;
            }
        } catch (Exception $e) {
            Log::error("SNMP getVoltage error: " . $e->getMessage());
        }

        return null;
    }

    /**
     * [F — Fault] Get packet discard counts per interface
     * Returns: ['ifName' => ['in_discards' => N, 'out_discards' => N], ...]
     */
    public function getInterfaceDiscards(): array
    {
        $result = [];
        try {
            $ifNames    = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_IF_NAME,        $this->timeout, $this->retries);
            $inDiscards = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_IF_IN_DISCARDS,  $this->timeout, $this->retries);
            $outDiscards= @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_IF_OUT_DISCARDS, $this->timeout, $this->retries);

            if ($ifNames && $inDiscards && $outDiscards) {
                foreach ($ifNames as $idx => $nameRaw) {
                    $name = $this->parseValue($nameRaw);
                    $result[$name] = [
                        'in_discards'  => (int) $this->parseNumericValue($inDiscards[$idx]  ?? 0),
                        'out_discards' => (int) $this->parseNumericValue($outDiscards[$idx] ?? 0),
                    ];
                }
            }
        } catch (Exception $e) {
            Log::error("SNMP getInterfaceDiscards error: " . $e->getMessage());
        }
        return $result;
    }

    /**
     * [A — Accounting] Get active PPPoE sessions from MikroTik SNMP
     * Returns array of session data
     */
    public function getPppoeSessions(): array
    {
        $sessions = [];
        try {
            $names     = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_MT_PPPOE_NAME,      $this->timeout, $this->retries);
            $services  = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_MT_PPPOE_SERVICE,   $this->timeout, $this->retries);
            $callerIds = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_MT_PPPOE_CALLER_ID, $this->timeout, $this->retries);
            $uptimes   = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_MT_PPPOE_UPTIME,    $this->timeout, $this->retries);

            Log::debug("[SnmpService] PPPoE names raw: " . json_encode($names));

            if (!$names) return [];

            foreach ($names as $i => $nameRaw) {
                $username  = $this->parseValue($nameRaw);
                $service   = isset($services[$i])  ? $this->parseValue($services[$i])  : null;
                $callerId  = isset($callerIds[$i])  ? $this->parseValue($callerIds[$i]) : null;
                $uptimeSec = isset($uptimes[$i])    ? (int) $this->parseNumericValue($uptimes[$i]) : 0;

                // PPPoE interface name biasanya <pppoe-username>
                $ifName = "<pppoe-{$username}>";

                $sessions[] = [
                    'username'        => $username,
                    'interface_name'  => $ifName,
                    'service'         => $service,
                    'caller_id'       => $callerId,
                    'uptime_seconds'  => $uptimeSec,
                    'state'           => 'active',
                ];
            }
        } catch (Exception $e) {
            Log::error("SNMP getPppoeSessions error: " . $e->getMessage());
        }
        return $sessions;
    }

    /**
     * Get all interfaces with their counters
     */

    public function getInterfaces(): array
    {
        $interfaces = [];

        try {
            // Get basic interface data
            $ifDescs        = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_IF_DESC, $this->timeout, $this->retries);
            $ifNames        = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_IF_NAME, $this->timeout, $this->retries);
            $ifSpeeds       = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_IF_SPEED, $this->timeout, $this->retries);
            $ifHighSpeeds   = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_IF_HIGH_SPEED, $this->timeout, $this->retries);
            $ifAdminStatus  = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_IF_ADMIN_STATUS,  $this->timeout, $this->retries);
            $ifOperStatus   = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_IF_OPER_STATUS,   $this->timeout, $this->retries);
            $ifPhysAddr     = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_IF_PHYS_ADDR,     $this->timeout, $this->retries);
            $ifInOctets     = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_IF_HC_IN_OCTETS,  $this->timeout, $this->retries);
            $ifOutOctets    = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_IF_HC_OUT_OCTETS, $this->timeout, $this->retries);
            $ifInErrors     = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_IF_IN_ERRORS,     $this->timeout, $this->retries);
            $ifOutErrors    = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_IF_OUT_ERRORS,    $this->timeout, $this->retries);
            $ifInDiscards   = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_IF_IN_DISCARDS,   $this->timeout, $this->retries);
            $ifOutDiscards  = @snmpwalk($this->host . ':' . $this->port, $this->community, self::OID_IF_OUT_DISCARDS,  $this->timeout, $this->retries);

            if (!$ifDescs) return [];

            foreach ($ifDescs as $idx => $desc) {
                $ifIndex = $idx + 1;

                // Get speed: try highSpeed first (in Mbps), then ifSpeed (bps)
                $highSpeed = isset($ifHighSpeeds[$idx]) ? (int) $this->parseNumericValue($ifHighSpeeds[$idx]) : 0;
                $speed = $highSpeed > 0 ? $highSpeed * 1_000_000 : (int) ($ifSpeeds[$idx] ? $this->parseNumericValue($ifSpeeds[$idx]) : 0);

                // Status mapping
                $adminStatusMap = ['1' => 'up', '2' => 'down', '3' => 'testing'];
                $operStatusMap  = ['1' => 'up', '2' => 'down', '3' => 'testing', '4' => 'unknown', '5' => 'dormant'];

                $adminStatusRaw = isset($ifAdminStatus[$idx]) ? $this->parseNumericValue($ifAdminStatus[$idx]) : 2;
                $operStatusRaw  = isset($ifOperStatus[$idx]) ? $this->parseNumericValue($ifOperStatus[$idx]) : 2;

                $interfaces[] = [
                    'if_index'        => $ifIndex,
                    'if_name'         => isset($ifNames[$idx]) ? $this->parseValue($ifNames[$idx]) : $this->parseValue($desc),
                    'if_desc'         => $this->parseValue($desc),
                    'if_speed'        => $speed,
                    'if_admin_status' => $adminStatusMap[(string) $adminStatusRaw] ?? 'down',
                    'if_oper_status'  => $operStatusMap[(string) $operStatusRaw] ?? 'unknown',
                    'if_phys_address' => isset($ifPhysAddr[$idx]) ? $this->parseValue($ifPhysAddr[$idx]) : null,
                    'in_octets'       => isset($ifInOctets[$idx])   ? (int) $this->parseNumericValue($ifInOctets[$idx])   : 0,
                    'out_octets'      => isset($ifOutOctets[$idx])  ? (int) $this->parseNumericValue($ifOutOctets[$idx])  : 0,
                    'in_errors'       => isset($ifInErrors[$idx])   ? (int) $this->parseNumericValue($ifInErrors[$idx])   : 0,
                    'out_errors'      => isset($ifOutErrors[$idx])  ? (int) $this->parseNumericValue($ifOutErrors[$idx])  : 0,
                    'in_discards'     => isset($ifInDiscards[$idx]) ? (int) $this->parseNumericValue($ifInDiscards[$idx]) : 0,
                    'out_discards'    => isset($ifOutDiscards[$idx])? (int) $this->parseNumericValue($ifOutDiscards[$idx]): 0,
                ];
            }
        } catch (Exception $e) {
            Log::error("SNMP getInterfaces error for device {$this->device->id}: " . $e->getMessage());
        }

        return $interfaces;
    }

    /**
     * Parse SNMP value string like "STRING: value" or "INTEGER: 42"
     */
    private function parseValue(mixed $raw): string
    {
        if (!is_string($raw)) return (string) $raw;

        // Remove type prefix: "STRING: ", "INTEGER: ", "Gauge32: ", etc.
        if (preg_match('/^[A-Za-z0-9-]+:\s*(.+)$/', $raw, $matches)) {
            return trim($matches[1], '"');
        }

        return trim($raw, '"');
    }

    /**
     * Parse SNMP numeric value
     */
    private function parseNumericValue(mixed $raw): int|float
    {
        // First strip SNMP type prefix ("Gauge32: 12345" → "12345")
        $str = $this->parseValue((string) $raw);
        $str = trim($str);

        // Handle possible hex notation (e.g. "0x1F")
        if (str_starts_with(strtolower($str), '0x')) {
            return hexdec(substr($str, 2));
        }

        // Extract leading number (stop at first non-numeric char after digits/dot)
        if (preg_match('/^(\d+\.?\d*)/', $str, $m)) {
            return strpos($m[1], '.') !== false ? (float) $m[1] : (int) $m[1];
        }

        return 0;
    }
}
