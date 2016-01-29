
'use strict';

var program     = require('commander');
var falafel     = require('falafel');
var prettyBytes = require('pretty-bytes');
var fs          = require('fs');
var packageJson = require(__dirname + '/package.json');
var modules     = [];

program.version(packageJson.version)
  .option('--source-dir   [path]', 'The source code directory')
  .option('--source-file  [file]', 'The path to the JS bundle produced by browserify')
  .option('--sort-by-size', 'Sort output by size')
  .option('--sort-by-name', 'Sort output by name')
  .parse(process.argv);


//  capture the arguments
var sourceDir   = program.sourceDir;
var sourceFile  = program.sourceFile;

//  counters for maximum string sizes of the values
//  ( needed for alignment )
var maxNameLen = 0;
var maxSourceLengthLen = 0;
var totalBundlesLength = 0;

//  throw if invalid arguments
if(typeof sourceDir !== 'string' || sourceDir.length < 1){
  throw new Error('source-dir is missing');
}
if(typeof sourceFile !== 'string' || sourceFile.length < 1){
  throw new Error('source-file is missing');
}

//  print arguments for verification
console.log('source-dir: ', sourceDir);
console.log('source-file: ', sourceFile);

// visual separator
var separator =
'----------------------------------------'+
'----------------------------------------'

//  load source file
var src = fs.readFileSync(sourceFile);
console.log(
  'Source code length: ', src.length,
  '  (size) ', prettyBytes(src.length)
);
console.log(separator);

//  parse code and capture information on each module bundled
falafel(src, function (node) {

  if(typeof node.raw === 'string' && node.raw.match(sourceDir)){

    //  check if parent is a property
    if(node.parent.type !== 'Property'){
      return true;
    }
    //  check if parent's value has an Array as value
    if(node.parent.value.type !== 'ArrayExpression'){
      return true;
    }
    // check if first element has 3 elements itself
    if(node.parent.value.elements[0].params.length !== 3){
      return true;
    }

    var sourceLength = node.parent.source().length;
    modules.push({
      name: node.raw.replace(sourceDir, ''),
      sourceLength: '' + sourceLength,
      prettySize: prettyBytes(sourceLength)
    });
  }

});


//  sort results if needed
if(program.sortBySize){
  //  sort by sourceLength
  modules =
  modules
  .sort(function sortFn(a, b) {

    //  convert them to numbers
    var sizeA = +a.sourceLength;
    var sizeB = +b.sourceLength;

    if(sizeA > sizeB){
      return -1
    }
    if(sizeA < sizeB){
      return 1
    }
    return 0;
  });
}
else if(program.sortByName){
  //  sort by sourceLength
  modules =
  modules
  .sort(function sortFn(a, b) {

    if(a.name > b.name){
      return -1
    }
    if(a.name < b.name){
      return 1
    }
    return 0;
  });
}

var printModuleInfo = function printModuleInfo(m) {

  var name = m.name;
  var sourceLength = '' + m.sourceLength;

  var nameBlanks = maxNameLen - name.length;
  while(nameBlanks--){ name += ' '; }

  var sourceLengthBlanks = maxSourceLengthLen - sourceLength.length;
  while(sourceLengthBlanks--){ sourceLength += ' '; }

  console.log(
    name,
    '| Length: ', sourceLength,
    '| Size: ', m.prettySize
  );
};


modules
//  capture maximum string lengths
.map(function prepareModuleInfo(m) {

  totalBundlesLength += +m.sourceLength;

  if(m.name.length > maxNameLen){
    maxNameLen = m.name.length;
  }

  if(m.sourceLength.length > maxSourceLengthLen){
    maxSourceLengthLen = m.sourceLength.length + 3;
  }
  return m;
})
// for each module, print it's row
.forEach(printModuleInfo);



function printTotals() {

  console.log(separator);

  var totalModules = 'Modules: ' + modules.length;
  var totalModulesBlanks = maxNameLen - totalModules.length;
  while(totalModulesBlanks--){ totalModules+= ' '; }

  var _totalBundlesLength = '' + totalBundlesLength;
  var totalBundlesBlanks = maxSourceLengthLen - _totalBundlesLength.length;
  while(totalBundlesBlanks--){ _totalBundlesLength += ' '; }


  console.log(
    totalModules,
    '| Length: ', _totalBundlesLength,
    '| Size: ', prettyBytes(totalBundlesLength)
  );
}

//  print totals row
printTotals();
