window.onbeforeunload = function () {
    window.scrollTo(0, 0);
};

var scaleMapping ={
    'Worker Productivity': {
        "dataName": "AgriValuePerWorker",
        "scaleType": "Linear",
        "fullName": "Agriculture value added per worker (constant 2010 US$)",
        "unit_long": "(constant 2010 US$)",
        "unit": "$",
        "description": "Agriculture value added per worker is a measure of agricultural productivity. Value added in agriculture measures the output of the agricultural sector (ISIC divisions 1-5) less the value of intermediate inputs. Agriculture comprises value added from forestry, hunting, and fishing as well as cultivation of crops and livestock production. Data are in constant 2010 U.S. dollars.",
        "source": "Derived from World Bank national accounts files and Food and Agriculture Organization, Production Yearbook and data files."
    },
    'Gini': {
        "dataName": 'avgGini',
        "scaleType": "Linear",
        'description': "",
        "unit_long": "",
        "unit": "",
    },
    'Fertilizer Consumption': {
        "dataName": 'FertilizerConsumpPerHA',
        "scaleType": "Linear",
        "fullName": "Fertilizer consumption (kilograms per hectare of arable land)",
        "unit_long": "(kilograms per hectare of arable land)",
        "unit": "kg",
        "description": "Fertilizer consumption measures the quantity of plant nutrients used per unit of arable land. Fertilizer products cover nitrogenous, potash, and phosphate fertilizers (including ground rock phosphate). Traditional nutrients--animal and plant manures--are not included. For the purpose of data dissemination, FAO has adopted the concept of a calendar year (January to December). Some countries compile fertilizer data on a calendar year basis, while others are on a split-year basis. Arable land includes land defined by the FAO as land under temporary crops (double-cropped areas are counted once), temporary meadows for mowing or for pasture, land under market or kitchen gardens, and land temporarily fallow. Land abandoned as a result of shifting cultivation is excluded.",
        "source": "Food and Agriculture Organization, electronic files and web site."
    }

};

var WINDOW_HEIGHT;

var agData, data;

var width, plotHeight, fullSVGheight, ghostHeight;

var countries, crops, x;

var scrollTop = 0,
    newScrollTop = 0;

// set starting values
var year = 2014,
    metric = 'Worker Productivity',
    m = scaleMapping[metric].dataName, // current underlying metric
    curScale = 'reset'; // current scale choice

var plotContainer = d3.select('.plotContainer');
var body = d3.select('body');

// create main scatterplot svg
var plot = plotContainer
    .append('div')
    .attr('class', 'plot')
    .style('height','70vh')
    .style('width', '100%');

var scaleSelect = d3.select('.scale');

// map scale options to buttons
var scales = Object.keys(scaleMapping);
scaleSelect.selectAll('button')
    .data(scales)
    .enter()
    .append('button')
    .attr('class', function(d) { return `btn btn-outline-info scale ${d}`; })
    .html(function(d){ return d; })
    .on('click', function(d, i){
            metric = this.innerHTML || metric;

            // check to see if button was already active and save it to variable
            let isScaled = d3.select(this).classed('active');

            // remove all active tags to start fresh
            d3.selectAll('.scale').classed('active', false);


            if (isScaled){ // if is currently scaled, reset to full bars height
                curScale = 'reset';
            }
            else { // otherwise, set the scale to value of button pushed and make button active
                d3.select(this).classed('active', true);
                curScale = scaleMapping[metric];
            }
            // set sorting metric dataName
            m = curScale.dataName || m; // keep existing value if reset
            updateData(); // update data with new metric
    });

// initialize arrays in order to find extrema for this data subset
scales.forEach(function(d){ scaleMapping[d].data = []; });

d3.selectAll('button.scale')
    .attr('data-toggle', 'tooltip')
    .attr('data-html', 'true')
    .attr('data-placement', "top")
    .attr('title', function(d){
        return scaleMapping[d].description;
    });


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
    // window dimensions for scroll calculations
    // WINDOW_WIDTH = window.innerWidth / 2;
    WINDOW_HEIGHT = window.innerHeight;
    // SCROLL_LENGTH = content.node().getBoundingClientRect().height - HEIGHT

    // plot dimensions
    width = plot.node().offsetWidth;
    fullSVGheight = plot.node().offsetHeight;
    plotHeight = fullSVGheight * 0.8; //todo use this to change the height of the scaled bars by more

    ghostHeight = ghostAxis.node().getBoundingClientRect().height;

    console.log(`width: ${width} plotHeight: ${plotHeight} ghostHeight: ${ghostHeight}`);

    //TODO: set range of scroll height scales
}

