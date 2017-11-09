
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
    metric = 'Worker Productivity',
    m; // current underlying metric

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
    .style('height','70%')
    .style('width', '100%');

// plot.append('g'); // buffer for data join later

var width = plot.node().offsetWidth;
var height = plot.node().offsetHeight;

var titleHeight = title.node().offsetHeight;
var controlHeight = metricSelect.node().offsetHeight;

console.log(`width: ${width} height: ${height}`);

// create tooltip -- later move it to location of hover
var tool_tip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

// create country label -- later move it to location of hover
var country_hover = d3.select('body')
    .append('div')
    .attr('class', 'label')
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
    m = metricMapping[metric];
    //get data ready
    var agDataF = _.filter(agData, function(d){return ((+d.Time === year) && d.hasOwnProperty(m) && !(d[m] === "..") ); });
    agDataF = _.sortBy(agDataF, function(d){ return +d[m]; }); // sort by metric of choice
    agDataF = _.reverse(agDataF);
    var grouped = _.groupBy(agDataF, function(d){ return d.Country; });
    grouped = _.values(grouped);

    divW = width/(grouped.length);
    console.log(grouped);

    var group = plot.selectAll('g')
        .data(grouped, function(d){return d.Country; });

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
        .on("mouseover", function(d){ onMouseover(d); })
        .on('mouseout', function(d){
            tool_tip.transition()
                .duration(500)
                .style('opacity', 0);
        });

    crops.exit().remove();

    // countries.append('div')
    //     .text(function(d){ return d[0].Country; })
    //     .attr('class', 'header')
    //     .style('opacity', 0)
    //     .style('height', headerSize-2)
    //     .style('width', divW)
    //     .style('display', 'inline-block');
}

function onMouseover(d){
    tool_tip.transition()
        .duration(200)
        .style("opacity", .9);
    tool_tip.html(
            `<h5>${d.Item} (${Math.round(d.percentOfTotal * 100)}% total crops)</h5>
            <br> 
            <h6> ${metric}: ${Math.round(d[m])}</h6>
            ${d.Time}`)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");

    country_hover.transition()
        .duration(200)
        .style("opacity", .9);
    country_hover.text(d.Country)
        // .attr("transform", "translate(0,480)")
        .style("top", (height+titleHeight+controlHeight + 80) + 'px')
        // .style("top", '90%')
        .style("left", (d3.event.pageX - divW) + "px");

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