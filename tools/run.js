const utils = require('./utils.js');
const fs = require('fs')
const chalk = require('chalk')
const shell = require('shelljs')
const config = require('../package.json')
const _ = require('lodash')
const inquirer = require('inquirer');
const waitOn = require('wait-on');

// run options, set up in specific order so we can compare to make sure we don't show unavailable options
const runModes = {
  webServer: { name: 'web, server', value: ['web', 'server'] },
  mobileServer: { name: 'mobile, server', value: ['mobile', 'server'] },
  webOnly: { name: 'web only', value: ['web'] },
  mobileOnly: { name: 'mobile only', value: ['mobile'] },
  serverOnly: { name: 'server only', value: ['server'] }
}

module.exports = async function (program) {
  // check node version
  const nodeVersion = process.version;
  const majorVersion = Number(nodeVersion.split('.')[0].replace('v', ''));
  if(majorVersion < 16) {
    console.log(chalk.bgRed('     Error: Yote requires Node v16 (though higher versions may work). Please upgrade your version of Node.'));
    console.log(chalk.bgRed('     Your version: ', nodeVersion));
    shell.exit(1);
  }
  // get the yote version and check it against the cli version
  const yoteVersion = utils.getYoteVersion();
  const cliVersion = config.version;
  if(!yoteVersion) {
    console.log(chalk.bgRed('     Error: No yote-project.json file present! Please make sure you are in the project top-level directory and that you have initialized the project correctly.'));
    shell.exit(1);
  }
  // not backwards compatible with older versions of yote (but the run command never worked in those versions anyway?)
  if(yoteVersion !== cliVersion) {
    console.log(chalk.bgRed(`     Error: Your installed version of Yote CLI (${cliVersion}) is not compatible with this version of Yote (v${yoteVersion}). To find older versions of the Yote CLI, please visit: https://github.com/fugitivelabs/yote-cli`));
    shell.exit(1);
  }
  // get the project name
  const projectName = utils.getProjectName();
  
  program
    .command("run")
    .alias("R")
    // these options are deprecated in favor of using prompts to select the run mode
    // .option('-a', '--all', 'run everything')
    // .option('-m', '--mobile', 'run ios simulator')
    // .option('-w', '--web', 'run web client')
    // .option('-s', '--server', 'run yote server')
    // .option('-t', '--tabs', 'run in new tabs')
    .on('--help', () => {
      console.log('   To add a new resource to the Yote app')
      console.log(chalk.green('     $ yote A <resourceName>'));
      console.log(chalk.dim('     # OR'))
      console.log(chalk.green('     $ yote add <resourceName>\n'));
      console.log('   Examples:\n');
      console.log('    $ yote add myResource');
      console.log('    $ yote A myResource\n');
      console.log(chalk.bgRed('   NOTE: singular, camelcase names work best, like `product` or `book`\n\n'));
    })
    .action(run)

  async function run(options) {
    // check for required global modules
    if(!shell.which('ttab')) {
      // give them the option to install ttab
      const { confirmInstallTtab } = await inquirer.prompt([
        {
          type: 'confirm'
          , name: 'confirmInstallTtab'
          , message: "Yote run requires `ttab`, would you like to install it now?"
        }
      ]);
      if(confirmInstallTtab) {
        console.log(chalk.cyan('     Installing ttab... NOTE: you may need to enter your password.'));
        const installTtabProcess = shell.exec('npm install -g ttab');
        if(installTtabProcess.code !== 0) {
          console.log(chalk.bgRed('     Error: ttab install failed'));
          console.log(chalk.bgRed('     Error message: ', installTtabProcess.stderr));
          shell.exit(1);
        } else {
          console.log(chalk.bgGreen('     ttab installed successfully!'));
        }
      } else {
        console.log(chalk.bgRed('     Cancelled: Yote run requires ttab. Please install it by running\n`npm install -g ttab` then try again.'));
        shell.exit(1);
      }
    }
    // ttab is installed, let's go
    console.log("Running Yote project: " + projectName);
    const allOptions = [];
    if(utils.checkIfExists('./web')) {
      allOptions.push('web');
    }
    if(utils.checkIfExists('./mobile')) {
      allOptions.push('mobile');
    }
    if(utils.checkIfExists('./server')) {
      allOptions.push('server');
    }
    if(allOptions.length === 0) {
      console.log(chalk.bgRed('     Error: No Yote modules found! Please make sure you are in the project top-level directory and that you have initialized the project correctly.'));
      shell.exit(1);
    }

    const validOptions = [
      { name: `all (${allOptions.join(', ')})`, value: allOptions }
    ]

    const addValidOption = (option) => {
      if(!_.isEqual(option.value, validOptions[0].value)) {
        validOptions.push(option);
      }
    }

    if(allOptions.includes('server')) {
      if(allOptions.includes('web')) {
        addValidOption(runModes.webServer);
        addValidOption(runModes.webOnly);
      }
      if(allOptions.includes('mobile')) {
        addValidOption(runModes.mobileServer);
        addValidOption(runModes.mobileOnly);
      }
      addValidOption(runModes.serverOnly);
    }

    // determine what we need to install/remove
    const { runOptions } = await inquirer.prompt([
      {
        type: 'list',
        name: 'runOptions',
        message: "What would you like to run?",
        choices: validOptions
      }
    ]);
    const { confirmInstallDependencies } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmInstallDependencies',
        message: "Would you like to install dependencies?"
      }
    ]);
    const tabCmd = 'ttab -w'; // no options for now, but we could use `ttab` to open in a new tab instead of a new window, but I've found that to be buggy
    console.log(chalk.cyan('      Run: '), chalk.bgCyan(' ' + runOptions.join(', ') + '\n'));
    if(runOptions.includes('web')) {
      startWeb({tabCmd: `${tabCmd} -t "${projectName} Web"`, runInstallCmd: confirmInstallDependencies});
      if(runOptions.includes('server')) {
        // wait for web to build the dist folder
        waitOn({ resources: ['./web/dist/index.html'] }, (err) =>  {
          if(err) {
            console.log(chalk.bgRed('     Error: There was a problem waiting for the web client to build.'));
            console.log(chalk.bgRed('   Error message: ', err));
          }
          // now that the web client is built, we can run the server
          startServer({tabCmd: `${tabCmd} -t "${projectName} Server"`, runInstallCmd: confirmInstallDependencies});
        });
      }  
      const webUrl = utils.getDevelopmentUrl();
      // wait for the server to start (meaning webUrl is available)
      waitOn({ resources: [webUrl] }, (err) =>  {
        if(err) {
          console.log(chalk.bgRed('     Error: There was a problem waiting for the server to start.'));
          console.log(chalk.bgRed('   Error message: ', err));
        }
        // finally with the server started, we can open the web browser
        console.log(chalk.cyan('     Opening web browser at: '), chalk.bgCyan(' ' + webUrl + ' '))
        // NOTE: the `open` package no longer supports the `require` syntax, so we'll use dynamic import
        import('open').then(open => open.default(webUrl)).catch(err => {
          console.log(chalk.bgRed('     Error: There was a problem opening the web browser.'));
          console.log(chalk.bgRed('   Error message: ', err));
        });
      });
    } else {
      // if we're not running the web client, we can run the server immediately
      if(runOptions.includes('server')) {
        startServer({tabCmd: `${tabCmd} -t "${projectName} Server"`, runInstallCmd: confirmInstallDependencies});
      }
      if(runOptions.includes('mobile')) {
        startMobile({tabCmd: `${tabCmd} -t "${projectName} Mobile"`, runInstallCmd: confirmInstallDependencies});
      }
    }

  }
}


