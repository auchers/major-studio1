
var metricMapping = {
    'Worker Productivity': "AgriValuePerWorker",
    'Food Deficit': "FoodDeficit",
    'Fertilizer Consumption': 'FertilizerConsumpPerHA'
    // 'Income Share of Lowest 20%':'IncomeShareLowest20'
};

var agData, grouped, divW, gdp, metricArray;

var countries, crops;

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

var scaleSelect = d3.select('.controls')
    .append('input')
    .attr('id', 'scaleSelect')
    .attr('type', 'checkbox')
    .on('change', scale);

d3.select('.controls')
    .append('label')
    .attr('for', 'scaleSelect')
    .text('scale by gdp (log)');

var ghostAxis = d3.select('.plot')
    .append('svg')
    .attr('class', 'ghost')
    .style('height','75px')
    .style('width', '100%');

// create main scatterplot svg
var plot = d3.select('.plot')
    .append('div')
    .attr('class', 'plot')
    .style('height','70%')
    .style('width', '100%');

var width = plot.node().offsetWidth;
var height = plot.node().offsetHeight;

var titleHeight = title.node().offsetHeight;
var ghostAxisHeight = ghostAxis.node().getBoundingClientRect().height;

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
    // console.log(agData);

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
    updateData();
});

function updateData(){
    gdp = [];
    metricArray = [];

    m = metricMapping[metric];
    //get data ready
    // filter the data to the selected year
    var agDataF = _.filter(agData, function(d){return ((+d.Time === year) && d.hasOwnProperty(m) && !(d[m] === "..") ); });
    // agDataF = _.reverse(agDataF);
    grouped = _.groupBy(agDataF, function(d){ return d.Country; });
    grouped = _.sortBy(grouped, function(d){ return +d[0][m]; }); // sort by metric of choice
    grouped = _.values(grouped);
    console.log(grouped);

    // TODO - populate this on full dataset so that we don't change scale with each filtering
    grouped.forEach(function(d){
        gdp.push(+d[0].GDP);
        metricArray.push(+d[0][m]);
    });

    displayBars(grouped);
    drawGhostCircles(grouped);


}

function displayBars(data) {
    /*Width of Bars*/
    divW = width / (data.length);

    /* Begin Plotting Bars*/
    var group = plot.selectAll('div')
        .data(data, function (d) {
            return d.Country;
        });

    countries = group.enter()
        .append('div')
        .attr('class', function (d) {
            return `${d[0].Country.replace(/\s/g, '')} country`;
        })
        .merge(group)
        .attr('data-AgriValuePerWorker', function (d) {
            return d[0].AgriValuePerWorker
        })
        .attr('data-FertilizerConsumpPerHA', function (d) {
            return d[0].FertilizerConsumpPerHA
        })
        .attr('data-FoodDeficit', function (d) {
            return d[0].FoodDeficit
        })
        .attr('data-IncomeShareLowest20', function (d) {
            return d[0].IncomeShareLowest20
        })
        .style('width', divW)
        .on('click', onClick);

    group.exit().remove();

    crops = countries.selectAll('div')
        .data(function (d) {
            return d;
        })
        .enter()
        .append('div')
        .attr('class', function (d) {
            var item = d.Item.replace(/\s/g, '').split(',')[0].split('(')[0];
            return `${item} crop`;
        })
        .merge(countries)
        .style('width', divW)
        .on("mouseover", function (d) {
            onMouseover(d);
        })
        .on('mouseout', function (d) {
            onMouseOut(d);
        });

    crops.exit().remove();
    scale();
    /* Finish Plotting Bars*/
}

