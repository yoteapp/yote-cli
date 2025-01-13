const _ = require('lodash');
const chalk = require('chalk');
// const config = require('../../package.json');
const shell = require('shelljs');
const utils = require('../../tools/utils.js');
const inquirer = require('inquirer');

let spinner = null;

module.exports = async function (appName, options) {
  // first make sure we are using node 16
  const nodeVersion = process.version;
  const majorVersion = Number(nodeVersion.split('.')[0].replace('v', ''));
  if(majorVersion < 16) {
    console.log(chalk.bgRed('     Error: Yote requires Node v16 (though higher versions may work). Please upgrade your version of Node.'));
    console.log(chalk.bgRed('     Your version: ', nodeVersion));
    shell.exit(1);
  }
  if(!shell.which('git')) {
    console.log(chalk.bgRed('     Error: Yote requires git. Please install it.'));
    shell.exit(1);
  }
  appName = _.camelCase(appName); // normalize the app name
  const PascalName = utils.capitalizeFirstLetter(appName);
  console.log(chalk.cyan("     Initializing a new Yote app called: "));
  console.log();
  console.log(chalk.bgGreen('     ', appName));

  // determine what we need to install/remove
  const { installOptions } = await inquirer.prompt([
    {
      type: 'list',
      name: 'installOptions',
      message: `Which parts of Yote do you need for ${appName}?`,
      choices: [
        { name: 'Web, Server, Mobile', value: ['web', 'server', 'mobile'] },
        { name: 'Web, Server', value: ['web', 'server'] },
        { name: 'Mobile, Server', value: ['mobile', 'server'] }
      ]
    }
  ]);

  if(installOptions.includes('mobile')) {
    if(!shell.which('react-native')) {
      // Their dev environment is not set up for react-native
      // Can't automate this (too complex), so just give them the link to the docs
      console.log(chalk.bgRed('     Error: Yote mobile requires react-native and related tools. Please set up up your dev environment and then try again.\nThe install docs are here: https://reactnative.dev/docs/environment-setup?guide=native '));
      shell.exit(1);
    }
    if(!shell.which('pod')) {
      // give them the option to install cocoapods here
      const { confirmInstallCocoapods } = await inquirer.prompt([
        {
          type: 'confirm'
          , name: 'confirmInstallCocoapods'
          , message: "Yote mobile requires cocoapods, would you like to install it now?"
        }
      ]);
      if(confirmInstallCocoapods) {
        console.log(chalk.cyan('     Installing cocoapods... NOTE: you may need to enter your password.'));
        // shell.exec('sudo gem install cocoapods');
        const installPodsProcess = shell.exec('sudo gem install cocoapods');
        if(installPodsProcess.code !== 0) {
          console.log(chalk.bgRed('     Error: Cocoapods install failed'));
          console.log(chalk.bgRed('     Error message: ', installPodsProcess.stderr));
          shell.exit(1);
        } else {
          console.log(chalk.bgGreen('     Cocoapods installed successfully!'));
        }
      } else {
        console.log(chalk.bgRed('     Yote init cancelled: Yote mobile requires cocoapods. Please install cocoapods by running `sudo gem install cocoapods` and try again.'));
        shell.exit(1);
      }
    }
  }
  console.log();
  console.log(chalk.bgCyan('     We are installing: '), chalk.bgCyan(installOptions));
  console.log();
  console.log();
  console.log(chalk.cyan('////////////////////////////////////////////////////////'));
  console.log();
  console.log(chalk.bgCyan('     Cloning the Yote repository... '))
  console.log()
  console.log(chalk.cyan('////////////////////////////////////////////////////////'));
  console.log();


  /**
   * doing it this way sets fugitivelabs/yote.git as the upstream master and
   * allows the user to pull from the upstream remote
   */

  // when testing a specific branch of yote, uncomment the following lines and assign the branch
  // const branch = "my-special-branch";
  const branch = "main";
  const cloneRepoOperation = shell.exec(`git clone -b ${branch} --single-branch https://github.com/yoteApp/yote.git ${appName}`);
  if(cloneRepoOperation.code !== 0) {
    console.log(chalk.bgRed('     Error: Git clone failed'));
    console.log(chalk.bgRed('     Error message: ', cloneRepoOperation.stderr));
    shell.exit(1);
  }
  //
  // // production init pull from master
  // shell.exec(`git clone https://github.com/fugitivelabs/yote.git ${appName}`);


  // spinner.stop();
  console.log();
  console.log(chalk.magenta('////////////////////////////////////////////////////////'));
  console.log();
  console.log(chalk.bgMagenta("     Finished cloning Yote "))
  console.log();
  console.log(chalk.magenta('////////////////////////////////////////////////////////'));
  console.log();
  shell.cd(appName);

  // set the repo with a clean origin
  shell.exec('git remote rename origin upstream');
  // remove the upstream master to unlink yote master repo
  // shell.exec('git remote rm upstream');


  /**
   * Initialize Yote Server
   */
  //if NOT server, remove that folder, else npm install
  if(!installOptions.includes('server')) {
    console.log();
    console.log();
    console.log(chalk.cyan("     Removing Yote Server boilerplate for " + appName));
    console.log(chalk.cyan("     This may take a little while..."));
    console.log();
    console.log();
    shell.exec("rm -rf ./server");
  } else {
    console.log();
    console.log();
    console.log(chalk.cyan('////////////////////////////////////////////////////////'));
    console.log();
    console.log(chalk.bgCyan("     Initilizing Yote Server for " + appName));
    console.log(chalk.bgCyan("     This may take a little while..."));
    console.log();
    // spinner = new Spinner('     installing... ');
    // spinner.setSpinnerString(19);
    // spinner.start();
    console.log(chalk.cyan('////////////////////////////////////////////////////////'));
    console.log();
    shell.cd("server");
    shell.sed('-i', `yote`, appName, [`./config/default.js`, `./config/development.js`, `./config/staging.js`, `./config/production.js`, `./package.json`]);
    shell.sed('-i', `3.0.0`, `1.0.0`, [`./package.json`]);
    shell.exec('npm install');
    // spinner.stop();
    console.log(chalk.magenta('////////////////////////////////////////////////////////'));
    console.log();
    console.log(chalk.bgMagenta("     Finished with " + appName + " Server "))
    console.log();
    console.log(chalk.magenta('////////////////////////////////////////////////////////'));
    console.log();
    console.log();
    console.log();
    console.log(chalk.cyan('////////////////////////////////////////////////////////'));
    console.log();
    console.log(chalk.bgCyan("     Copying a new secrets.js file in for the server."));
    console.log();
    console.log(chalk.bgRed("   NOTE: Please change your secrets file from the defaults!    "));
    console.log();
    console.log(chalk.cyan('////////////////////////////////////////////////////////'));
    console.log();
    console.log();
    shell.exec("cp ./config/secrets-sample.js ./config/secrets.js");
    shell.cd("..");
    console.log(chalk.magenta('////////////////////////////////////////////////////////'));
    console.log();
    console.log(chalk.bgMagenta("     Finished with Secrets "))
    console.log();
    console.log(chalk.magenta('////////////////////////////////////////////////////////'));
    console.log();
  }

  /**
   * Initialize Yote Web Client
   */
  if(!installOptions.includes('web')) {
    console.log();
    console.log();
    console.log(chalk.cyan('////////////////////////////////////////////////////////'));
    console.log();
    console.log(chalk.bgCyan("     Removing Yote Web boilerplate for " + appName));
    console.log(chalk.bgC("     This may take a little while..."));
    console.log();
    console.log(chalk.cyan('////////////////////////////////////////////////////////'));
    console.log();
    shell.exec("rm -rf ./web");
  } else {
    console.log();
    console.log();
    console.log(chalk.cyan('////////////////////////////////////////////////////////'));
    console.log();
    console.log(chalk.bgCyan("     Initializing Yote web for " + appName + ". "));
    console.log(chalk.bgCyan("     This may take a little while..."));
    console.log();
    console.log(chalk.cyan('////////////////////////////////////////////////////////'));
    console.log();
    console.log();
    shell.cd("web");
    // update the package.json with the new app name
    const kebabName = _.kebabCase(appName);
    shell.sed('-i', `yote-web`, `${kebabName}-web`, [`./package.json`]);
    shell.sed('-i', `3.0.0`, `1.0.0`, [`./package.json`]);
    // update DefaultLayout.jsx, UserLayout.jsx, manifest.json, Landing.jsx with the new app name
    shell.sed('-i', /Yote/g, PascalName, [`./src/global/components/layouts/DefaultLayout.jsx`, `./src/resources/user/components/UserLayout.jsx`, `./public/manifest.json`, `./public/index.html`, `./src/global/components/landing/Landing.jsx`]);
    shell.exec('npm install');
    shell.cd("..");
    console.log(chalk.magenta('////////////////////////////////////////////////////////'));
    console.log();
    console.log(chalk.bgMagenta("     Finished with " + appName + " Web "));
    console.log();
    console.log(chalk.magenta('////////////////////////////////////////////////////////'));
    console.log();
  }

  /**
   * Initialize Yote Mobile
   */
  if(!installOptions.includes('mobile')) {
    console.log(chalk.cyan('////////////////////////////////////////////////////////'));
    console.log();
    console.log(chalk.bgCyan("     Removing Yote Mobile boilerplate for " + appName));
    console.log(chalk.bgCyan("     This may take a little while..."));
    console.log();
    console.log(chalk.cyan('////////////////////////////////////////////////////////'));
    shell.exec("rm -rf ./mobile");
  } else {
    console.log();
    console.log();
    console.log(chalk.cyan('////////////////////////////////////////////////////////'));
    console.log();
    console.log(chalk.bgCyan("     Initializing Yote mobile for " + appName));
    console.log(chalk.bgCyan("     This may take a little while..."));
    console.log();
    console.log(chalk.cyan('////////////////////////////////////////////////////////'));
    console.log();
    console.log();
    shell.cd("mobile");
    console.log('init react native')
    shell.exec("react-native init --version='0.66.1' " + PascalName);
    shell.sed('-i', 'Yote', PascalName, `./Yote/index.js`);
    shell.rm(`./${PascalName}/App.js`);
    shell.cp('-f', [`./Yote/index.js`, `./Yote/package.json`, `./Yote/App.js`], `./${PascalName}/`);
    console.log('copy js directory');
    utils.mkdir(`./${PascalName}/js/`);
    // NOTE This now breaks in new version of shelljs ...
    shell.cp('-Rf', `./Yote/js/*`, `./${PascalName}/js`);
    // shell.cp('-Rf', `./Yote/js/global/`, `./${PascalName}/js/global`);
    shell.sed('-i', 'Yote', PascalName, '../yote-project.json');
    // shell.mv(`./${PascalName}/js/YoteApp.js`, `./${PascalName}/js/${PascalName}App.js`);
    shell.rm('-rf', './Yote');
    shell.cd(PascalName);
    console.log('run npm install');
    shell.exec('npm install');
    console.log('install cocoa pods for ios');
    shell.cd("ios");
    shell.exec('pod install');
    shell.cd('..');
    console.log();
    console.log();
    console.log(chalk.magenta('////////////////////////////////////////////////////////'));
    console.log();
    console.log(chalk.bgMagenta("     Finished creating " + appName + " mobile web "))
    console.log();
    console.log(chalk.magenta('////////////////////////////////////////////////////////'));
    console.log();
    shell.cd("..");
  }

  console.log('');
  console.log(chalk.bgCyan("        Success!        "));
  console.log('');
  console.log(chalk.green("     Now you're ready to run " + appName));
  console.log('');
  console.log(chalk.green("     To run " + appName + ":"));
  console.log(chalk.bgGreen("         $ cd " + appName));
  console.log(chalk.bgGreen("         $ yote run"));
  console.log('');
  console.log(chalk.magenta("     To setup your github repository:"));
  console.log('');
  console.log(chalk.magenta("         - Create a repository on https://github.com"));
  console.log(chalk.magenta("         - Copy the respository URL "));
  console.log(chalk.magenta("         - $ cd " + appName));
  console.log(chalk.magenta("         - $ git remote add origin [repository URL]"));
  console.log('');
  console.log(chalk.magenta("     Then you're good to go."))
  // --------------------------------------------------

}
