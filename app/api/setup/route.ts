export const dynamic = 'force-dynamic';

export async function GET() {
  const script = `#!/bin/bash
cd ~/radius-accounting-server1 || cd $(pwd)

echo "Cleaning up old configurations..."
sudo docker compose down 2>/dev/null
rm -rf freeradius-config docker-compose.yml Dockerfile.radius

echo "Creating FreeRADIUS SQL Config..."
mkdir -p freeradius-config
cat << 'EOF' > freeradius-config/sql
sql {
    driver = "rlm_sql_mysql"
    dialect = "mysql"
    server = "sas-radius-db"
    port = 3306
    login = "radius"
    password = "radpass"
    radius_db = "radius"
    read_clients = yes
    client_table = "nas"
    authcheck_table = "radcheck"
    authreply_table = "radreply"
    groupcheck_table = "radgroupcheck"
    groupreply_table = "radgroupreply"
    usergroup_table = "radusergroup"
    acct_table1 = "radacct"
    acct_table2 = "radacct"
    postauth_table = "radpostauth"
    group_attribute = "SQL-Group"
    pool {
        start = 5
        min = 4
        max = 50
        spare = 3
        uses = 0
        retry_delay = 30
        lifetime = 0
        idle_timeout = 60
    }
    $INCLUDE \${modconfdir}/\${.:name}/main/\${dialect}/queries.conf
}
EOF

echo "Creating FreeRADIUS Default Site Config..."
cat << 'EOF' > freeradius-config/default
server default {
    listen {
        type = auth
        ipaddr = *
        port = 0
        limit {
            max_connections = 16
            lifetime = 0
            idle_timeout = 30
        }
    }
    listen {
        ipaddr = *
        port = 0
        type = acct
    }
    authorize {
        filter_username
        preprocess
        chap
        mschap
        digest
        suffix
        sql
        expiration
        logintime
        pap
    }
    authenticate {
        Auth-Type PAP {
            pap
        }
        Auth-Type CHAP {
            chap
        }
        Auth-Type MS-CHAP {
            mschap
        }
        digest
    }
    accounting {
        detail
        unix
        radutmp
        sql
        exec
        attr_filter.accounting_response
    }
    session {
        radutmp
        sql
    }
    post-auth {
        sql
        exec
        remove_reply_message_if_eap
    }
}
EOF

echo "Creating Docker Compose file..."
cat << 'EOF' > docker-compose.yml
services:
  sas-radius-web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: sas-radius-app
    restart: unless-stopped
    ports:
      - "8080:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=sas-radius-db
      - DB_USER=radius
      - DB_PASSWORD=radpass
      - DB_NAME=radius
      - RADIUS_SECRET=testing123
    depends_on:
      - sas-radius-db

  sas-radius-db:
    image: mariadb:10.11
    container_name: sas-radius-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root_password_123
      MYSQL_DATABASE: radius
      MYSQL_USER: radius
      MYSQL_PASSWORD: radpass
    volumes:
      - db-data:/var/lib/mysql
    ports:
      - "3306:3306"

  sas-radius-core:
    image: freeradius/freeradius-server:latest
    container_name: sas-radius-core
    restart: unless-stopped
    ports:
      - "1812:1812/udp"
      - "1813:1813/udp"
    volumes:
      - ./freeradius-config/sql:/etc/freeradius/mods-available/sql
      - ./freeradius-config/sql:/etc/freeradius/mods-enabled/sql
      - ./freeradius-config/default:/etc/freeradius/sites-available/default
      - ./freeradius-config/default:/etc/freeradius/sites-enabled/default
    depends_on:
      - sas-radius-db

volumes:
  db-data:
EOF

echo "Starting containers..."
sudo docker compose up -d

echo ""
echo "======================================"
echo "Wait 5 seconds, then running logs:"
echo "======================================"
sleep 5
sudo docker logs sas-radius-core --tail 20
`;
  return new Response(script, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