const startServer = async ({tabCmd = 'ttab', runInstallCmd}) => {
  console.log(chalk.cyan('     Starting server at: '), chalk.bgCyan(' `./server`'));
  if(utils.checkIfExists('./server')) {
    const serverPort = utils.getDevServerPort();
    console.log(chalk.cyan('     Starting server at port: '), chalk.bgCyan(' ' + serverPort + ' '));
    if (runInstallCmd) {
      // rm existing node_modules
      console.log(chalk.cyan('     Removing existing node_modules...'));
      shell.rm('-rf', './server/node_modules');
      console.log(chalk.cyan('     Installing server dependencies...'));
      const serverInstall = utils.getServerInstallScript();
      shell.exec(serverInstall, { cwd: './server' });
    }
    waitOn({ resources: ['./web/dist/index.html'] }, (err) =>  {
      if(err) {
        console.log(chalk.bgRed('     Error: There was a problem waiting for the web client to build.'));
        console.log(chalk.bgRed('   Error message: ', err));
      }
      // now that the web client is built, we can run the server, we have to wait for web to build otherwise we may have no dist folder to serve
      const runServerOperation = shell.exec(`${tabCmd} -d ./server nodemon`);
      if(runServerOperation.code !== 0) {
        console.log(chalk.bgRed('     Error: There was a problem running the server.'));
        console.log(chalk.bgRed('   Error message: ', runServerOperation.stderr));
        shell.exit(1);
      } else {
        console.log(chalk.cyan('     Server started successfully'));
        return runServerOperation;
      }
    });
  } else {
    console.log(chalk.red('     No `server` directory found. Please run `yote init [project]` first.'));
    shell.exit(1);
  }
}

