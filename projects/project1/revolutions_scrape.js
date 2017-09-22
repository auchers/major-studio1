var request = require('request');
// var async = require('async');
var fs = require('fs');
var cheerio = require('cheerio');

var url = 'https://en.wikipedia.org/wiki/Colour_revolution';
var revolutions = [];

request(url, function (error, response, body){
    if (!error && response.statusCode == 200){
        
        var $ = cheerio.load(body);
        
        $('tbody').eq(1).find('tr').each(function(i, elem){
            if (i != 0){
                var thisCell = $(elem).find('td');
                var thisRev = new Object;
                thisRev.name = thisCell.eq(1).text().trim();
                thisRev.country = thisCell.eq(2).text().trim();
                thisRev.start = thisCell.eq(3).text().trim();
                // thisRev.end = thisCell.eq(4).text();
                revolutions.push(thisRev);
            }
        })
        
        // console.log($('tbody'));
        fs.writeFileSync('/home/ubuntu/workspace/projects/project1/revolutions.json', JSON.stringify(revolutions));
    }
    else {console.error('request failed')}
})