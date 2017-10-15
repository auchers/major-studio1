
var file_path = 'data/ch17.json';

var w = window.innerWidth/2,
    h = window.innerHeight/4;
    
var minCount = 10, // fequency cutoff
    r = 5, // circle radius
    wordsIC = 4; // words in context
    // padding = 5;

var mainDiv = d3.select('body')
    .append('div')
    .attr('id', 'main container')

var freqContent = mainDiv
    .append('div')
    .attr('id', 'freq')
    
var kwicContent = mainDiv
    .append('div')
    .attr('id', 'kwic')

// POS frequency section    
var nouns = freqContent.append('div')
    .attr('class', 'nouns')

var verbs = freqContent.append('div')
    .attr('class', 'verbs')
    
var adjs = freqContent.append('div')
    .attr('class', 'adjs')

// section headers  
nouns.append('h3').attr('class', 'header nouns').text('Nouns:');
verbs.append('h3').attr('class', 'header verbs').text('Verbs:');
adjs.append('h3').attr('class', 'header adjs').text('Adjectives:');

kwicContent.append('h2').attr('class', 'kwic').text('KWIC');
var kwicSVG = kwicContent.append('svg')
    .attr('class', 'kwic')
    .attr('width', parent.innerHeight)
    .attr('height', window.innerHeight);
    
// load in text
d3.json(file_path, display);

function display(data){
    console.log(data);
    
    // NOUNS
    nounData = data.filter(function(d){
            pos = d.features.pos;
            isNoun = (pos == 'nn' || pos == 'nns' || pos == 'nnps' || pos == 'nnp');
            isFrequent = d.count > minCount;
            return (isNoun && isFrequent);
        })
        
    // fill noun svg with most frequent words
    nouns.selectAll('span')
        .data(nounData)
        .enter()
        .append('span')
        .attr('class','words')
        .text(function(d){return d.word + ' '})
        .on('click',displayContext)
        
    // VERBS
    verbData = data.filter(function(d){
        pos = d.features.pos;
        isVerb = (pos == 'vb' || pos == 'vbd' || pos == 'vbn' || pos == 'vbp' || pos == 'vbz');
        isFrequent = d.count > minCount;
        return (isVerb && isFrequent);
    })
        
    // fill verb svg with most frequent words
    verbs.selectAll('span')
        .data(verbData)
        .enter()
        .append('span')
        .attr('class','words')
        .text(function(d){return d.word + ' '})
        .on('click',displayContext)
        
    // ADJECTIVES
    adjData = data.filter(function(d){
        pos = d.features.pos;
        isAdj = (pos == 'jj' || pos == 'jjr' || pos == 'jjs');
        isFrequent = d.count > minCount;
        return (isAdj && isFrequent);
    })
        
    // fill verb svg with most frequent words
    adjs.selectAll('span')
        .data(adjData)
        .enter()
        .append('span')
        .attr('class','words')
        .text(function(d){return d.word + ' '})
        .on('click',displayContext)
    
}

function displayContext(d, i){
    d3.selectAll('.words').classed('bold', false);
    
    d3.select(this).classed('bold', true);
    
    var phrases = d.kwic;
    console.log(phrases);
    
    kwicSVG.selectAll('g').remove(); //clean for new round
    
    var phraseG = kwicSVG.selectAll('g')
        .data(phrases)
        .enter()
        .append('g');
        
    phraseG.append('circle')
        .attr('cx', r)
        .attr('cy', function (d, i){return (i+1) * 50 })
        .attr('r', r);
        
    var text = phraseG.append('text')
        .attr('x', r * 2 + 10)
        .attr('y', function(d, i){return (i+1) * 50})
        
    text.append('tspan')
        .text(function(d,i){
            return d.split(' ').slice(0,wordsIC).join(' ');
        });
        
    text.append('tspan')
        .attr('class', 'bold')
        .text(function(d) {
            return ' ' + d.split(' ')[wordsIC] + ' ';
        });
        
    text.append('tspan')
        .text(function(d,i){
            return d.split(' ').slice(wordsIC+1,).join(' ');
        });
        
        
        // .text(function(d, i){
        //     var toArray = d.split(' ')
        //     toArray.splice(wordsIC, 0 , '<b>');
        //     toArray.splice(wordsIC + 2, 0 , '</b>');
        //     return toArray.join(' ');
        // });
        
}