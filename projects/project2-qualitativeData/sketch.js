// var rita = require('rita');
var file_path = 'data/ch7.txt';
var t;
var dict = [],
    phrases = [];

var w = window.innerWidth/2,
    h = window.innerHeight/4;

var minSize = 25,
    maxSize = 48;

var minCount = 10, // frequency cutoff
    r = 5, // circle radius
    wordsIC = 6; // words in context

var mainDiv = d3.select('body')
    .append('div')
    .attr('id', 'main container')

var freqContent = mainDiv
    .append('div')
    .attr('id', 'freq')
    
var kwicContent = mainDiv
    .append('div')
    .attr('id', 'kwic')

freqContent.append('h3')
    .text('Most Frequent Words:')
    
kwicContent.append('h3')
    .text('Word in Context')
    .append('p')
    .text('(click on word above to see in context)');

// DATA - load in JSON
d3.text(file_path, function (d){
    t = d.replace(/\n/g, " ");
    phrases = RiTa.splitSentences(t, '. ');
    console.log(phrases);
    
    display(t);
});

function display(data){
	var cArgs = {
    	 ignoreCase: true,
    	 ignoreStopWords: true,
    	 wordsToIgnore: ['chapter', 'chapters', 'cent', 'between', 'per', '+', '=']
	};
    
    // create concordance
    var c = RiTa.concordance(data, cArgs);
    
    // reformat concordance to only include minCount of frequencies and above
	for (w in c){
    	(c[w] > minCount) ? dict.push({ word: w, count: c[w], features: RiString(w).features() }) : null;
	}
	
	dict.sort(function(a, b) { return b.count - a.count; });
	
	var freq = d3.scaleLinear()
        .domain([dict[dict.length-1].count, dict[0].count])
        .range([minSize, maxSize]);
	
    // fill noun svg with most frequent words
    freqContent.selectAll('div')
        .data(dict)
        .enter()
        .append('div')
        .attr('class', function(d){ return 'words ' + d.count + ' '; })
        .text(function(d){ return d.word;})
        .style('font-size', function(d){ return freq(d.count) + 'px'; })
        .on('click', function(d){ displayContext(d.word, this)});
        
    freqContent.append('input')
        .attr('placeholder', 'your word here')
        .on('change', function(){displayContext(this.value, this) });
}

function displayContext(word, elem){
    //clean for new round
    // console.log(word);
    var w = word.toLowerCase();
    var wLength = w.length;
    var phraseMatch = [];
    // var iOfWord;
    
    kwicContent.selectAll('*').remove(); 
    kwicContent.insert('h3').text(function(d){return 'Context of: \'' + w + '\' ';});
    // kwicContent.select('p').remove();

    d3.selectAll('*').classed('bold', false);
    d3.select(elem).classed('bold', true);
    
    phrases.forEach(function(p){
      if (p.toLowerCase().includes(w)){
          console.log(p);
          var start = p.toLowerCase().indexOf(w);
          phraseMatch.push({
              phrase: p,
              start: start,
              end: start + wLength
          });
      }
    });
    
    var text = kwicContent.selectAll('div')
        .data(phraseMatch)
        .enter()
        .append('div')
        .attr('class', 'phrase')
        .html(function(p){
            return p.phrase.slice(0, p.start) + ' <b>' + p.phrase.slice(p.start, p.end) + '</b> ' + p.phrase.slice(p.end+1,);
        });
}
    
        