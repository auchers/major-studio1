var w = 500,
    h = 500,
    rh = h - 60,
    mx, my,
    randx, randy,
    radius = 20,
    bar_width = 100;

d3.select('body')
        .append('svg')
        .attr('width', w)
        .attr('height', 500);

var svg = d3.select('svg');

var circle_data = [{
    x: Math.random() * w,
    y: Math.random() * rh,
    x_diff: Math.random() < 0.5 ? 1 : -1,
    y_diff: Math.random() < 0.5 ? 1 : -1,
    speed: 3,
}];

var circle = svg.selectAll('circle')
                .data(circle_data)
                .enter()
                .append('circle')
                .attr('r', radius)
                .attr('cx', function (d) {return d.x})
                .attr('cy', function (d) {return d.y});

var rect = svg.append('rect')
            .attr('height', 10)
            .attr('width', bar_width)
            .attr('x', mx)
            .attr('y', rh)
            .attr("rx", 6)
            .attr("ry", 6);

var timer = d3.timer(updateCircle);

svg.on('mousemove',movePaddle);

function movePaddle() {
    mx = d3.mouse(this)[0];
    my = d3.mouse(this)[1];
    rect.attr('x', mx);

}

function updateCircle(elapsed){
    circle.attr('cx', function(d){
            d.x += (d.speed * d.x_diff);
                if ((d.x - radius) <= 0 || (d.x + radius) >= w){ // horizontal boundary
                    d.x_diff = d.x_diff * -1;
                };
            return d.x;
        })
        .attr('cy', function(d){
            d.y += (d.speed * d.y_diff);
                if ((d.x >= mx && d.x <= (mx + bar_width) && (d.y + radius) >= rh && (d.y + radius) < h)
                        || (d.y + radius) <= 0){ // vertical boundary
                    d.y_diff = d.y_diff * -1;
                };
            return d.y;
        });
}
