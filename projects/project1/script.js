// window variables
var margin = {top: 20, right: 50, bottom: 50, left: 30};
var heightDivider = 7;

var width = (window.innerWidth - margin.left - margin.right) * .75,
    height = (window.innerHeight - margin.top - margin.bottom) / heightDivider;

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
        .attr('class', 'year')
        .text(function (d){ return 'Year of Revolution: ' + d.Revyear;});
    
    callout.append('p')
        .attr('class', 'outcome')
        .text(function (d){ return 'Outcome: ' + capitalizeFirstLetter(d.outcome);});

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
    var parseTime = d3.timeParse("%Y");
    var formatTime = d3.timeFormat("%Y");

    data.forEach(function(d){
        d.Year = (parseTime(d.Year));
        // d.Revyear = (parseTime(d.Revyear));
        years.push(d.Year);
        ginis.push(d.Gini);
        console.log();
    });

    // Define Scales
    var	x = d3.scaleTime()
        .domain(d3.extent(years))
        .range([radius, width]);

    var	y = d3.scaleLinear()
        .domain([d3.min(ginis), d3.max(ginis)])
        .range([height - radius, 0]);

    // Define Axes
    var	xAxis = d3.axisBottom(x).ticks(5).tickFormat(formatTime);
    
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
    
    // if (countryID == 'Ukraine'){ // only call xAxis for last country
    //     console.log('found Ukraine!');
    //     svg.select('.xAxis').call(xAxis);
    // }
    
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
        .attr('class', function (d){ // set class to highlight revolution years
            var yearType;
            if (formatTime(d.Year) == d.Revyear){
                yearType = 'revYear';
            } else if (formatTime(d.Year) == d.additionalAttempt){
                yearType = 'addnlRevYear';
            } else{
                yearType = 'regYear';
            }
            return yearType;
        })
        .attr('cy', function(d, i){ return y(d.Gini)})
        .attr('cx', function(d, i){ return x(d.Year)})
        .attr('r', radius)
        .on('mouseover', function(d) {		
            tooltip.style("opacity", .9);
                
            tooltip.html('Year: ' + formatTime(d.Year) + "<br/>"  + 'Gini: ' + d.Gini)	
                .style('left', (d3.event.pageX) + "px")		
                .style('top', (d3.event.pageY - 28) + "px");	
            })					
        .on("mouseout", function(d) {		
            tooltip.transition()		
                .duration(500)		
                .style("opacity", 0);	
        });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
