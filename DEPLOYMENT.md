# Deployment Guide

This document outlines the steps to deploy the Titan platform to Amazon Web Services (AWS) using Docker Compose on an EC2 instance.

## Prerequisites

1.  **AWS Account**: Access to the AWS Console.
2.  **Domain Name**: A domain managed by Route53 or another registrar (referred to as `yourdomain.com`).
3.  **AWS CLI**: Installed and configured locally (optional, for S3 setup).

## Infrastructure Setup

### 1. S3 Bucket
Create an S3 bucket to store deployment artifacts (e.g., `titan-artifacts-prod`).
*   **Region**: Same as your EC2 instance (e.g., `us-east-1`).
*   **Permissions**: Ensure the IAM user provided to the application has `s3:PutObject`, `s3:GetObject`, and `s3:ListBucket` permissions.

### 2. EC2 Instance
Launch an EC2 instance to host the platform.
*   **AMI**: Ubuntu Server 22.04 LTS (HVM).
*   **Instance Type**: `t3.medium` or larger (build processes are CPU intensive).
*   **Storage**: At least 30GB gp3 root volume.
*   **Security Group**:
    *   Allow SSH (22) from your IP.
    *   Allow HTTP (80) from Anywhere (0.0.0.0/0).
    *   Allow HTTPS (443) from Anywhere (0.0.0.0/0).

### 3. DNS Configuration
Point your domain to the EC2 instance's Public IP.
*   `A Record`: `yourdomain.com` -> `<EC2_PUBLIC_IP>`
*   `A Record`: `*.yourdomain.com` -> `<EC2_PUBLIC_IP>`

## Server Configuration

SSH into your EC2 instance:
```bash
ssh -i key.pem ubuntu@<EC2_PUBLIC_IP>
```

### 1. Install Docker & Docker Compose
Updates the package index and installs the necessary runtime environment.

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo mkdir -m 0755 -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Enable non-root Docker execution
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Deploy Application

Clone the repository and prepare the configuration.

```bash
git clone <YOUR_REPO_URL> titan
cd titan
```

Create the production environment file:
```bash
cp .env.example .env
nano .env
```

**Required Variables**:
*   `POSTGRES_PASSWORD`: Secure password for the database.
*   `JWT_SECRET`: Random string for ensuring secure sessions.
*   `NEXTAUTH_SECRET`: Random string for storage encryption.
*   `S3_BUCKET`: The name of the S3 bucket created earlier.
*   `AWS_ACCESS_KEY_ID`: IAM User Access Key.
*   `AWS_SECRET_ACCESS_KEY`: IAM User Secret Key.
*   `DOMAIN_NAME`: Your actual domain (e.g., `example.com`).

**Update Nginx Configuration**:
Edit `nginx/nginx.conf` to replace `titan.com` with your actual domain name.

```bash
nano nginx/nginx.conf
```

### 3. Start Services

Launch the application stack in detached mode.

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 4. Verification

*   Visit `http://yourdomain.com` to access the Dashboard.
*   Visit `http://api.yourdomain.com/health` to verify the API status.

## Troubleshooting

**View Logs**:
```bash
docker compose -f docker-compose.prod.yml logs -f
```

**Restart Services**:
```bash
docker compose -f docker-compose.prod.yml restart
```

**Database Access**:
```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d vercel_clone
```