function drawGhostCircles(data){
    /* Begin Plotting Ghost Axis*/
    var r = 7;

    let ghostX = d3.scaleLinear()
        .domain([d3.min(metricArray), d3.max(metricArray)])
        .range([r, width-r]);

    var ghostCircles = ghostAxis.selectAll('circle')
        .data(data);

    ghostCircles.enter()
        .append('circle')
        .merge(ghostCircles)
        .attr('class', function(d){ return `${d[0].Country.replace(/\s/g, '')} ghost`; })
        .attr(`d_${m}`, function(d){ return `${d[0][m]}_${ghostX(d[0][m])}`; })
        .transition()
        .duration(2000)
        .attr('cx', function(d){ return ghostX(d[0][m]); })
        .attr('cy', 3*r)
        .attr('r', r)
        .style('opacity', 0.7);

    ghostCircles.exit().remove();

    ghostAxis.selectAll('text').remove();
    // metric maximum label
    ghostAxis.append('text')
        .attr('class', 'ghostLabel')
        .transition().duration(1000)
        .attr('x', 0)
        .attr('y', 6*r)
        .text(Math.round(d3.min(metricArray)));

    // metric minimum label
    ghostAxis.append('text')
        .attr('class', 'ghostLabel')
        .attr('text-anchor', 'end')
        .transition().duration(1000)
        .attr('x', width)
        .attr('y', 6*r)
        .text(Math.round(d3.max(metricArray)));

    /* Finish Plotting Ghost Axis*/
}

function scale(){
    // var t = d3.transition()
    //     .duration(750);

    if (scaleSelect.property('checked')){
        // console.log('checked!');

        var heightScale = d3.scaleLog()
            .domain([d3.min(gdp), d3.max(gdp)])
            .range([10, height]);

        d3.selectAll('.country')
            // .transition().duration(2000)
            .style('height', function(d){
                return heightScale(d[0].GDP);
            });

        d3.selectAll('.crop')
            .style('height', function(d){
                return (heightScale(d.GDP) * d.percentOfSubtotal);
            });

    } else{
        // console.log('unchecked!');

        d3.selectAll('.country')
            .style('height', height);

        d3.selectAll('.crop')
            .style('height', function(d){
                // console.log('changing crop height');
                return ((height) * d.percentOfSubtotal); })
    }
}

function onClick(d, i, nodes){
    console.log('in click');

    // select all but node selected
    var toRemove = d3.selectAll('.country')
        .filter(function(x){ return d[0].Country != x[0].Country; });

    // if this is the only one there then return the others
    if (toRemove._groups[0].length === 0){
        // first remove svg from previous click drilldowns
        d3.select('.drilldown').remove();

        // display all bars
        displayBars(grouped);
        // remove highlight on ghost dot
        d3.select(`circle.${d[0].Country.replace(/\s/g, '')}`)
            .classed('active', false);

     // otherwise, remove others and plot drilldown
    }else {
        console.log(d[0].Country);

        d3.select(`circle.${d[0].Country.replace(/\s/g, '')}`)
            .classed('active',true);

        let drilldown = plot.append('svg')
            .attr('class', 'drilldown')
            .attr('height', height)
            .attr('width', width-divW);

        let dWidth = drilldown.node().getBoundingClientRect().width;

        drilldown.append('text')
            .attr('class', 'drilldownHeader')
            .attr('text-anchor', 'middle')
            .attr('x', (dWidth)/2)
            .attr('y', '5%')
            .text(d[0].Country);

        toRemove.remove();
    }

    // console.log(toRemove);
    // console.log(toRemove._groups[0].length);
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
    country_hover.text(`${d.Country} - ${Math.round(d[m])}`)
        // .attr("transform", "translate(0,480)")
        .style("top", (titleHeight + ghostAxisHeight + ghostAxisHeight/3) + 'px')
        // .style("top", '90%')
        .style("left", (d3.event.pageX - divW) + "px");

    d3.select(`circle.${d.Country.replace(/\s/g, '')}`)
        .classed('hover', true)
        .moveToFront();

}

function onMouseOut(d){
    tool_tip.transition()
        .duration(500)
        .style('opacity', 0);

    country_hover.transition()
        .duration(200)
        .style("opacity", 0);

    d3.selectAll(`.${d.Country.replace(/\s/g, '')}`)
        .classed('hover', false);
}

function onYearSelect(){
    console.log(this);
    year = +d3.select(this).property('value');
    // console.log(d3.select(this));
    console.log(`year changed to ${year}`);
    updateData();
}

function onMetricSelect(){
    metric = d3.select(this).property('value');
    console.log(metric);
    updateData();
}

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};
