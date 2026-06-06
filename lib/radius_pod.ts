import { query } from '@/lib/db';
import dgram from 'dgram';
// @ts-expect-error - no types for radius
import radius from 'radius';

export async function disconnectUserFromNas(username: string) {
  // Find active sessions for the user to disconnect
  const sessions: any = await query(`
    SELECT radacctid, acctsessionid, nasipaddress, framedipaddress 
    FROM radacct 
    WHERE username = ? AND (acctstoptime IS NULL OR acctstoptime = '0000-00-00 00:00:00' OR acctterminatecause = '')
  `, [username]);

  for (const session of sessions) {
    if (!session.nasipaddress) continue;

    // Find NAS config to get secret and coaPort
    const nasList: any = await query(`
      SELECT secret, coaPort FROM dashboard_nas WHERE ip = ? LIMIT 1
    `, [session.nasipaddress]);
    
    let secret = 'secret'; // default fallback
    let coaPort = 3799;

    if (nasList && nasList.length > 0) {
      secret = nasList[0].secret;
      coaPort = parseInt(nasList[0].coaPort) || 3799;
    } else {
      // Fallback to nas table
      const radNasList: any = await query(`
        SELECT secret FROM nas WHERE nasname = ? LIMIT 1
      `, [session.nasipaddress]);
      if (radNasList && radNasList.length > 0) {
        secret = radNasList[0].secret;
      }
    }

    // Send Disconnect-Request (PoD)
    try {
      const attributes: any[] = [
        ['User-Name', username]
      ];
      if (session.acctsessionid) {
        attributes.push(['Acct-Session-Id', session.acctsessionid]);
      }
      if (session.framedipaddress) {
        attributes.push(['Framed-IP-Address', session.framedipaddress]);
      }

      const packet = radius.encode({
        code: 'Disconnect-Request',
        secret: secret,
        attributes: attributes
      });

      await new Promise((resolve) => {
        const client = dgram.createSocket('udp4');
        let resolved = false;

        const timeout = setTimeout(() => {
           if (resolved) return;
           resolved = true;
           console.log(`PoD request to ${session.nasipaddress}:${coaPort} timed out for user ${username}`);
           try { client.close(); } catch {}
           resolve(false);
        }, 3000);
        
        client.on('message', (msg, rinfo) => {
           if (resolved) return;
           resolved = true;
           clearTimeout(timeout);
           try {
              const response = radius.decode({ packet: msg, secret: secret });
              console.log(`Received ${response.code} from NAS ${rinfo.address}`);
           } catch {
              console.log('Failed to decode radius response from NAS');
           }
           try { client.close(); } catch {}
           resolve(true);
        });
        
        client.on('error', (err) => {
           if (resolved) return;
           resolved = true;
           clearTimeout(timeout);
           console.error('Socket error:', err);
           try { client.close(); } catch {}
           resolve(false);
        });

        client.send(packet, 0, packet.length, coaPort, session.nasipaddress, (err) => {
          if (err) {
             if (resolved) return;
             resolved = true;
             clearTimeout(timeout);
             console.error(`Failed to send PoD to ${session.nasipaddress}:`, err);
             try { client.close(); } catch {}
             resolve(false);
          }
        });
      });
    } catch (e) {
      console.error('Radius PoD error:', e);
    }
  }
}
