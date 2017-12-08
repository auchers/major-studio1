var metricMapping = {
    'Worker Productivity': {
        "dataName": "AgriValuePerWorker",
        "fullName": "Agriculture value added per worker (constant 2010 US$)",
        "unit_long": "(constant 2010 US$)",
        "unit": "$",
        "description": "Agriculture value added per worker is a measure of agricultural productivity. Value added in agriculture measures the output of the agricultural sector (ISIC divisions 1-5) less the value of intermediate inputs. Agriculture comprises value added from forestry, hunting, and fishing as well as cultivation of crops and livestock production. Data are in constant 2010 U.S. dollars.",
        "source": "Derived from World Bank national accounts files and Food and Agriculture Organization, Production Yearbook and data files."
    },
    'Food Deficit': {
        "dataName": "FoodDeficit",
        "fullName": "Depth of the food deficit (kilocalories per person per day)",
        "unit_long": "(kilocalories per person per day)",
        "unit": "kcal",
        "description": "The depth of the food deficit indicates how many calories would be needed to lift the undernourished from their status, everything else being constant. The average intensity of food deprivation of the undernourished, estimated as the difference between the average dietary energy requirement and the average dietary energy consumption of the undernourished population (food-deprived), is multiplied by the number of undernourished to provide an estimate of the total food deficit in the country, which is then normalized by the total population.",
        "source":  "Food and Agriculture Organization, Food Security Statistics."
    },
    'Fertilizer Consumption': {
        "dataName": 'FertilizerConsumpPerHA',
        "fullName": "Fertilizer consumption (kilograms per hectare of arable land)",
        "unit_long": "(kilograms per hectare of arable land)",
        "unit": "kg",
        "description": "Fertilizer consumption measures the quantity of plant nutrients used per unit of arable land. Fertilizer products cover nitrogenous, potash, and phosphate fertilizers (including ground rock phosphate). Traditional nutrients--animal and plant manures--are not included. For the purpose of data dissemination, FAO has adopted the concept of a calendar year (January to December). Some countries compile fertilizer data on a calendar year basis, while others are on a split-year basis. Arable land includes land defined by the FAO as land under temporary crops (double-cropped areas are counted once), temporary meadows for mowing or for pasture, land under market or kitchen gardens, and land temporarily fallow. Land abandoned as a result of shifting cultivation is excluded.",
        "source": "Food and Agriculture Organization, electronic files and web site."
    },
    'Gini':{
        "dataName": 'Gini',
        "fullName": "Income Inequality Coeficient (Gini)",
        "unit_long": "",
        "unit": "",
        "description": "",
        "source": "UNDP HDI Site"
    }

    // 'Income Share of Lowest 20%':'IncomeShareLowest20'
};

var scaleMapping = {
    // "GDP (log)": {
    //     "dataName": "GDP",
    //     "scaleType": "Log",
    //     "description": "[in current US$]"
    // },
    // "Land Area": {
    //     "dataName": "LandAreaSqMeters",
    //     "scaleType": "Linear",
    //     'description': "[in sq. meters]"
    // },
    "Worker Productivity": {
        "dataName": "AgriValuePerWorker",
        "scaleType": "Log",
        "description": "[in US$]"
    },
    'Gini': {
        "dataName": 'Gini',
        "scaleType": "Linear",
        'description': ""
    }
    // ,
    // 'Rural Poverty': {
    //     "dataName": 'RuralPovGap',
    //     "scaleType": "Linear"
    // }
};

var agData, data, metricArray;

var width, height, fullSVGheight, ghostHeight;

var countries, crops, x;

// set starting values
var year = 2014,
    metric = 'Worker Productivity',
    m, // current underlying metric
    curScale = 'reset'; // current scale choice

//todo: add arrows to dropdown
// create year dropdown
var yearSelect = d3.select('.year')
    .append('select')
    .on('change', onYearSelect);

var metricSelect = d3.select('.metric')
    .append('select')
    .on('change', onMetricSelect);

var scaleSelect = d3.select('.scale');

// map metric options to dropdown options
var metrics = Object.keys(metricMapping);
metricSelect.selectAll('option')
    .data(metrics)
    .enter()
    .append('option')
    .text(function(d){ return d; })
    .property("selected", function(d){ return d === metric; }); //sets defaults value;

// map scale options to buttons
var scales = Object.keys(scaleMapping);
scaleSelect.selectAll('button')
    .data(scales)
    .enter()
    .append('button')
    .attr('class', function(d) { return `btn btn-outline-info scale ${d}`; })
    .html(function(d){ return d; })
    .on('click', scale);

// initialize arrays in order to find extrema for this data subset
scales.forEach(function(d){ scaleMapping[d].data = []; });

d3.selectAll('button.scale')
    .attr('data-toggle', 'tooltip')
    .attr('data-html', 'true')
    .attr('data-placement', "top")
    .attr('title', function(d){
        return scaleMapping[d].description;
    });

// create main scatterplot svg
var plot = d3.select('.plot')
    .append('div')
    .attr('class', 'plot')
    .style('height','65%')
    .style('width', '100%');

