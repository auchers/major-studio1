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
        "dataName": 'Gini',
        "scaleType": "Linear",
        "fullName": "Gini Coefficient",
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
    // ,
    // 'Share of Employment in Agriculture':{
    //     "dataName": 'EmploymentShareInAg',
    //     "scaleType": "Linear",
    //     "fullName": "",
    //     "unit_long": "",
    //     "unit": "",
    //     "description": "",
    //     "source": "Food and Agriculture Organization, electronic files and web site."
    // }

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
    // todo: reverse gini scale
    scales.forEach(function(i){
        let scaleType = 'scale'+scaleMapping[i].scaleType;
        scaleMapping[i].scale = d3[scaleType]()
            .domain([d3.min(scaleMapping[i].data), d3.max(scaleMapping[i].data)])
            .range([10, plotHeight]);
    });

    // group by country
    data = _.groupBy(agDataF, function(d){ return d.Country; });

    // to get countries in ascending order of metric
    data = _.sortBy(data, function(d){
        return (metric === "Gini")? -d[0][m]: +d[0][m]; }); // reverse scale for gini
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

    ghostAxis.selectAll('text').remove();
    ghostAxis.selectAll('g').remove();

    console.log('metric:', metric);
    // x scale for ghost circles
    let ghostX = d3.scaleLinear()
        .domain([d3.min(scaleMapping[metric].data), d3.max(scaleMapping[metric].data)])
        .range([r + barPadding, width - r - barPadding]);

    // todo fix this more elegantly
    if (metric === 'Gini') ghostX.domain([d3.max(scaleMapping[metric].data), d3.min(scaleMapping[metric].data)]);

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
        .attr('cy', 2*r)
        .attr('r', r)
        .style('opacity', 0.7);

    ghostCircles.on('mouseover', function(d) {countryHoverOn(d[0].Country);})
        .on('mouseout', function(d) {countryHoverOff(d[0].Country);})
        .on('click', onClick);

    var textLabelsData = ghostAxis.selectAll('.label')
        .data(data);

    var textLabels = textLabelsData.enter()
        .append('text')
        .merge(textLabelsData)
        .attr('class', function(d){ return `${d[0].Country.replace(/\s/g, '')} label`; })
        .text(function(d){
            return formatNumbers(d[0][m]);
        });

    textLabels.transition()
        .duration(2000)
        .attr('x', function(d){ return ghostX(d[0][m]); })
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('opacity', 0);

    ghostCirclesData.exit().remove();
    textLabelsData.exit().remove();

    // call axis
    let g = ghostAxis.append('g')
        .attr('class', 'ghostAxis')
        .attr("transform", `translate(0, ${4*r})`);

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
            return formatNumbers(ghostX.domain()[0]);
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
            return formatNumbers(ghostX.domain()[1])
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

        if (scrollTop < phases["phase1"].end){
            d3.selectAll('.crop')
                .style('height', function(d){ return ((fullSVGheight) * d.percentOfSubtotal); });
        } else {
            d3.selectAll('.crop')
                .style('height', function(d){ return ((fullSVGheight) * d.percentOfTotal); });
        }

    }
    else{ // scaling the bars by the button choice
        let curData = curScale.dataName; // column name corresponding to the scale choice
        let heightScale = curScale.scale;

        d3.selectAll('.country')
            .style('height', function(d){return heightScale(d[0][curData]);})
            .style('top', function (d){ return fullSVGheight - heightScale(d[0][curData]); });

        d3.selectAll('.crop')
            .style('height', function(d){ return (heightScale(d[curData]) * d.percentOfTotal);});

            callCountryLabels();
            d3.selectAll('.countryLabel')
                .style('bottom', function (d){ return (heightScale(d[0][curData])); });

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
        return `<h4>${d.Country}</h4>
            <div><b>${d.Item} (${Math.round(d.percentOfTotal * 100)}% of total crops)</b></div>
            <br>
            <p>Worker Productivity: ${formatNumbers(d.AgriValuePerWorker, 'Worker Productivity')}</p>
            <br>
            <p>Gini: ${d.Gini}</p>
            <br>
            <p>Fertilizer Consumption: ${formatNumbers(d.FertilizerConsumpPerHA, 'Fertilizer Consumption')}</p>`;
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
        .moveToFront();
}

function countryHoverOff(country){
    d3.selectAll(`.${country.replace(/\s/g, '')}`)
        .classed('hover', false);
}

function formatNumbers(n, unit = metric){
    var formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    return (unit === 'Worker Productivity')? formatter.format(n): Math.round(n) + ' ' + scaleMapping[unit].unit;
}

/// SCROLLING BEHAVIOR DEFINED BELOW////

