import fs from 'fs';
import path from 'path';
import axios from 'axios';
import chalk from 'chalk';
import ora from 'ora';
import AdmZip from 'adm-zip';
import FormData from 'form-data';
import { io } from 'socket.io-client';
import { getToken } from '../utils/config';

export async function deploy() {
  const token = getToken();
  if (!token) {
    console.error(chalk.red('Not authenticated. Please run `titan login` first.'));
    return;
  }

  const cwd = process.cwd();
  const folderName = path.basename(cwd);
  
  console.log(chalk.bold(`Deploying ${folderName}...`));

  // 1. Zip
  const spinner = ora('Compressing project...').start();
  const zip = new AdmZip();
  
  // Add files, ignoring node_modules and .git
  // For MVP, we'll just add the whole folder but using a filter function if adm-zip supports it nicely,
  // or we just manually walk. adm-zip addLocalFolder is recursive.
  // Limitation: addLocalFolder doesn't support filter easily in all versions.
  // Let's rely on server-side ignore or just be careful. 
  // BETTER: Use a explicit list of files or a smarter zipper.
  // FOR MVP: We will assume the user isn't deploying node_modules (or we let it upload, it's just slow).
  // Actually, let's try to exclude node_modules via addLocalFolder's filter regex if available, 
  // or just warn the user.
  // Warning: uploading node_modules is bad.
  
  // Implementation Note: adm-zip addLocalFolder(path, zipPath, filterRegExp)
  zip.addLocalFolder(cwd, undefined, (filename) => {
      // Return true to include
      if (filename.includes('node_modules') || filename.includes('.git') || filename.includes('.next')) return false;
      return true;
  });

  const zipBuffer = zip.toBuffer();
  spinner.succeed(`Compressed: ${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB`);

  // 2. Upload
  const uploadSpinner = ora('Uploading to Titan Cloud...').start();
  const API_URL = process.env.TITAN_API_URL || 'http://localhost:3000/api';

  try {
    const form = new FormData();
    form.append('file', zipBuffer, { filename: 'deployment.zip' });
    form.append('projectName', folderName); // Auto-create project with folder name

    const response = await axios.post(`${API_URL}/deploy`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      },
       maxContentLength: Infinity,
       maxBodyLength: Infinity
    });

    uploadSpinner.succeed('Uploaded successfully!');
    const { deploymentId, projectUrl } = response.data;

    console.log(chalk.green(`\n🚀 Deployment initiated: ${deploymentId}`));
    console.log(chalk.gray('Waiting for build logs...\n'));

    // 3. Stream Logs
    const socket = io('http://localhost:3000'); // Connect to API Server (which proxies log events or we connect to build worker directly? Previously build worker emitted to API. API emits to client.)

    socket.on('connect', () => {
        socket.emit('subscribe-deployment', deploymentId);
        console.log(chalk.gray(`Connected to deployment stream...`));
    });

    socket.on('deployment-log', (data: { deploymentId: string; log: string; timestamp: string }) => {
        if (data.deploymentId === deploymentId) {
            process.stdout.write(data.log);
        }
    });
    
    // Wait for completion (status update)
    socket.on('deployment-update', (data: any) => {
         if (data.deploymentId === deploymentId) {
             if (data.status === 'ready') {
                 console.log(chalk.bold.green('\n✅ Deployment Complete!'));
                 console.log(`🌍 Available at: ${projectUrl}`);
                 socket.disconnect();
                 process.exit(0);
             }
              if (data.status === 'error') {
                 console.log(chalk.bold.red('\n❌ Deployment Failed.'));
                 if (data.logs) {
                     console.log(chalk.red(data.logs));
                 }
                 socket.disconnect();
                 process.exit(1);
             }
         }
    });

  } catch (error: any) {
    uploadSpinner.fail('Upload failed.');
    if (error.response) {
        console.error(chalk.red(`Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`));
    } else {
        console.error(chalk.red(error.message));
    }
  }
}
