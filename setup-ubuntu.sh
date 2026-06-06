#!/bin/bash

# Exit on error
set -e

echo "============================================="
echo " SAS RADIUS Dashboard - Ubuntu Setup Script"
echo "============================================="

# Ensure script is run as root
if [ "$EUID" -ne 0 ]
  then echo "Please run as root (sudo ./setup-ubuntu.sh)"
  exit
fi

echo "1. System Update..."
apt-get update -y

echo "2. Installing Docker & Docker Compose..."
if ! command -v docker &> /dev/null
then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo "Docker is already installed."
fi

# Ensure docker-compose is available (Docker v2 includes `docker compose`)
echo "Checking Docker Compose functionality..."
docker compose version

echo "3. Building and Starting Application..."
# Bring down any existing containers
docker compose down || true

# Build and start up detached
docker compose up -d --build

echo "============================================="
echo " Deployment Successful! "
echo " Your application is now running on Port 80."
echo " Access it via: http://<YOUR_SERVER_IP>/"
echo " To view logs, run: docker compose logs -f"
echo "============================================="