var phases = {
    "phase0": {
        "start": 0,
        "end": 1 * WINDOW_HEIGHT,
        "text1": "Scroll Down to Explore the Data"
    },
    "phase1": {
        "start": 1 * WINDOW_HEIGHT,
        "end": 2.5 * WINDOW_HEIGHT,
        "text1": "Top 5 Crops Distribution",
        "text2": "Each vertical bar depicts 1 country in sub-Saharan Africa. The images composing the bar represent the distribution of that country's top 5 crops (by yield)."
    },
    "phase2": {
        "start": 2.5 * WINDOW_HEIGHT,
        "end": 4 * WINDOW_HEIGHT,
        "text1": "Top 5 Crops Out of All Crops Distribution",
        "text2": "The original top 5 crops are now rescaled to show their proportion out of total crops. Remaining 'other' crops are shown in gray."
    },
    "phase3": {
        "start": 4 * WINDOW_HEIGHT,
        "end": 5.5 * WINDOW_HEIGHT,
        "text1": "Scaled by Worker Productivity",
        "text2": "Each bar is now rescaled according to that country's agriculture value added per worker."
    },
    "phase4": {
        "start": 5.5 * WINDOW_HEIGHT,
        "end": 7 * WINDOW_HEIGHT,
        "text1": "Explore Other Indicators",
        "text2": "Click on the buttons below to see the countries shuffle into a new order. The circles underneath give a sense for the distribution of the selected metric"
    }
};
let i = 0
for (p in phases){
    phases[p].scale = d3.scaleLinear()
        .domain([phases[p].start, phases[p].end]);

    d3.select('body')
        .append('a')
        .attr('id', p)
        .attr('class', 'snap')
        .style('position', 'absolute')
        // .text(p)
        .style('top', function(){
            // phase 4 stops to early to allow view of all the metrics and distributions
            return (p === 'phase4')? phases[p].end + 100 : phases[p].end;
        });

    var nextButton = plotContainer
        .append('button')
        .attr('class', 'navButton phase'+i)
        .text('Next')
        .attr('href', '#phase'+ (i+1))
        .style('visibility','hidden');

    i++;
}

var render = function() {
    newScrollTop = window.scrollY;
    if (scrollTop !== newScrollTop) {
        scrollTop = newScrollTop;

        console.log(scrollTop / WINDOW_HEIGHT, scrollTop);

        tool_tip
            .style('opacity', 0);

        // PHASE 0: Just set text instructions for scroll
        if (scrollTop < phases["phase0"].end){
            changeTransitionHeader(0);
        }

        // PHASE 1: Full bars based on crop subtotals
        else if (scrollTop < phases["phase1"].end){
            changeTransitionHeader(1);

            d3.selectAll('.countryLabel').remove();

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
            changeTransitionHeader(2);
            let tScale = phases['phase2'].scale;

            d3.selectAll('.countryLabel').remove();

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
                    tScale.range([1, d.subtotalValue/d.totalValue]);

                    // scale the crop height by its place in scroll transition
                    return ((fullSVGheight) * d.percentOfSubtotal * tScale(scrollTop));
                });

            d3.selectAll('.Other')
                .style('height', function(d){
                    tScale.range([0, d.percentOfTotal]);

                    return (fullSVGheight) * tScale(scrollTop);
                });
        }

        // PHASE 3: Bars rescaled to worker productivity
        else if (scrollTop >= phases["phase3"].start && scrollTop < phases["phase3"].end){
            changeTransitionHeader(3);
            let tScale = phases['phase3'].scale;

            // set country bar max to max times productivity transition scale
            // set crops to % of totals of new (scaled) max
            let heightScale = scaleMapping[metric].scale;
            let curData = scaleMapping[metric].dataName; // column name corresponding to the scale choice
            // let heightScale = curScale.scale;

            d3.selectAll('.country')
                .style('height', function(d){
                    // set range for scroll triggered transition
                    tScale
                        .range([1, d[0][curData] / heightScale.domain()[1]]);

                    return plotHeight * tScale(scrollTop);
                })
                .style('top', function (d){
                    // set range for scroll triggered transition
                    tScale
                        .range([1, d[0][curData] / heightScale.domain()[1]]);

                    return fullSVGheight - ((plotHeight+10) * tScale(scrollTop));
                    // plotHeight + 10 because need to account for original heightScale range that sets the min at 10
                });

            d3.selectAll('.crop')
                .style('height', function(d){
                    tScale
                        .range([1, d[curData] / heightScale.domain()[1]]);

                    return plotHeight * tScale(scrollTop) * d.percentOfTotal;
                });

            callCountryLabels();
            d3.selectAll('.countryLabel')
                .style('bottom', function (d){ return (heightScale(d[0][curData])); })
                .style('opacity', function(d){
                    tScale
                        .range([0, 1]);

                    return tScale(scrollTop);
                });
        }

        // PHASE 4: exploration phase
        else if (scrollTop >= phases["phase4"].start ){
            changeTransitionHeader(4);

            curScale = scaleMapping[metric];
            scale();
            // go to default interactive sort
        }
    }

    window.requestAnimationFrame(render)
};

function changeTransitionHeader(n){
    let tScale = phases['phase'+n].scale
        .range([0, 1]);

    if (n === 0) tScale.range([1,0]);

    d3.selectAll(`h3.stickySentence`)
        .text(phases['phase'+n].text1)
        .style('opacity', function(){return tScale(scrollTop); });

    // SET NEXT BUTTON
    d3.selectAll('.navButton').style('visibility', 'hidden');
     if (n !== 4) {
        d3.select('.navButton.phase'+n)
            .style('visibility', 'visible')
    };

    let phaseMiddle = (phases['phase'+n].start + phases['phase'+n].end)/2;
    let topDist = .2;
// todo come back to subheader
    // d3.selectAll('.transitionSubheader')
    //     .text(function(){ return (phases[phase].text2) ? phases[phase].text2 : '';})
    //     .style('opacity', function(){ return tScale(scrollTop); })
    //     .style('top', function(){
    //         return ((scrollTop > phases[phase].start - topDist)? scrollTop + topDist : phases[phase].start)+ 'px';
    //     });

}

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

function scrollNav() {
    $('.navButton').click(function(){
        //Animate
        $('html, body').stop().animate({
            scrollTop: $( $(this).attr('href') ).offset().top - 10
        }, 600);
        render();
        return false;
    });
    // $('.scrollTop a').scrollTop();
}
scrollNav();
