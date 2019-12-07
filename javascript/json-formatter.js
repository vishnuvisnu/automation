//var crappyJSON = '{ somePropertyWithoutQuotes: "theValue!"  }';
var fs = require("fs");
var text = fs.readFileSync("./test-json-unquoted-props.json").toString();
//var textByLine = text.split("\n")
var doubleQuotedValuesText = text.replace(/'/g, '"');
console.log(doubleQuotedValuesText);
var fixedJSON = doubleQuotedValuesText.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ');
var aNiceObject = JSON.parse(fixedJSON);
console.log(JSON.stringify(aNiceObject))
