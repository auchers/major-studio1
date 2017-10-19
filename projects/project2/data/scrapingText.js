var pdfUtil = require('pdf-to-text');
var fs = require('fs');
var pdf_path = "undpCh17.pdf";
 
 
//option to extract text from page 0 to 10 
var option = {from: 0, to: 31};
 
pdfUtil.pdfToText(pdf_path, option, function(err, data) {
  if (err) throw(err);
  fs.writeFileSync('ch17.txt', data);
  // console.log(data); //print text     
});