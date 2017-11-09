var imgMapping = {
    "Bananas": 'noun_1314055_cc.svg',
    "Plantains and others": 'noun_1314055_cc.svg',
    "Cassava": "noun_563420_cc.svg",
    "Sweet potatoes": 'noun_457236_cc.svg',
    "Sorghum": "noun_76625_cc.svg",
    "Roots and tubers, nes": "noun_563420_cc.svg",
    "Sugar cane": "noun_573903_cc.svg",
    "Maize": "noun_563406_cc.svg",
    "Rice, paddy": "noun_303700_cc.svg",
    "other": "noun_920797_cc.svg"
};

var agData,
    maxWorkerProd,
    minWorkerProd,
    maxIndustryPercGDP,
    minIndustryPercGDP;

var x,y;

var year = 2010;
var iconSize = 60;
var marginSize = 60;
// create year dropdown
var select = d3.select('.scatterplot')
    .append('select')
    .attr('class', 'select')
    .on('change', onSelect);

// create main scatterplot svg
var svg = d3.select('.scatterplot')
    .append('svg')
    .attr('class', 'scatterplot')
    .attr('height','90%')
    .attr('width', '100%');

var width = parseInt(d3.select('svg').style('width'));
var height = parseInt(d3.select('svg').style('height'));

console.log(`width: ${width} height: ${height}`);

var tool_tip = d3.tip()
    .attr("class", "d3-tip")
    .style('background-color', 'pink')
    .style("opacity", .8)
    .html(function(d) {
        return `Country: ${d.Country} <br> Primary Crop: ${d.Item} <br>  Year: ${d.Time}`;
    });

svg.call(tool_tip);
// get data
d3.json('data/agdata.json', function(err, data){
    // filter out NA values on worker productivity
    agData = _.filter(data, function(d){ return !(d.AgriValuePerWorker === '..' || d.IncomeShareLowest20 === '..'); });
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
    maxIndustryPercGDP = _.maxBy(agData, function(d){ return +d.IncomeShareLowest20; }).IncomeShareLowest20;
    minIndustryPercGDP = _.minBy(agData, function(d){ return +d.IncomeShareLowest20; }).IncomeShareLowest20;

    console.log(minIndustryPercGDP + ' ' + maxIndustryPercGDP);

    // display scatterplot
    display();
});


function display(){
    // filter the data to the selected year
    var agDataF = agData;
    // var agDataF = _.filter(agData, function(d){ return (+d.Time === year); });
    console.log(agDataF);

    // make linear scales
    x = d3.scaleLinear()
        .domain([minWorkerProd, maxWorkerProd])
        .range([2*iconSize, width-iconSize]);

    y = d3.scaleLinear()
        .domain([minIndustryPercGDP, maxIndustryPercGDP])
        .range([height-2*iconSize, iconSize]);

    // TODO: makes axes
    var xAxis = d3.axisBottom(x);
    var yAxis = d3.axisLeft(y);


    var scatterGroup = svg.selectAll('g')
        .data(agDataF);

        scatterGroup.enter()
            .append('g')

            // .append('image')
            // .attr('xlink:href', function(d){
            //     return (imgMapping[d.Item])? `assets/${imgMapping[d.Item]}`:`assets/${imgMapping["other"]}`;
            //     // return `assets/${imgMapping[d.Item]}` || `assets/${imgMapping["other"]}`;
            // })
            // .attr('x', function(d){ return x(d.AgriValuePerWorker) - iconSize/2; })
            // .attr('y', function(d){ return y(d.IncomeShareLowest20) - iconSize/2;})
            // .attr('height', iconSize)
            // .attr('width', iconSize)

            .append('circle')
            .attr('cx', function(d){ return x(d.AgriValuePerWorker); })
            .attr('cy', function(d){ return y(d.IncomeShareLowest20);})
            .attr('r', 2)
            .style('stroke', 'black')
            .style('fill', 'white')
            .style('fill-opacity', 0)

            .on('mouseover', function (d){ tool_tip.show(d).style('opacity', .8);} )
            .on('click', onClick)
            .on('mouseout', tool_tip.hide);
            //     function(d, i , g){
            //     console.log(`${d.Country} has prod of ${d.AgriValuePerWorker} from ${d.Item}`);
            // });
        scatterGroup.exit().remove();

        // AXES
        // call xAxis
        svg.append('g')
            .attr("transform", "translate(0," + (height-marginSize) + ")")
            .call(xAxis);
        // call yAxis
        svg.append('g')
            .attr("transform", "translate(" + marginSize + ", 0)")
            .call(yAxis);

        // xAxis Label
        svg.append("text")
            .attr("transform",
                "translate(" + (width/2) + " ," +
                (height -(marginSize/2) + 10) + ")")
            .style("text-anchor", "middle")
            .text("Agriculture Value Added Per Worker (in 2010 US$)");

        // yAxis Label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 + 10)
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Income Share of the Bottom 20%");

}

function onClick(d, i , nodes){
    console.log(this.parentNode);
    d3.select(this.parentNode)
        .append('image')
        .attr('xlink:href', function(d){
           return (imgMapping[d.Item])? `assets/${imgMapping[d.Item]}`:`assets/${imgMapping["other"]}`;
        })
        .attr('x', function(d){ return x(d.AgriValuePerWorker) - iconSize/2; })
        .attr('y', function(d){ return y(d.IncomeShareLowest20) - iconSize/2;})
        .attr('height', iconSize)
        .attr('width', iconSize)

}

function onSelect(){
    year = +d3.select(this).property('value');
    // console.log(d3.select(this));
    console.log(`year changed to ${year}`);
    display();
}