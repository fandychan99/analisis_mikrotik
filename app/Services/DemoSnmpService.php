<?php

namespace App\Services;

use App\Models\Device;

/**
 * Demo SNMP Service
 * Menghasilkan data simulasi realistis layaknya MikroTik sungguhan.
 * Digunakan ketika tidak ada perangkat SNMP fisik.
 */
class DemoSnmpService
{
    // State yang persisten antar panggilan menggunakan cache sederhana
    private static array $state = [];

    public function __construct(private Device $device) {}

    /**
     * Inisialisasi state awal untuk device ini (jika belum ada)
     */
    private function initState(): void
    {
        $key = 'device_' . $this->device->id;
        if (!isset(self::$state[$key])) {
            self::$state[$key] = [
                'cpu_base'        => mt_rand(10, 40),
                'cpu_spike_at'    => mt_rand(0, 30),
                'mem_used_mb'     => mt_rand(64, 128),
                'disk_used_mb'    => mt_rand(50, 200),
                'uptime_ticks'    => mt_rand(500000, 50000000),
                'if1_in'          => mt_rand(0, 1_000_000_000),
                'if1_out'         => mt_rand(0, 500_000_000),
                'if2_in'          => mt_rand(0, 2_000_000_000),
                'if2_out'         => mt_rand(0, 1_000_000_000),
                'tick'            => 0,
            ];
        }
        self::$state[$key]['tick']++;
    }

    private function &getState(): array
    {
        $key = 'device_' . $this->device->id;
        return self::$state[$key];
    }

    /**
     * Test koneksi — selalu sukses di mode demo
     */
    public function testConnection(): array
    {
        return [
            'success' => true,
            'message' => 'Mode Demo aktif — data disimulasi',
            'sysname' => 'MikroTik-Demo',
        ];
    }

    /**
     * System info simulasi
     */
    public function getSystemInfo(): array
    {
        $this->initState();
        $state = &$this->getState();

        // Uptime bertambah tiap poll (~30 detik = 3000 ticks)
        $state['uptime_ticks'] += 3000;

        return [
            'sys_descr'    => 'RouterOS v7.14.3 (MikroTik) — DEMO MODE',
            'sys_name'     => 'MikroTik-Demo-RB4011',
            'sys_contact'  => 'admin@demo.local',
            'sys_location' => 'Server Room - Demo',
            'uptime_seconds' => intval($state['uptime_ticks'] / 100),
            'uptime_ticks'   => $state['uptime_ticks'],
        ];
    }

    /**
     * CPU Load simulasi — fluktuasi realistis dengan occasional spike
     */
    public function getCpuLoad(): float
    {
        $this->initState();
        $state = &$this->getState();

        // Simulasi pola: baseline + noise + periodic spike
        $tick     = $state['tick'];
        $base     = $state['cpu_base'];
        $noise    = mt_rand(-8, 12);
        $spike    = (($tick % 20) < 3) ? mt_rand(20, 45) : 0; // spike tiap ~20 tick

        $cpu = max(2, min(98, $base + $noise + $spike));

        // Geser base sedikit biar tidak monoton
        $state['cpu_base'] = max(5, min(60, $state['cpu_base'] + mt_rand(-2, 2)));

        return round($cpu, 1);
    }

    /**
     * Memory simulasi — MikroTik RB4011 total 1GB
     */
    public function getMemoryInfo(): array
    {
        $this->initState();
        $state = &$this->getState();

        $totalMb = 1024; // 1 GB
        // Memory naik turun perlahan
        $state['mem_used_mb'] = max(64, min(900, $state['mem_used_mb'] + mt_rand(-5, 8)));
        $usedMb  = $state['mem_used_mb'];
        $freeMb  = $totalMb - $usedMb;
        $percent = round(($usedMb / $totalMb) * 100, 2);

        return [
            'total_mb'    => $totalMb,
            'used_mb'     => round($usedMb, 2),
            'free_mb'     => round($freeMb, 2),
            'total_bytes' => $totalMb * 1048576,
            'used_bytes'  => $usedMb * 1048576,
            'free_bytes'  => $freeMb * 1048576,
            'percent'     => $percent,
        ];
    }

    /**
     * Disk simulasi — MikroTik flash 512 MB
     */
    public function getDiskInfo(): array
    {
        $this->initState();
        $state = &$this->getState();

        $totalMb = 512;
        // Disk sangat lambat berubah
        if (mt_rand(0, 10) > 8) {
            $state['disk_used_mb'] = min(480, $state['disk_used_mb'] + mt_rand(0, 2));
        }
        $usedMb  = $state['disk_used_mb'];
        $freeMb  = $totalMb - $usedMb;
        $percent = round(($usedMb / $totalMb) * 100, 2);

        return [
            'total_mb'    => $totalMb,
            'used_mb'     => round($usedMb, 2),
            'free_mb'     => round($freeMb, 2),
            'total_bytes' => $totalMb * 1048576,
            'used_bytes'  => $usedMb * 1048576,
            'free_bytes'  => $freeMb * 1048576,
            'percent'     => $percent,
        ];
    }

