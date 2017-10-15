// var path = require('path')
var filePath = 'undpCh17.pdf';
var extract = require('pdf-text-extract');
extract(filePath, function (err, pages) {
  if (err) {
    console.dir(err)
    return
  }
  console.dir(pages)
})