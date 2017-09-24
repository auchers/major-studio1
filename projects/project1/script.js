// window variables
var margin = {top: 20, right: 50, bottom: 50, left: 30};
var numCountries = 6;

var width = (window.innerWidth - margin.left - margin.right) * .75,
    height = (window.innerHeight - margin.top - margin.bottom) / numCountries;

// Page Setup + Graphing
// Pull list of countries and revolutions
d3.json('data/rev_summary.json', function(error, data){
    if (error) throw error;
    console.log(data);

    // Add div for each country/revolution
    var div = d3.select('#bodycontent')
        .selectAll('div')
        .data(data)
        .enter()
        .append('div')
        .attr('id',function(d){ return d.Country});

    // Side Callouts
    var callout = div.append('div')
        .attr('class','bio');

    callout.append('h3')
        .text(function (d){ return d.Country + ':';});

    callout.append('h4')
        .text(function (d){ return '\'' + d.name + '\'';});

    callout.append('p')
        .text(function (d){ return 'Year of Revolution: ' + d.Revyear;});

    // for each country, pull it's data and graph it
    data.forEach(function(d){
        var country = d.Country;
        
        // load individual country data
        d3.json('data/' + country + '_subset.json', function(error, data){
            if (error) throw error;

            // filter out NA values
            data = data.filter(function(d){ return (d._row == 'NA')? false : true;});
            console.log(data);
            
            // GRAPH
            graph(data, country);
        });
    });

});

// Graph Function
function graph(data, countryID){
    var years = [];
    var ginis = [];
    var radius = 5;
    var scaleBuffer = 1;
    
    // turn 'years' into datetime formats
    var format = d3.timeFormat("%Y");
    data.Year = format(data.Year);

    data.forEach(function(d){
        years.push(d.Year);
        ginis.push(d.Gini);
    });

    // Define Scales
    var	x = d3.scaleTime()
        .domain([d3.min(years) - scaleBuffer, d3.max(years)])
        .range([0, width]);

    var	y = d3.scaleLinear()
        .domain([d3.min(ginis) - scaleBuffer, d3.max(ginis)])
        .range([height - radius, 0]);

    // Define Axes
    var	xAxis = d3.axisBottom(x).ticks(5).tickFormat(format);
    var	yAxis = d3.axisLeft(y).ticks(5);
    
    // Define the div for the tooltip
    var tooltip = d3.select("body").append("div")	
        .attr("class", "tooltip")				
        .style("opacity", 0);

    // Create Svg and G
    var svg = d3.select('#'+countryID)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Call Axes
    svg.append('g')
        .attr('class', 'yAxis')
        .call(yAxis);

    svg.append('g')
        .attr('class', 'xAxis')
        .attr("transform", 'translate(0,' + height + ')')
        .call(xAxis);
    
    // Axis Labels
    svg.append("text")
        .attr('class', 'yAxisLabel')
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left * 1.5)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Gini");      


    // Define Lines
    var line = d3.line()
        .x(function(d){ return x(d.Year); })
        .y(function(d){ return y(d.Gini); });

    // Begin Plotting Data Points
    svg.append('g')
        .attr('class', 'dataGroup');

    var group = svg.select('.dataGroup')
        .selectAll('g')
        .data(data)
        .enter()
        .append('g')
        .attr('class', function(d){ return d.Country + ' ' + d.Year + ' '
            + d.YearsTillRev + ' ' + d.Quality + ' ' + d.Gini})
        .attr('x', function(d,i){return x(d.Year);});

    group.append('path')
        .datum(data)
        .attr('d', line)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5);
        
    group.append('circle')
        .attr('class', 'point')
        .attr('class', function (d){return (d.Year == d.Revyear)? 'Revyear': 'Regyear';})
        .attr('cy', function(d, i){ return y(d.Gini)})
        .attr('cx', function(d, i){ return x(d.Year)})
        .attr('r', radius)
        .on('mouseover', function(d) {		
            tooltip.style("opacity", .9);
                
            tooltip.html('Year: ' + d.Year + "<br/>"  + 'Gini: ' + d.Gini)	
                .style('left', (d3.event.pageX) + "px")		
                .style('top', (d3.event.pageY - 28) + "px");	
            })					
        .on("mouseout", function(d) {		
            tooltip.transition()		
                .duration(500)		
                .style("opacity", 0);	
        });
;

}
