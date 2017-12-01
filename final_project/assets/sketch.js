
var metricMapping = {
    'Worker Productivity': {
        "dataName": "AgriValuePerWorker",
        "fullName": "Agriculture value added per worker (constant 2010 US$)",
        "unit_long": "constant 2010 US$",
        "unit": "$",
        "description": "Agriculture value added per worker is a measure of agricultural productivity. Value added in agriculture measures the output of the agricultural sector (ISIC divisions 1-5) less the value of intermediate inputs. Agriculture comprises value added from forestry, hunting, and fishing as well as cultivation of crops and livestock production. Data are in constant 2010 U.S. dollars.",
        "source": "Derived from World Bank national accounts files and Food and Agriculture Organization, Production Yearbook and data files."
    },
    'Food Deficit': {
        "dataName": "FoodDeficit",
        "fullName": "Depth of the food deficit (kilocalories per person per day)",
        "unit_long": "kilocalories per person per day",
        "unit": "kcal",
        "description": "The depth of the food deficit indicates how many calories would be needed to lift the undernourished from their status, everything else being constant. The average intensity of food deprivation of the undernourished, estimated as the difference between the average dietary energy requirement and the average dietary energy consumption of the undernourished population (food-deprived), is multiplied by the number of undernourished to provide an estimate of the total food deficit in the country, which is then normalized by the total population.",
        "source":  "Food and Agriculture Organization, Food Security Statistics."
    },
    'Fertilizer Consumption': {
        "dataName": 'FertilizerConsumpPerHA',
        "fullName": "Fertilizer consumption (kilograms per hectare of arable land)",
        "unit_long": "kilograms per hectare of arable land",
        "unit": "kg",
        "description": "Fertilizer consumption measures the quantity of plant nutrients used per unit of arable land. Fertilizer products cover nitrogenous, potash, and phosphate fertilizers (including ground rock phosphate). Traditional nutrients--animal and plant manures--are not included. For the purpose of data dissemination, FAO has adopted the concept of a calendar year (January to December). Some countries compile fertilizer data on a calendar year basis, while others are on a split-year basis. Arable land includes land defined by the FAO as land under temporary crops (double-cropped areas are counted once), temporary meadows for mowing or for pasture, land under market or kitchen gardens, and land temporarily fallow. Land abandoned as a result of shifting cultivation is excluded.",
        "source": "Food and Agriculture Organization, electronic files and web site."
    }
    // 'Income Share of Lowest 20%':'IncomeShareLowest20'
};

var agData, data, divW, gdp, metricArray;

var width, height, ghostHeight;

var countries, crops, x;

// set starting values
var year = 2010,
    metric = 'Worker Productivity',
    m; // current underlying metric

var title = d3.select('.title')
    .append('h2')
    .text('Agricultural Crop Profiles of Countries in Sub-Saharan Africa');

// create year dropdown
var yearSelect = d3.select('.year')
    .append('select')
    .on('change', onYearSelect);

var metricSelect = d3.select('.metric')
    .append('select')
    .on('change', onMetricSelect);

var scaleSelect = d3.select('.scale')
    .append('input')
    .attr('id', 'scaleSelect')
    .attr('type', 'checkbox')
    .on('change', scale);

d3.select('.scale')
    .append('label')
    .attr('for', 'scaleSelect')
    .text('scale by gdp (log)');

// create main scatterplot svg
var plot = d3.select('.plot')
    .append('div')
    .attr('class', 'plot')
    .style('height','70%')
    .style('width', '100%');

var ghostAxis = d3.select('.plot')
    .append('svg')
    .attr('class', 'ghost')
    .style('height','75px')
    .style('width', '100%');

// create tooltip -- later move it to location of hover
var tool_tip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);


setup();

// get svg widths and heights
function setup(){
    width = plot.node().offsetWidth;
    height = plot.node().offsetHeight;

    ghostHeight = ghostAxis.node().getBoundingClientRect().height;

    console.log(`width: ${width} height: ${height} ghostHeight: ${ghostHeight}`);
}

