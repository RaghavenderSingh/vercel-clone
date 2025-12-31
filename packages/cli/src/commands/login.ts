import inquirer from 'inquirer';
import axios from 'axios';
import chalk from 'chalk';
import ora from 'ora';
import { setToken } from '../utils/config';

export async function login() {
  console.log(chalk.bold.blue('Welcome to Titan CLI 🚀'));
  console.log('To limit complexity for MVP, please:')
  console.log('1. Go to http://localhost:3000/settings/tokens');
  console.log('2. Create a new token.');
  console.log('3. Paste it below.\n');

  const { token } = await inquirer.prompt([
    {
      type: 'password',
      name: 'token',
      message: 'Paste your Personal Access Token:',
      mask: '*'
    }
  ]);

  const spinner = ora('Verifying token...').start();

  try {
    // Verify token with API
    // Note: We haven't built /api/user/me explicitly mostly, but assuming /api/projects works if auth is good
    // Or we can just trust it for now if we don't have a dedicated verification endpoint
    // Let's assume we have a simple health check or user endpoint. 
    // Actually, let's use the API_URL from env or default
    const API_URL = process.env.TITAN_API_URL || 'http://localhost:3000/api';
    
    // Attempt to fetch user projects as a validity check
    await axios.get(`${API_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    setToken(token);
    spinner.succeed(chalk.green('Recursively Authenticated! 🔓'));
    console.log(chalk.gray('Token saved to system keychain (via conf).'));

  } catch (error: any) {
    spinner.fail(chalk.red('Authentication failed.'));
    if (error.response) {
        console.error(chalk.red(`Error: ${error.response.status} - ${error.response.data?.message || 'Unknown'}`));
    } else {
        console.error(chalk.red(error.message));
    }
  }
}
