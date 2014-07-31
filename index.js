'use strict';

var cli    = require('cli'),
    fs     = require('fs'),
    colors = require('colors');

var keyedArgs        = {},
    acceptedCommands = [
      'help',
      'exportSite'
    ],
    usageString      = ('Usage: > node processRawData --[command] [arguments]\n\rCommands: ' + acceptedCommands).red;

cli.main(function(args, options) {

  //
  // Deal with arguments
  //
  args.forEach(function(arg, i) {

    if (arg.substring(0,2) === '--') {
      return keyedArgs[arg.substring(2)] = args[i+1];
    }

    if (arg.substring(0,1) === '-') {
      return keyedArgs[arg.substring(1)] = args[i+1];
    }

  });

  if(Object.keys(keyedArgs)[0] === 'help') {
    console.log(usageString);
    process.exit(0);
  }

  //
  // Check for requierments
  //

  //There is a command
  if (!Object.keys(keyedArgs).length) {
    console.error(usageString);
    process.exit(1);
  }

  //The command is matched in the list of accepted commands
  if (acceptedCommands.indexOf(Object.keys(keyedArgs)[0]) < 0) {
    console.log(('This script only accepts these commands: ' + acceptedCommands).red);
    process.exit(0);
  }

  //
  // Run the command
  //

  return require('./lib/' + Object.keys(keyedArgs)[0])(function(err, response) {

    if (err) {
      console.error(err.toString().red);
      process.exit(1);
    }

    console.log('Done!'.green);
    process.exit(0);

  });


});