// get data
d3.json('data/cropdata.json', function(err, dat){
    // reverse to get the crops in order form smallest to largest %
    agData = _.reverse(dat);

    // display plot
    updateData();
});

function updateData(){
    // filter the data to the selected year and with all the sorting metrics
    var agDataF = _.filter(agData, function(d){
        let isFullData = (d[m]) ? true : false ; // check to see that data available
        return ((+d.Time === year) && isFullData);
    });

    // fill data arrays for each scale to get extrema values later
    scales.forEach(function(i){
        let dataName = scaleMapping[i].dataName;
        scaleMapping[i].data = agDataF.map(function(d){ return (d[dataName])? +d[dataName] : null;});
    });

    // create scale for each metric
    scales.forEach(function(i){
        let scaleType = 'scale'+scaleMapping[i].scaleType;
        scaleMapping[i].scale = d3[scaleType]()
            .domain([d3.min(scaleMapping[i].data), d3.max(scaleMapping[i].data)])
            .range([10, plotHeight]);
    });

    // group by country
    data = _.groupBy(agDataF, function(d){ return d.Country; });

    // to get countries in ascending order of metric
    data = _.sortBy(data, function(d){ return + d[0][m]; });
    console.log(data);

    displayBars();
    drawGhostCircles();
}

function displayBars() {
    // for the cases where displayBars is called from a metric change
    d3.select('.drilldown').remove();

    x = d3.scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.06)
        .paddingOuter(0)
        .domain(data.map(function(d) { return d[0].Country; }));

    /* Begin Plotting Bars*/
    let countryData = plot.selectAll('div.country')
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

    let cropData = countries.selectAll('div')
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
    let r = 7;
    let barPadding = 5; // to make it line up with the bars below
    let tallTickHeight = 30;

    console.log('metric:', metric);
    // x scale for ghost circles
    let ghostX = d3.scaleLinear()
        .domain([d3.min(scaleMapping[metric].data), d3.max(scaleMapping[metric].data)])
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
               scaleMapping[metric].unit + Math.round(d3.min(scaleMapping[metric].data)) :
                Math.round(d3.min(scaleMapping[metric].data)) + ' ' + scaleMapping[metric].unit ;
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
                scaleMapping[metric].unit + Math.round(d3.max(scaleMapping[metric].data)) :
                Math.round(d3.max(scaleMapping[metric].data)) + ' ' + scaleMapping[metric].unit;
        });

    // mame of metric
    g.append('text')
        .attr('class', 'ghostLabel')
        .transition().duration(1000)
        .attr('text-anchor', 'middle')
        .attr('x', width/2)
        .attr('y', tallTickHeight)
        .text(`${metric} ${scaleMapping[metric].unit_long}`)
    /* Finish Plotting Ghost Axis*/
}

