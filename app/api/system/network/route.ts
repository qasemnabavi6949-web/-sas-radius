import { NextResponse } from 'next/server';
import os from 'os';
import dns from 'dns';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';

const execAsync = util.promisify(exec);

export async function GET() {
  try {
    let mainIp = '';
    let subnet = '';
    let gateway = '';
    let dns1 = '';
    let dns2 = '';
    const interfaces: Record<string, string> = { method: 'nsenter' };

    try {
      // 1. Get default route from host to find the primary interface and gateway
      const { stdout: routeOut } = await execAsync("nsenter -t 1 -m -u -n -i -- ip -4 route show default");
      const gwMatch = routeOut.match(/default via (\S+)/);
      if (gwMatch) gateway = gwMatch[1] || '';
      
      const devMatch = routeOut.match(/dev (\S+)/);
      const dev = devMatch ? (devMatch[1] || '') : '';
      interfaces['main_device'] = dev;

      if (dev) {
        // 2. Get IP and subnet from the host interface
        const { stdout: ipOut } = await execAsync(`nsenter -t 1 -m -u -n -i -- ip -4 addr show ${dev}`);
        const ipMatch = ipOut.match(/inet (\d+\.\d+\.\d+\.\d+)\/(\d+)/);
        if (ipMatch) {
          mainIp = ipMatch[1] || '';
          const prefixMatch = ipMatch[2];
          if (prefixMatch) {
            const prefix = parseInt(prefixMatch, 10);
            const mask = 0xffffffff ^ ((1 << (32 - prefix)) - 1);
            subnet = [
              (mask >>> 24) & 0xff,
              (mask >>> 16) & 0xff,
              (mask >>> 8) & 0xff,
              mask & 0xff
            ].join('.');
          }
        }
      }

      // 3. Get DNS from host
      const { stdout: resolvOut } = await execAsync("nsenter -t 1 -m -u -n -i -- cat /etc/resolv.conf");
      const nameservers = resolvOut.match(/^nameserver\s+(\S+)/gm) || [];
      const parts0 = (nameservers[0] || '').split(/\s+/);
      if (parts0.length > 1) dns1 = parts0[1] || '';
      const parts1 = (nameservers[1] || '').split(/\s+/);
      if (parts1.length > 1) dns2 = parts1[1] || '';

    } catch {
      console.log("Failed to inspect host via nsenter, falling back");
      const intfs = os.networkInterfaces();
      for (const name of Object.keys(intfs)) {
        for (const iface of intfs[name] || []) {
          if (iface.family === 'IPv4' && !iface.internal) {
            mainIp = iface.address;
            subnet = iface.netmask;
            break;
          }
        }
        if (mainIp) break;
      }
      const dnsServers = dns.getServers();
      dns1 = dnsServers[0] || '';
      dns2 = dnsServers[1] || '';
      try {
        const { stdout } = await execAsync("ip route show default | awk '/default/ {print $3}'");
        gateway = stdout.trim();
      } catch {
        // Ignored
      }
    }

    return NextResponse.json({
      ip: mainIp,
      subnet,
      dns1,
      dns2,
      gateway,
      interfaces
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { ip, subnet, dns1, dns2, gateway } = await req.json();
    
    // Convert subnet to CIDR prefix length
    const prefix = subnet.split('.').reduce((a: number, b: string) => a + (parseInt(b) >>> 0).toString(2).split('1').length - 1, 0);
    const cidr = `${ip}/${prefix}`;

    // Get the host's primary interface name
    const { stdout: routeOut } = await execAsync("nsenter -t 1 -m -u -n -i -- ip -4 route show default");
    const devMatch = routeOut.match(/dev (\S+)/);
    const mainDev = devMatch ? devMatch[1] : 'eth0';

    const dnsList = [];
    if (dns1) dnsList.push(`"${dns1}"`);
    if (dns2) dnsList.push(`"${dns2}"`);
    const dnsLine = dnsList.length > 0 ? `[${dnsList.join(', ')}]` : '[]';

    // Build the yaml directly for netplan
    const netplanYaml = `network:
  version: 2
  renderer: networkd
  ethernets:
    ${mainDev}:
      dhcp4: false
      dhcp6: false
      addresses:
        - ${cidr}
      routes:
        - to: default
          via: ${gateway}
      nameservers:
        addresses: ${dnsLine}
`;

    const tmpPath = '/tmp/99-sas-network.yaml';
    fs.writeFileSync(tmpPath, netplanYaml);

    // Apply via nsenter
    // Copy the file to the host /etc/netplan/ and apply
    await execAsync(`nsenter -t 1 -m -u -n -i -- sh -c "cat > /etc/netplan/99-sas-network.yaml" < ${tmpPath}`);
    await execAsync(`nsenter -t 1 -m -u -n -i -- chmod 600 /etc/netplan/99-sas-network.yaml`);
    await execAsync(`nsenter -t 1 -m -u -n -i -- netplan apply`);

    return NextResponse.json({ success: true, message: 'Network settings applied! You will need to access the server at the new IP.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update Network Config: ' + error.message }, { status: 500 });
  }
}