    /**
     * Suhu simulasi — MikroTik RB4011 normal 40–60°C
     */
    public function getTemperature(): float
    {
        $this->initState();
        $state = &$this->getState();
        // Suhu relatif stabil, korelasi dengan CPU
        $cpuLoad = $this->getCpuLoad();
        $base    = 42 + ($cpuLoad * 0.15);
        $noise   = mt_rand(-2, 2);

        return round($base + $noise, 1);
    }

    /**
     * Tegangan simulasi — MikroTik RB4011 ~24V
     */
    public function getVoltage(): float
    {
        // Tegangan stabil dengan sedikit noise
        return round(24.0 + (mt_rand(-5, 5) / 10), 1);
    }

    /**
     * PPPoE sessions — tidak ada di mode demo
     */
    public function getPppoeSessions(): array
    {
        return [];
    }

    /**
     * Interface simulasi — 4 interface: ether1(WAN), ether2(LAN), wlan1, bridge1
     */
    public function getInterfaces(): array
    {
        $this->initState();
        $state = &$this->getState();

        // Simulasi traffic yang naik turun realistis
        // ether1 (WAN): ~5-50 Mbps down, ~1-10 Mbps up
        $wan_in_delta  = mt_rand(200_000, 6_250_000); // bytes per 30 detik
        $wan_out_delta = mt_rand(50_000, 1_250_000);
        $state['if1_in']  += $wan_in_delta;
        $state['if1_out'] += $wan_out_delta;

        // ether2 (LAN): ~1-20 Mbps
        $lan_in_delta  = mt_rand(100_000, 2_500_000);
        $lan_out_delta = mt_rand(200_000, 5_000_000);
        $state['if2_in']  += $lan_in_delta;
        $state['if2_out'] += $lan_out_delta;

        return [
            [
                'if_index'        => 1,
                'if_name'         => 'ether1',
                'if_desc'         => 'ether1 (WAN)',
                'if_speed'        => 1_000_000_000, // 1 Gbps
                'if_admin_status' => 'up',
                'if_oper_status'  => 'up',
                'if_phys_address' => '4C:5E:0C:01:02:03',
                'in_octets'       => $state['if1_in'],
                'out_octets'      => $state['if1_out'],
                'in_errors'       => 0,
                'out_errors'      => 0,
                'in_discards'     => 0,
                'out_discards'    => 0,
            ],
            [
                'if_index'        => 2,
                'if_name'         => 'ether2',
                'if_desc'         => 'ether2 (LAN)',
                'if_speed'        => 1_000_000_000,
                'if_admin_status' => 'up',
                'if_oper_status'  => 'up',
                'if_phys_address' => '4C:5E:0C:01:02:04',
                'in_octets'       => $state['if2_in'],
                'out_octets'      => $state['if2_out'],
                'in_errors'       => mt_rand(0, 2),
                'out_errors'      => 0,
                'in_discards'     => 0,
                'out_discards'    => 0,
            ],
            [
                'if_index'        => 3,
                'if_name'         => 'wlan1',
                'if_desc'         => 'wlan1 (WiFi 2.4GHz)',
                'if_speed'        => 300_000_000, // 300 Mbps
                'if_admin_status' => 'up',
                'if_oper_status'  => 'up',
                'if_phys_address' => '4C:5E:0C:01:02:05',
                'in_octets'       => mt_rand(10_000_000, 100_000_000),
                'out_octets'      => mt_rand(5_000_000, 50_000_000),
                'in_errors'       => 0,
                'out_errors'      => 0,
                'in_discards'     => 0,
                'out_discards'    => 0,
            ],
            [
                'if_index'        => 4,
                'if_name'         => 'bridge1',
                'if_desc'         => 'bridge1 (Bridge LAN)',
                'if_speed'        => 1_000_000_000,
                'if_admin_status' => 'up',
                'if_oper_status'  => 'up',
                'if_phys_address' => '4C:5E:0C:01:02:06',
                'in_octets'       => mt_rand(1_000_000, 10_000_000),
                'out_octets'      => mt_rand(500_000, 5_000_000),
                'in_errors'       => 0,
                'out_errors'      => 0,
                'in_discards'     => 0,
                'out_discards'    => 0,
            ],
            [
                'if_index'        => 5,
                'if_name'         => 'lo0',
                'if_desc'         => 'lo0 (Loopback)',
                'if_speed'        => 0,
                'if_admin_status' => 'up',
                'if_oper_status'  => 'up',
                'if_phys_address' => null,
                'in_octets'       => 0,
                'out_octets'      => 0,
                'in_errors'       => 0,
                'out_errors'      => 0,
                'in_discards'     => 0,
                'out_discards'    => 0,
            ],
        ];
    }
}