const startWeb = async ({ tabCmd = 'ttab', runInstallCmd }) => {
  if(utils.checkIfExists('./web')) {
    console.log(chalk.cyan('     Starting web client at: '), chalk.bgCyan(' `./web`'));
    if(runInstallCmd) {
      // rm existing node_modules
      console.log(chalk.cyan('     Removing existing node_modules...'));
      shell.rm('-rf', './web/node_modules');
      console.log(chalk.cyan('     Installing web client dependencies...'));
      const webInstall = utils.getWebInstallScript();
      shell.exec(webInstall, {cwd: './web'});
    }
    const runWebOperation = shell.exec(`${tabCmd} -d ./web npm run start`);
    if(runWebOperation.code !== 0) {
      console.log(chalk.bgRed('     Error: There was a problem running the web client.'));
      console.log(chalk.bgRed('   Error message: ', runWebOperation.stderr));
      shell.exit(1);
    }
    console.log(chalk.cyan('     Web client build successful'));
    return runWebOperation;
  } else {
    console.log(chalk.red('     No `web` directory found. Please run `yote init [project]` first.'));
    shell.exit(1);
  }
}

const startMobile = async ({tabCmd = 'ttab', runInstallCmd}) => {
  if(utils.checkIfExists('./mobile')) {
    const mobileProjectName = utils.getYoteMobileProjectName();
    console.log(chalk.cyan('     Running mobile project: '), chalk.bgCyan(' ' + mobileProjectName + ' '));
    if(runInstallCmd) {
      // rm existing node_modules
      console.log(chalk.cyan('     Removing existing node_modules...'));
      shell.rm('-rf', './mobile/node_modules');
      console.log(chalk.cyan('     Installing mobile client dependencies...'));
      const mobileInstall = utils.getMobileInstallScript();
      shell.exec(mobileInstall, {cwd: './mobile'});
    }
    shell.exec(`${tabCmd} -d mobile/${mobileProjectName} npm start`);
    shell.exec(`${tabCmd} -d mobile/${mobileProjectName} react-native run-ios`);
    return;
  } else {
    console.log(chalk.red('     No `mobile` directory found. Please run `yote init [project]` first.'));
    shell.exit(1);
  }
}