
var metricMapping = {
    'Worker Productivity': "AgriValuePerWorker",
    'Food Deficit': "FoodDeficit",
    'Fertilizer Consumption': 'FertilizerConsumpPerHA',
    'Income Share of Lowest 20%':'IncomeShareLowest20'
};

var agData, divW;

var x,y;

// set starting values
var year = 2010,
    metric = 'Worker Productivity';

var title = d3.select('.title')
    .append('h2')
    .text('Agricultural Crop Profiles of Countries in Sub-Saharan Africa');

// create year dropdown
var yearSelect = d3.select('.controls')
    .append('select')
    .on('change', onYearSelect);

var metricSelect = d3.select('.controls')
    .append('select')
    .on('change', onMetricSelect);

// create main scatterplot svg
var plot = d3.select('.plot')
    .append('div')
    .attr('class', 'plot')
    .style('height','90%')
    .style('width', '100%');

// plot.append('g'); // buffer for data join later

var width = plot.node().offsetWidth;
var height = plot.node().offsetHeight;

console.log(`width: ${width} height: ${height}`);

var tool_tip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

// get data
d3.json('data/cropdata.json', function(err, data){
    agData = data;
    console.log(agData);

    // get array of unique years from data -- use to populate dropdown
    var years = _.uniq(_.map(data, 'Time'));
    var metrics = Object.keys(metricMapping);

    yearSelect.selectAll('option')
        .data(years)
        .enter()
        .append('option')
        .text(function(d){ return d; })
        .property("selected", function(d){ return +d === year; }); //sets defaults value

    metricSelect.selectAll('option')
        .data(metrics)
        .enter()
        .append('option')
        .text(function(d){ return d; })
        .property("selected", function(d){ return d === metric; }); //sets defaults value;

    // display plot
    display();
});


function display() {
    var t = d3.transition()
        .duration(750);
    var headerSize = 20;
    // filter the data to the selected year
    var m = metricMapping[metric];
    //get data ready
    var agDataF = _.filter(agData, function(d){return ((+d.Time === year) && d.hasOwnProperty(m) && !(d[m] === "..") ); });
    agDataF = _.sortBy(agDataF, function(d){ return +d[m]; }); // sort by metric of choice
    agDataF = _.reverse(agDataF);
    var grouped = _.groupBy(agDataF, function(d){ return d.Country; });
    grouped = _.values(grouped);

    divW = width/(grouped.length);
    console.log(grouped);

    var group = plot.selectAll('g')
        .data(grouped, function(d){console.log(d.Country); return d.Country; });

    var countries = group.enter()
        .append('g')
        .append('div')
        .attr('class', function(d){ return `${d[0].Country.replace(/\s/g, '')} country`; })
        .attr('data-AgriValuePerWorker', function(d){ return d[0].AgriValuePerWorker})
        .attr('data-FertilizerConsumpPerHA', function(d){ return d[0].FertilizerConsumpPerHA})
        .attr('data-FoodDeficit', function(d){ return d[0].FoodDeficit})
        .attr('data-IncomeShareLowest20', function(d){ return d[0].IncomeShareLowest20})
        .style('width', divW)
        .style('height', height);


    group.exit().remove();

    crops = countries.selectAll('div')
        .data(function(d){return d;})
        .enter()
        .append('div')
        .attr('class', function(d){
            var item = d.Item.replace(/\s/g, '').split(',')[0];
            return `${item} crop`; })
        .style('height', function(d){return ((height) * d.percentOfSubtotal); })
        .on("mouseover", function(d) {
            tool_tip.transition()
                .duration(200)
                .style("opacity", .9);
            tool_tip.html(
                    `<h3>${d.Country}</h3>
                    <b>${d.Item} (${Math.round(d.percentOfTotal * 100)}% total crops)</b>
                    <br> 
                    <br> 
                    ${metric}: ${Math.round(d[m])}
                    <br> 
                    ${d.Time}`)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on('mouseout', function(d){
            tool_tip.transition()
                .duration(500)
                .style('opacity', 0);
        });

    crops.exit().remove();

    // countries.append('div')
    //     .text(function(d){ return d[0].Country; })
    //     .attr('class', 'header')
    //     .style('display', 'none')
    //     .attr('height', headerSize);
}


function onYearSelect(){
    console.log(this);
    year = +d3.select(this).property('value');
    // console.log(d3.select(this));
    console.log(`year changed to ${year}`);
    display();
}

function onMetricSelect(){
    metric = d3.select(this).property('value');
    console.log(metric);
    display();
}