var ghostAxis = d3.select('.svg')
    .append('svg')
    .attr('class', 'ghost')
    .style('height','75px')
    .style('width', '100%')
    .style('overflow', 'visible');

// create tooltip -- later move it to location of hover
var tool_tip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

getWidthandHeight();

// get svg widths and heights
function getWidthandHeight(){
    width = plot.node().offsetWidth;
    fullSVGheight = plot.node().offsetHeight;
    height = fullSVGheight * 0.9;

    ghostHeight = ghostAxis.node().getBoundingClientRect().height;

    console.log(`width: ${width} height: ${height} ghostHeight: ${ghostHeight}`);
}

// get data
d3.json('data/cropdata.json', function(err, dat){
    agData = dat;

    // get array of unique years from data -- use to populate dropdown
    var years = _.uniq(_.map(dat, 'Time'));

    // Fill in years drop down
    yearSelect.selectAll('option')
        .data(years)
        .enter()
        .append('option')
        .text(function(d){ return d; })
        .property("selected", function(d){ return +d === year; }); //sets defaults value

    // display plot
    updateData();
});

function updateData(){
    // initialize arrays in order to find extrema for this data subset
    metricArray = []; // for x axis (ghost circles)

    // get column name
    m = metricMapping[metric].dataName;

    // filter the data to the selected year and with all the sorting metrics
    var agDataF = _.filter(agData, function(d){
        let isFullData = true;

        // checks to make sure country has data for each metric
        metrics.forEach(function(curM, i){
            if (!d[metricMapping[curM].dataName] || d[metricMapping[curM].dataName] === "..") isFullData = false;
        });

        return ((+d.Time === year) && isFullData);
    });

    // reverse to get the crops in order form smallest to largest %
    agDataF = _.reverse(agDataF);

    // group by country
    data = _.groupBy(agDataF, function(d){ return d.Country; });

    // to get countries in ascending order of metric
    data = _.sortBy(data, function(d){ return + d[0][m]; });
    console.log(data);

    data.forEach(function(d){
        scales.forEach(function(i){
            let dataName = scaleMapping[i].dataName;
            scaleMapping[i].data.push(+d[0][dataName]);
        });
        metricArray.push(+d[0][m]);
    });

    displayBars();
    drawGhostCircles();
}

function displayBars() {
    /*Width of Bars*/

    // for the cases where displayBars is called from a metric change
    d3.select('.drilldown').remove();

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
        .style('transform', `translate(0px, ${fullSVGheight - height}px)`)
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
    scale(false);
    /* Finish Plotting Bars*/
}

function drawGhostCircles(){
    /* Begin Plotting Ghost Axis*/
    var r = 7;
    var barPadding = 10; // to make it line up with the bars below
    let tallTickHeight = 30;

    // x scale for ghost circles
    let ghostX = d3.scaleLinear()
        .domain([d3.min(metricArray), d3.max(metricArray)])
        .range([r + barPadding, width - r - barPadding]);

    let axis = d3.axisBottom(ghostX);

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
        .attr('cy', r)
        .attr('r', r)
        .style('opacity', 0.7);

    ghostCircles.on('mouseover', function(d) {countryHoverOn(d[0].Country);})
        .on('mouseout', function(d) {countryHoverOff(d[0].Country);})
        .on('click', onClick);

    ghostCirclesData.exit().remove();
    ghostAxis.selectAll('text').remove();
    ghostAxis.selectAll('g').remove();

    // call axis
    let g = ghostAxis.append('g')
        .attr('class', 'ghostAxis')
        .attr("transform", `translate(0, ${3*r})`);

    // g.call(axis);

    // min tick mark
    let min = g.append('g')
        .attr('class', 'tick')
        .attr("transform", `translate(${ghostX.range()[0]-r} ,0)`);

    min.append('line')
        .attr('y2', tallTickHeight);

    // metric minimum label
    min.append('text')
        .attr('class', 'ghostLabel')
        .transition().duration(1000)
        .attr("transform", `translate(5, ${tallTickHeight * .7})`)
        .text(function(){
            // determine whether the metric comes before or after the value
            return (metric === 'Worker Productivity') ?
               metricMapping[metric].unit + Math.round(d3.min(metricArray)) :
                Math.round(d3.min(metricArray)) + ' ' + metricMapping[metric].unit ;
        });

    // max tick mark
    let max = g.append('g')
        .attr('class', 'tick')
        .attr("transform", `translate(${ghostX.range()[1]+r} ,0)`);

    max.append('line')
        .attr('y2', tallTickHeight);

    // metric maximum label
    max.append('text')
        .attr('class', 'ghostLabel')
        .attr('text-anchor', 'end')
        .transition().duration(1000)
        .attr("transform", `translate(-5, ${tallTickHeight * .7})`)
        .text(function(){
            // determine whether the metric comes before or after the value
            return (metric === 'Worker Productivity') ?
                metricMapping[metric].unit + Math.round(d3.max(metricArray)) :
                Math.round(d3.max(metricArray)) + ' ' + metricMapping[metric].unit;
        });

    // mame of metric
    g.append('text')
        .attr('class', 'ghostLabel')
        .transition().duration(1000)
        .attr('text-anchor', 'middle')
        .attr('x', width/2)
        .attr('y', tallTickHeight)
        .text(`${metric} ${metricMapping[metric].unit_long}`)
        // todo: change to make hover work
        .attr('data-toggle', 'tooltip')
        .attr('data-html', 'true')
        .attr('data-placement', "top")
        .attr('title',metricMapping[metric].description);

    /* Finish Plotting Ghost Axis*/
}

