var imgMapping = {
    banana: 'noun_1314055_cc.svg'
};

var agData,
    maxWorkerProd,
    minWorkerProd,
    maxIndustryPercGDP,
    minIndustryPercGDP;

var year = 2010;
var iconSize = 10;
// create year dropdown
var select = d3.select('.scatterplot')
    .append('select')
    .attr('class', 'select')
    .on('change', onSelect);

// create main scatterplot svg
var svg = d3.select('.scatterplot')
    .append('svg')
    .attr('class', 'scatterplot')
    .attr('height','50%')
    .attr('width', '100%');

var width = parseInt(d3.select('svg').style('width'));
var height = parseInt(d3.select('svg').style('height'));

console.log(`width: ${width} height: ${height}`);

// get data
d3.json('/Major Studio/project3/data/agdata.json', function(err, data){
    // filter out NA values on worker productivity
    agData = _.filter(data, function(d){ return !(d.AgriValuePerWorker === '..' || d.IndustryAddedValPercGDP === '..'); });
    console.log(agData);

    // get array of unique years from data -- use to populate dropdown
    var years = _.uniq(_.map(data, 'Time'));
    var options = select.selectAll('option')
        .data(years)
        .enter()
        .append('option')
        .text(function(d){ return d; });

    // get extrema for total dataset
    maxWorkerProd = _.maxBy(agData, function(d){ return +d.AgriValuePerWorker; }).AgriValuePerWorker;
    minWorkerProd = _.minBy(agData, function(d){ return +d.AgriValuePerWorker; }).AgriValuePerWorker;
    maxIndustryPercGDP = _.maxBy(agData, function(d){ return +d.IndustryAddedValPercGDP; }).IndustryAddedValPercGDP;
    minIndustryPercGDP = _.minBy(agData, function(d){ return +d.IndustryAddedValPercGDP; }).IndustryAddedValPercGDP;

    console.log(minIndustryPercGDP + ' ' + maxIndustryPercGDP);

    // display scatterplot
    display();
});


function display(){
    // filter the data to the selected year
    var agDataF = _.filter(agData, function(d){ return (d.Time === year); });
    console.log(agDataF);

    // make linear scales
    var x = d3.scaleLinear()
        .domain([minWorkerProd, maxWorkerProd])
        .range([iconSize, width-iconSize]);

    var y = d3.scaleLinear()
        .domain([minIndustryPercGDP, maxIndustryPercGDP])
        .range([height-iconSize, iconSize]);

    // TODO: makes axes

    var scatterGroup = svg.selectAll('g')
        .data(agDataF);

        scatterGroup.enter()
            .append('g')
            .append('circle')
            .attr('cx', function(d){ return x(d.AgriValuePerWorker); })
            .attr('cy', function(d){ return y(d.IndustryAddedValPercGDP);})
            .attr('r', 10)
            .on('mouseover', function(d, i , g){ console.log(`${d.Country} has prod of ${d.AgriValuePerWorker}`); });

        scatterGroup.exit().remove();

    svg.append('image')
        .attr('xlink:href', `assets/${imgMapping['banana']}`)
        .attr('x', 10)
        .attr('y', 10)
        .attr('height', 70);
}

function onSelect(){
    year = +d3.select(this).property('value');
    // console.log(d3.select(this));
    console.log(`year changed to ${year}`);
    display();
}