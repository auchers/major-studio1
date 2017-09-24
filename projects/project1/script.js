// window variables
var margin = {top: 20, right: 50, bottom: 50, left: 20};
var numCountries = 3;

var width = (window.innerWidth - margin.left - margin.right),
    height = (window.innerHeight - margin.top - margin.bottom) / numCountries;

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

// Graph Function
function graph(data, countryID){
    var years = [];
    var ginis = [];
    var radius = 5;
    var scaleBuffer = 1;
    
    data.forEach(function(d){
        years.push(d.Year);
        ginis.push(d.Gini);
    });
    
    // Set the ranges
    var	x = d3.scaleLinear()
        .domain([d3.min(years) - 1, d3.max(years)])
        .range([0, width]);
        
    var	y = d3.scaleLinear()
        .domain([0, d3.max(ginis)])
        .range([height, 0]);
  
    console.log(x(2000) + ' | ' + d3.min(years));
    console.log(y(49));
    
    // Define the axes
    var	xAxis = d3.axisBottom(x).ticks(5);
    var	yAxis = d3.axisLeft(y).ticks(5);
    
    // create svg and g    
    var svg = d3.select('#'+countryID)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(yAxis)
        .attr('class', 'yAxis');
    
    svg.append('g')
        .attr("transform", 'translate(0,' + height + ')')
        .attr('class', 'xAxis')
        .call(xAxis);
    	
    svg.append('g')
        .attr('class', 'group')
        
        
    var group = svg.select('.group')
        .selectAll('g')
        .data(data)
        .enter()
        .append('g')
        .attr('class', function(d){ return d.Country + ' ' + d.Year + ' '
            + d.YearsTillRev + ' ' + d.Quality + ' ' + d.Gini})
        .attr('x', function(d,i){return x(d.Year);})
        
    group.append('circle')
        .attr('class', 'point')
        .attr('class', function (d){
                    if (d.Year == d.Revyear)
                        return 'Revyear';
                })
        .attr('cy', function(d, i){ return y(d.Gini)})
        .attr('cx', function(d, i){ return x(d.Year)})
        .attr('r', radius);
    
    group.append('text')
        .text(function(d){ return d.Year})
        .style('text-anchor', 'middle')
        .attr('x', function(d, i){ return x(d.Year)})
        .attr('y', height);
        

}