function scale(){
    if (curScale === 'reset') { // resetting bars to full height
        d3.selectAll('.countryLabel').remove();

        d3.selectAll('.country')
            .style('transform', `translate(0px, 0px)`)
            .style('height', fullSVGheight)
            .style('top', 0);

        d3.selectAll('.crop')
            .style('height', function(d){ return ((fullSVGheight) * d.percentOfTotal); });
    }
    else{ // scaling the bars by the button choice
        let curData = curScale.dataName; // column name corresponding to the scale choice
        // let labelDist = 5;

        let heightScale = curScale.scale;

        d3.selectAll('.country')
            .style('transform', `translate(0px, ${fullSVGheight - plotHeight}px)`)
            .style('height', function(d){return heightScale(d[0][curData]);})
            .style('top', function (d){ return plotHeight - heightScale(d[0][curData]); });

        d3.selectAll('.crop')
            .style('height', function(d){ return (heightScale(d[curData]) * d.percentOfTotal);});

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
            .attr('height', fullSVGheight)
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
            scaleMapping[metric].unit + Math.round(d[m]) :
            Math.round(d[m]) + ' ' + scaleMapping[metric].unit;

        return `<h4>${d.Country}</h4>
            <div><b>${d.Item} (${Math.round(d.percentOfTotal * 100)}% of total crops)</b></div>
            <br>
            <p>Worker Productivity: $${d.AgriValuePerWorker}</p>
            <br>
            <p>Gini: ${d.Gini}</p>
            <br>
            <p>Fertilizer Consumption: ${d.FertilizerConsumpPerHA}</p>`;
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


body.on("mousewheel", function() {
        newScrollTop = body.node().scrollTop / WINDOW_HEIGHT;
        // console.log(newScrollTop);
    });

var phases = {
    "phase0": {"start": 0, "end": 0.5},
    "phase1": {"start": 0.5, "end": 2},
    "phase2": {"start": 2, "end": 3},
    "phase3": {"start": 3, "end": 4},
    "phase4": {"start": 4, "end": 5}
};

var cropTransitionScale = d3.scaleLinear()
    .domain([phases["phase2"].start, phases["phase2"].end]);

var countryTransitionScale = d3.scaleLinear()
    .domain([phases["phase3"].start, phases["phase3"].end]);

var render = function() {
    if (scrollTop !== newScrollTop) {
        scrollTop = newScrollTop;

        // PHASE 1: Full bars based on crop subtotals
        if (scrollTop < phases["phase1"].end){
            d3.selectAll('.stickySentence').classed('active', false);

            // set headline to phase 1 explanation midway through full scroll length
            (scrollTop < phases["phase0"].end)? d3.select(`.stickySentence.phase0`).classed('active', true):
                d3.select(`.stickySentence.phase1`).classed('active', true);

            d3.selectAll('.country')
                .style('transform', `translate(0px, 0px)`)
                .style('height', fullSVGheight)
                .style('top', 0);

            // set crop heights to subtotals
            d3.selectAll('.crop')
                .filter(function(d){ return d.Item !== 'Other'})
                .style('height', function(d){ return ((fullSVGheight) * d.percentOfSubtotal); });

            d3.selectAll('.Other')
                .style('height', 0);
        }

        // PHASE 2: Full bars based on crop totals
        else if (scrollTop >= phases["phase2"].start && scrollTop < phases["phase2"].end){
            d3.selectAll('.stickySentence').classed('active', false);
            d3.select(`.stickySentence.phase2`).classed('active', true);

            // set crop heights (other than other) to subtotals * crop transition scale
            // set other to transition crop scale
            d3.selectAll('.country')
                .style('transform', `translate(0px, 0px)`)
                .style('height', fullSVGheight)
                .style('top', 0);

            d3.selectAll('.crop')
                .filter(function(d){ return d.Item !== 'Other'})
                .style('height', function(d){
                    // set range for scale adjustment
                    cropTransitionScale.range([1, d.subtotalValue/d.totalValue]);

                    // scale the crop height by its place in scroll transition
                    return ((fullSVGheight) * d.percentOfSubtotal * cropTransitionScale(scrollTop));
                });

            d3.selectAll('.Other')
                .style('height', function(d){
                    cropTransitionScale.range([0, d.percentOfTotal]);

                    return (fullSVGheight) * cropTransitionScale(scrollTop);
                });
        }

        // PHASE 3: Bars rescaled to worker productivity
        else if (scrollTop >= phases["phase3"].start && scrollTop < phases["phase3"].end){
            d3.selectAll('.stickySentence').classed('active', false);
            d3.select(`.stickySentence.phase3`).classed('active', true);

            // set country bar max to max times productivity transition scale
            // set crops to % of totals of new (scaled) max
            let heightScale = scaleMapping['Worker Productivity'].scale;

            d3.selectAll('.country')
                .style('height', function(d){
                    // set range for scroll triggered transition
                    countryTransitionScale
                        .range([1, d[0].AgriValuePerWorker / heightScale.domain()[1]]);

                    return plotHeight * countryTransitionScale(scrollTop);
                })
                .style('top', function (d){
                    // set range for scroll triggered transition
                    countryTransitionScale
                        .range([1, d[0].AgriValuePerWorker / heightScale.domain()[1]]);

                    return fullSVGheight - (plotHeight * countryTransitionScale(scrollTop));
                });

            d3.selectAll('.crop')
                .style('height', function(d){
                    countryTransitionScale
                        .range([1, d.AgriValuePerWorker / heightScale.domain()[1]]);
                    return plotHeight * countryTransitionScale(scrollTop) * d.percentOfTotal;
                });

            // callCountryLabels();
            // d3.selectAll('.countryLabel')
            //     .style('bottom', function (d){ return (heightScale(d[0][curData])); });


        }

        // PHASE 4: exploration phase
        else if (scrollTop >= phases["phase4"].start ){
            d3.selectAll('.stickySentence').classed('active', false);
            d3.select(`.stickySentence.phase4`).classed('active', true);

            // go to default interactive sort
        }
    }

    window.requestAnimationFrame(render)
};

window.requestAnimationFrame(render);

window.addEventListener("resize", function(){
    getWidthandHeight();
    displayBars();
    drawGhostCircles();
});

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};
