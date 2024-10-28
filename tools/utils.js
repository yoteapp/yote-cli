let _ = require('lodash');
let chalk = require('chalk');
let fs = require('fs');
let pluralize = require('pluralize');
let shell = require('shelljs');

exports.getYoteVersion = () => {
  const yoteProjectExists = exports.checkIfExists('./yote-project.json');
  if(yoteProjectExists) {
    const yoteProject = JSON.parse(fs.readFileSync('./yote-project.json', 'utf8'));
    if(yoteProject['yote-version']) {
      console.log("VERSION: " + yoteProject['yote-version']);
      return yoteProject['yote-version'];
    } else {
      // console.log('No yote version found. Defaulting to 3.0.0')
      return '3.0.0'
    }
  } else {
    return '3.0.0'
  }
}

exports.getYoteMobileProjectName = () => {
  const yoteProject = JSON.parse(fs.readFileSync('./yote-project.json', 'utf8'));
  console.log("MOBILE APP NAME: " + yoteProject['yote-mobile-project-name']);
  return yoteProject['yote-mobile-project-name'];
}

const utilParsePackageJson = (path) => {
  const packageJson = JSON.parse(fs.readFileSync(path, 'utf8'));
  return packageJson;
}

const utilGetInstallScript = (path) => {
  if(!this.checkIfExists(path)) {
    console.log(chalk.red('ERROR: No package.json found in path: ' + path));
    return;
  }
  const { customInstallScript } = utilParsePackageJson(path);
  return customInstallScript || 'npm install';
}

exports.getWebInstallScript = () => {
  const install = utilGetInstallScript(`./web/package.json`);
  return install || 'npm install';
}

exports.getMobileInstallScript = () => {
  const install = utilGetInstallScript(`./mobile/package.json`);
  return install || 'npm install';
}

exports.getServerInstallScript = () => {
  const install = utilGetInstallScript(`./server/package.json`);
  return install || 'npm install';
}

exports.getProjectName = () => {
  // read current directory name
  const projectName = process.cwd().split('/').pop();
  console.log("PROJECT NAME: " + projectName);
  return projectName || 'No Project Name Found';
}

exports.checkIfExists = (path) => {
  const exists = fs.existsSync(path);
  return exists;
}

exports.getDevelopmentUrl = () => {
  const { proxy } = JSON.parse(fs.readFileSync(`./web/package.json`, 'utf8'));
  return proxy;
}

exports.getDevServerPort = () => {
  const proxy = exports.getDevelopmentUrl();
  const port = proxy.substring(proxy.lastIndexOf(':') + 1);
  return port;
}

/**
 * Regardless of input, use _.camelCase() to normalize the string.
 *
 * NOTE:
 * _.camelCase('Foo Bar');
 * // => 'fooBar'
 *
 * _.camelCase('--foo-bar--');
 * // => 'fooBar'
 *
 * _.camelCase('__FOO_BAR__');
 * // => 'fooBar'
 */
exports.getNormalizedName = (string) => {
  string = pluralize.singular(string);
  string = _.camelCase(string);
  return string;
}

exports.capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

exports.camelCase = (string) => {
  string = _.camelCase(string);
  return string;
}

exports.mkdir = (path, fn) => {
  shell.mkdir('-p', path);
  shell.chmod(755, path);
  console.log(chalk.cyan('   create directory: '), path);
  if(fn) fn();
}

exports.rmDir = (path, cb) => {
  shell.rm('-rf', path);
  console.log(chalk.cyan('   rm directory: '), path);
  if(cb) { cb() }
}

exports.replaceInFile = (path, oldString, newString, cb) => {
  console.log('in path', path, 'replace', oldString, 'with', newString);
  shell.sed('-i', oldString, newString, path);
  // shell.sed(oldString, newString, path);
  if(cb) { cb() }
}

exports.append = (path, string) => {
  fs.appendFileSync(path, string);
  console.log(chalk.magenta('   appending file: '), path);
}

exports.write = (path, string) => {
  fs.writeFileSync(path, string);
  console.log(chalk.cyan('   create file: '), path);
}

exports.readTemplate = (path) => {
  var template = fs.readFileSync(__dirname + '/templates/' + path, 'utf8');
  for (var key in resource) {
    template = template.split('__' + key + '__').join(resource[key]);
  }
  return template;
}

exports.readTemplateAndReplace = (path, file, replacements) => {
  console.log(chalk.dim("          Read and replace " + file));
  var template = fs.readFileSync(path + '/templates/' + file, 'utf8');
  for (var key in replacements) {
    template = template.split('__' + key + '__').join(replacements[key]);
  }
  return template;
}

exports.findAndReplaceYote = (path, file, appName) => {
  var template = fs.readFileSync(path + file, 'utf8');
  template = template.split('Yote').join(appName);
  return template;
}

exports.kebabCase = (string) => {
  string = _.kebabCase(string);
  return string;
}

exports.actionCase = (string) => {
  string = _.snakeCase(string);
  string = _.toUpper(string);
  return string;
}

exports.startCase = (string) => {
  string = _.startCase(string);
  return string;
}

exports.pluralize = (string) => {
  string = pluralize(string);
  return string;
}

exports.singularize = (string) => {
  string = pluralize.singular(string);
  return string;
}
