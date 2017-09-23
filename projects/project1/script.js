// window variables
var margin = {top: 20, right: 50, bottom: 50, left: 20};
var numCountries = 5;

var width = window.innerWidth - margin.left - margin.right,
    height = (window.innerHeight - margin.top - margin.bottom) / numCountries;

// GLOBALS -------------
// Parse the date / time
// var	parseDate = d3.timeFormat("%Y");



// Define the line
// var	valueline = d3.svg.line()
// 	.x(function(d) { return x(d.Year); })
// 	.y(function(d) { return y(d.Gini); });

// GRAPHING ---------

// Belarus
d3.json('belarus_subset.json', function(error, data){
    if (error) throw error;
    console.log(data);
    graph(data, 'belarus');
});

// Kyrgyzstan
d3.json('kyrgyzstan_subset.json', function(error, data){
    if (error) throw error;
    console.log(data);
    graph(data, 'kyrgyzstan');
})


function graph(data, countryID){
    // data.Year = parseDate(data.Year);
    var years = [];
    var ginis = [];
    var radius = 3;
    
    data.forEach(function(d){
        years.push(d.Year);
        ginis.push(d.Gini);
    });
    
    // create svg and g    
    var svg = d3.select('#'+countryID)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    // Set the ranges
    var	x = d3.scaleLinear()
        .domain([d3.min(years), d3.max(years)])
        .range([0, width]);
        
    var	y = d3.scaleLinear()
        .domain([0, d3.max(ginis)])
        .range([height, 0]);
  
    console.log(x(2000) + ' | ' + d3.min(years));
    console.log(y(49));
    
    // Define the axes
    var	xAxis = d3.axisBottom(x).ticks(5);
    var	yAxis = d3.axisLeft(y).ticks(5);
    	
    svg.append('g')
        .attr('class', 'group');
        
    var group = svg.select('.group')
        .selectAll('g')
        .data(data)
        .enter()
        .append('g')
        // .attr('class', function(d){ return d.Year})
        .attr('class', function(d){ return d.Country + ' ' + d.Year + ' '
            + d.YearsTillRev + ' ' + d.Quality + ' ' + d.Gini})
        .attr('x', function(d,i){return x(d.Year);})
        // .attr('transform', function(d, i){
        //     return 'translate(' + x(d.YearsTillRev) + ', ' + 0 + ')';
        // });
        
        group.append('circle')
            .attr('class', 'point')
            .attr('cy', function(d, i){ return y(d.Gini)})
            .attr('cx', function(d, i){ return x(d.Year)})
            .attr('r', radius);
        
        group.append('text')
            .text(function(d){ return d.Year})
            .style('text-anchor', 'middle')
            .attr('x', function(d, i){ return x(d.Year)})
            .attr('y', height);
        

}