// get data
d3.json('data/cropdata.json', function(err, dat){
    agData = dat;
    // console.log(agData);

    // get array of unique years from data -- use to populate dropdown
    var years = _.uniq(_.map(dat, 'Time'));
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
    // initialize 2 arrays in order to find extrema for this data subset
    gdp = [];
    metricArray = [];

    // get column name
    m = metricMapping[metric].dataName;

    // filter the data to the selected year
    var agDataF = _.filter(agData, function(d){return ((+d.Time === year) && d.hasOwnProperty(m) && !(d[m] === "..") ); });

    // reverse to get the crops in order form smallest to largest %
    agDataF = _.reverse(agDataF);

    // group by country
    data = _.groupBy(agDataF, function(d){ return d.Country; });

    // to get countries in ascending order of metric
    data = _.sortBy(data, function(d){ return + d[0][m]; });
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

    // for the cases where displayBars is called from a metric change
    d3.select('.drilldown').remove();

    divW = width / (data.length);

    x = d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.06)
        .paddingOuter(0)
        .domain(data.map(function(d) { return d[0].Country; }));

    /* Begin Plotting Bars*/
    var countryData = plot.selectAll('div.country')
        .data(data, function (d) { return d[0].Country; });

    countries = countryData.enter()
        .append('div')
        .merge(countryData)
        .attr('class', function (d) { return `${d[0].Country.replace(/\s/g, '')} country`;})
        .style('position', 'absolute')
        .style('left',function(d){ return `${x(d[0].Country)}px`;})
        .attr('data-AgriValuePerWorker', function (d) { return d[0].AgriValuePerWorker; })
        .attr('data-FertilizerConsumpPerHA', function (d) {return d[0].FertilizerConsumpPerHA; })
        .attr('data-FoodDeficit', function (d) { return d[0].FoodDeficit; })
        .attr('data-IncomeShareLowest20', function (d) { return d[0].IncomeShareLowest20; })
        .style('width', x.bandwidth())
        .on('click', onClick);

    countryData.exit().remove();

    var cropData = countries.selectAll('div')
        .data(function (d) { return d;});

    crops = cropData.enter()
        .append('div')
        .merge(cropData)
        .attr('class', function (d) {
            var item = d.Item.replace(/\s/g, '').split(',')[0].split('(')[0];
            return `${item} crop`;
        })
        .style('width', x.bandwidth())
        .on("mouseover", function (d) { onMouseover(d);})
        .on('mouseout', function (d) { onMouseOut(d);});

    cropData.exit().remove();
    scale();
    /* Finish Plotting Bars*/
}

function drawGhostCircles(){
    /* Begin Plotting Ghost Axis*/
    var r = 7;
    var barPadding = 10; // to make it line up with the bars below
    let textY = ghostHeight - 2 * r;

    let ghostX = d3.scaleLinear()
        .domain([d3.min(metricArray), d3.max(metricArray)])
        .range([r + barPadding, width - r - barPadding]);

    var ghostCirclesData = ghostAxis.selectAll('circle')
        .data(data);

    var ghostCircles = ghostCirclesData.enter()
        .append('circle')
        .merge(ghostCirclesData)
        .attr('class', function(d){ return `${d[0].Country.replace(/\s/g, '')} ghost`; })
        .attr(`d_${m}`, function(d){ return `${d[0][m]}_${ghostX(d[0][m])}`; });

    ghostCircles.transition()
        .duration(2000)
        .attr('cx', function(d){ return ghostX(d[0][m]); })
        .attr('cy', ghostHeight - 6 * r)
        .attr('r', r)
        .style('opacity', 0.7);

    ghostCircles.on('mouseover', function(d) {countryHoverOn(d[0].Country);})
        .on('mouseout', function(d) {countryHoverOff(d[0].Country);});

    ghostCirclesData.exit().remove();
    ghostAxis.selectAll('text').remove();

    // metric maximum label
    ghostAxis.append('text')
        .attr('class', 'ghostLabel')
        .transition().duration(1000)
        .attr('x', barPadding)
        .attr('y', textY)
        .text(function(){
            // determine whether the metric comes before or after the value
            let formattedMetric = (metric === 'Worker Productivity') ?
               metricMapping[metric].unit + Math.round(d3.min(metricArray)) :
                Math.round(d3.min(metricArray)) + ' ' + metricMapping[metric].unit ;
           return formattedMetric;
        });

    // metric minimum label
    ghostAxis.append('text')
        .attr('class', 'ghostLabel')
        .attr('text-anchor', 'end')
        .transition().duration(1000)
        .attr('x', width - barPadding)
        .attr('y', textY)
        .text(function(){
            // determine whether the metric comes before or after the value
            return (metric === 'Worker Productivity') ?
                metricMapping[metric].unit + Math.round(d3.max(metricArray)) :
                Math.round(d3.max(metricArray)) + ' ' + metricMapping[metric].unit ;
        });

    // mame of metric
    ghostAxis.append('text')
        .attr('class', 'ghostLabel')
        .transition().duration(1000)
        .attr('text-anchor', 'middle')
        .attr('x', width/2)
        .attr('y', textY)
        .text(`${metric} (${metricMapping[metric].unit_long}) -->`);

    // put in country codes as axes
    var countryCodes = ghostAxis.selectAll('text.countryCode')
        .data(data);

    countryCodes.enter()
        .append('text')
        .merge(countryCodes)
        .attr('class', function(d){ return `${d[0].Country.replace(/\s/g, '')} countryCode`; })
        .attr('x', function(d) {return x(d[0].Country); })
        .attr('y', r * 2)
        .text(function(d){ return d[0]["Country.Code"]})
        .attr('opacity', 0);

    countryCodes.exit().remove();

    /* Finish Plotting Ghost Axis*/
}

