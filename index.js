
'use strict';

var program     = require('commander');
var falafel     = require('falafel');
var prettyBytes = require('pretty-bytes');
var fs          = require('fs');
var modules     = [];

program.version('1.0.0')
  .option('--source-dir [path]', 'The source code directory')
  .option('--source-file [file]', 'The path to the JS bundle produced by browserify')
  .option('--sort-by-size', 'Sort output by size')
  .parse(process.argv);


var sourceDir = program.sourceDir;
var sourceFile = program.sourceFile;

if(typeof sourceDir !== 'string'){
  throw new Error('source-dir is missing');
}
if(typeof sourceFile !== 'string'){
  throw new Error('source-file is missing');
}

console.log('source-dir: ', sourceDir);
console.log('source-file: ', sourceFile);

var src = fs.readFileSync(sourceFile);
console.log(
  'Source code length: ', src.length,
  '  (size) ', prettyBytes(src.length)
);

falafel(src, function (node) {

  if(typeof node.raw === 'string' && node.raw.match(sourceDir)){
    var sourceLength = node.parent.source().length;
    modules.push({
      name: node.raw.replace(sourceDir, ''),
      sourceLength: '' + sourceLength,
      prettySize: prettyBytes(sourceLength)
    });
  }

});

var maxNameLen = 0;
var maxSourceLengthLen = 0;

if(program.sortBySize){
  modules =
  modules
  .sort(function sortFn(a, b) {

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

modules
.map(function prepareModuleInfo(m) {
  if(m.name.length > maxNameLen){
    maxNameLen = m.name.length;
  }

  if(m.sourceLength.length > maxSourceLengthLen){
    maxSourceLengthLen = m.sourceLength.length;
  }
  return m;
})
.forEach(function printModuleInfo(m) {

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
})