function scale(isReScaled = true){
    if (isReScaled) { // case when a scale button is pushed
        // if there is no button push, or it is the same as the previous push, reset the bars
        curScale = ((curScale === scaleMapping[this.innerHTML]) || (scaleMapping[this.innerHTML] === undefined))
            ? 'reset' : scaleMapping[this.innerHTML];

        //todo: bug with active when clicking on multiple buttons after each other
        // add active class when button is active
        // d3.select(this).classed("active", d3.select(this).classed("active") ? false : true);
    }
    // otherwise, keep the last scale value (because it is being called from the end of displayBars()

    if (curScale === 'reset') { // resetting bars to full height
        d3.selectAll('.countryLabel').remove();

        d3.selectAll('.country')
            .style('height', height)
            .style('top', 0);

        d3.selectAll('.crop')
            .style('height', function(d){ return ((height) * d.percentOfSubtotal); });
    }
    else{ // scaling the bars by the button choice
        let scaleType = 'scale'+curScale.scaleType;
        let curData = curScale.dataName; // column name corresponding to the scale choice
        let labelDist = 5;

        var heightScale = d3[scaleType]()
            .domain([d3.min(curScale.data), d3.max(curScale.data)])
            .range([10, height]);


        d3.selectAll('.country')
            .style('height', function(d){return heightScale(d[0][curData]);})
            .style('top', function (d){ return height - heightScale(d[0][curData]); });

        d3.selectAll('.crop')
            .style('height', function(d){ return (heightScale(d[curData]) * d.percentOfSubtotal);});

        // setTimeout(callCountryLabels();

        // setTimeout(function(){
            callCountryLabels();
            d3.selectAll('.countryLabel')
                .style('bottom', function (d){ return (heightScale(d[0][curData])); });
        // }, 1000);


    }
}

function callCountryLabels(){

    var labelData = plot.selectAll('.countryLabel')
        .data(data, function (d) { return d[0].Country; });
        // .style('opacity', 0);

    countryLabels = labelData.enter()
        .append('div')
        .merge(labelData)
        .attr('class', function (d) { return `${d[0].Country.replace(/\s/g, '')} countryLabel`;})
        .attr('text-anchor', 'start')
        .style('left',function(d){ return `${x(d[0].Country) + x.bandwidth()/2}px`;})
        .text(function(d){ return d[0].Country; })
        .style('opacity', 1);

    labelData.exit().remove();
}

function onClick(d, i, nodes){
    console.log('in click');

    // select all but node selected
    var toRemove = d3.selectAll('.country')
        .filter(function(x){ return d[0].Country !== x[0].Country; });


    if ((toRemove._groups[0].length < 2)){ // bringing the full view back

        // first remove svg from previous click drilldowns
        d3.select('.drilldown').remove();

        // display all bars
        displayBars();

        // remove highlight on ghost dot
        d3.selectAll('circle')
            .classed('active', false);

        console.log(d[0].Country);
     // otherwise, remove others and plot drilldown
    }else {
        d3.selectAll('.countryLabel').remove();
        d3.select(`.country.${d[0].Country.replace(/\s/g,'')}`)
            .style('left', '10px');

        d3.select(`circle.${d[0].Country.replace(/\s/g, '')}`)
            .classed('active',true);

        let drilldown = plot.append('svg')
            .attr('class', 'drilldown')
            .attr('height', height)
            .attr('width', width- x.bandwidth());

        let dWidth = drilldown.node().getBoundingClientRect().width;

        drilldown.append('text')
            .attr('class', 'drilldownHeader')
            .attr('text-anchor', 'middle')
            .attr('x', (dWidth)/2)
            .attr('y', '30%')
            .text(d[0].Country);

        // drilldown.append('text')
        //     .attr('class', 'drilldownContent')
        //     .attr('text-anchor', 'middle')
        //     .attr('x', (dWidth)/2)
        //     .attr('y', '40%')
        //     .html(
        //         `GDP: $${d[0].GDP}
        //         Gini: ${d[0].Gini}
        //         `
        //     );

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
            <div><b>${d.Item} (${Math.round(d.percentOfTotal * 100)}% of total crops)</b></div>
            <br>
            <p>${metric}: ${formattedMetric}</p>
            <br>
            <p>Gini: ${d.Gini}</p>`;
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

function countryHoverOn(country){
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
    getWidthandHeight();
    displayBars();
    drawGhostCircles();
});

// $(function () {
//     $('[data-toggle="tooltip"]').tooltip()
// })