function scale(){
    if (scaleSelect.property('checked')){

        var heightScale = d3.scaleLog()
            .domain([d3.min(gdp), d3.max(gdp)])
            .range([10, height]);

        d3.selectAll('.country')
            .style('height', function(d){return heightScale(d[0].GDP);})
            .style('top', function (d){ return height - heightScale(d[0].GDP); });

        d3.selectAll('.crop')
            .style('height', function(d){ return (heightScale(d.GDP) * d.percentOfSubtotal);});

    } else{

        d3.selectAll('.country')
            .style('height', height)
            .style('top', 0);

        d3.selectAll('.crop')
            .style('height', function(d){ return ((height) * d.percentOfSubtotal); })
    }
}

function onClick(d, i, nodes){
    console.log('in click');

    // select all but node selected
    var toRemove = d3.selectAll('.country')
        .filter(function(x){ return d[0].Country != x[0].Country; });

    if (toRemove._groups[0].length === 0){ // bringing the full view back

        // first remove svg from previous click drilldowns
        d3.select('.drilldown').remove();

        // display all bars
        displayBars();

        // remove highlight on ghost dot
        d3.select(`circle.${d[0].Country.replace(/\s/g, '')}`)
            .classed('active', false);

     // otherwise, remove others and plot drilldown
    }else {
        console.log(d[0].Country);

        d3.select(this)
            .style('left', '10px');

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

function onMouseover(d) {
    tool_tip.transition()
        .duration(200)
        .style("opacity", .9);

    tool_tip.html(function () {
        let formattedMetric = (metric === 'Worker Productivity') ?
            metricMapping[metric].unit + Math.round(d[m]) :
            Math.round(d[m]) + ' ' + metricMapping[metric].unit;

        return `<h4>${d.Country}</h4>
            <p><b>Crop:</b> ${d.Item} (${Math.round(d.percentOfTotal * 100)}% total crops)</p>
            <p><b>${metric}:</b> ${formattedMetric}</p>
            <p><b>Year:</b> ${d.Time}</p>`;
    })
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");

    countryHoverOn(d.Country);
    d3.selectAll(`.ghost.${d.Country.replace(/\s/g, '')}`).moveToFront();
}

function onMouseOut(d){
    tool_tip.transition()
        .duration(500)
        .style('opacity', 0);

    countryHoverOff(d.Country);
}

function countryHoverOn (country){
    return d3.selectAll(`.${country.replace(/\s/g, '')}`)
        .classed('hover', true)
        // .moveToFront();
}

function countryHoverOff(country){
    d3.selectAll(`.${country.replace(/\s/g, '')}`)
        .classed('hover', false);
}

function onYearSelect(){
    console.log(this);
    year = +d3.select(this).property('value');
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

window.addEventListener("resize", function(){
    setup();
    displayBars();
    drawGhostCircles();
});
