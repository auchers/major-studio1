
var metricMapping = {
    'Worker Productivity': "AgriValuePerWorker",
    'Food Deficit': "FoodDeficit",
    'Fertilizer Consumption': 'FertilizerConsumpPerHA'
    // 'Income Share of Lowest 20%':'IncomeShareLowest20'
};

var agData, data, divW, gdp, metricArray;

var heightScale, crops;
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

var ghostAxis = d3.select('.title')
    .append('svg')
    .attr('class', 'ghost')
    .style('height','50px')
    .style('width', '100%');

// create main scatterplot svg
var plot = d3.select('.plot')
    .append('svg')
    .attr('class', 'plot')
    .attr('height','100%')
    .attr('width', '100%');

var width = d3.select('svg.plot').node().getBoundingClientRect().width;
var height = d3.select('svg.plot').node().getBoundingClientRect().height;

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
d3.json('data/cropdata.json', function(err, d){
    agData = d;
    // console.log(agData);

    // get array of unique years from data -- use to populate dropdown
    var years = _.uniq(_.map(d, 'Time'));
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
    data = _.groupBy(agDataF, function(d){ return d.Country; });
    data = _.sortBy(data, function(d){ return +d[0][m]; }); // sort by metric of choice
    data = _.values(data);
    console.log(data);

    // TODO - populate this on full dataset so that we don't change scale with each filtering
    data.forEach(function(d){
        gdp.push(+d[0].GDP);
        metricArray.push(+d[0][m]);
    });

    displayBars();
    drawGhostCircles();
}

function displayBars() {
    /*Width of Bars*/
    divW = width / (data.length);

    var x = d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.05)
        // .align(0.1)
        .domain(data.map(function(d) { return d[0].Country; }));

    heightScale = d3.scaleLog()
        .domain([d3.min(gdp), d3.max(gdp)])
        .range([10, height]);

    /* Begin Plotting Bars*/
    var countryData = plot.selectAll('g')
        .data(data, function (d) {
            return d.Country;
        });

    var countries = countryData.enter()
        .append('g')
        .merge(countryData)
        .attr('class', function (d) {return `${d[0].Country.replace(/\s/g, '')} country`;})
        .attr('data-AgriValuePerWorker', function (d) {return d[0].AgriValuePerWorker; })
        .attr('data-FertilizerConsumpPerHA', function (d) {return d[0].FertilizerConsumpPerHA; })
        .attr('data-FoodDeficit', function (d) { return d[0].FoodDeficit; });

    countries.transition()
            .duration(2000)
            .attr("transform", function (d) { return `translate(${x(d[0].Country)},0)`; });
        // .on('click', onClick);

    var cropData = countries.selectAll('rect')
        .data(function (d) { return d;});

    countryData.exit().remove();
    cropData.exit().remove();

    let y = height;

    //TODO make cleaner
    crops = cropData.enter()
        .append('rect')
        .merge(cropData)
        .attr('class', function (d) {
            let item = d.Item.replace(/\s/g, '').split(',')[0].split('(')[0];
            return `${item} crop`;
        })
        .attr('y', function (d,i){
            // reinitializing to full height for first element in each country
            if (i === 0) {y = height;}
            let curHeight = (scaleSelect.property('checked')) ? (heightScale(d.GDP) * d.percentOfSubtotal):
                (height * d.percentOfSubtotal);
                y = y - curHeight;
            // }
            return y;
        })
        .attr('height', function(d){
            return (scaleSelect.property('checked')) ? (heightScale(d.GDP) * d.percentOfSubtotal):
                (height * d.percentOfSubtotal);
        })
        .attr('width', x.bandwidth())
        .attr('x', 0);

    crops.on("mouseover", function (d) {onMouseover(d); })
        .on('mouseout', function (d) {onMouseOut(d); });

    /* Finish Plotting Bars*/
}

function drawGhostCircles(){
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
    console.log('in scale function');

    crops.transition()
        .duration(2000)
        .attr('height', function(d){
            return (scaleSelect.property('checked')) ? (heightScale(d.GDP) * d.percentOfSubtotal):
                (height * d.percentOfSubtotal);
        })
        .attr('y', function (d,i){
            console.log(i);
            // reinitializing to full height for first element in each country
            if (i === 0) {y = height;}
            let curHeight = (scaleSelect.property('checked')) ? (heightScale(d.GDP) * d.percentOfSubtotal):
                (height * d.percentOfSubtotal);
            y = y - curHeight;
            // }
            return y;
        });
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
        displayBars(data);
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
    console.log(d);
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
