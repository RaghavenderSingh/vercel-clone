import { Command } from 'commander';
import { login } from './commands/login';
import { deploy } from './commands/deploy';
import chalk from 'chalk';

const program = new Command();

program
  .name('titan')
  .description('Cliff-jumping into the cloud 🌩️')
  .version('0.0.1');

program
  .command('login')
  .description('Login to your Titan account')
  .action(login);

program
  .command('deploy')
  .description('Deploy the current directory')
  .action(deploy);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
