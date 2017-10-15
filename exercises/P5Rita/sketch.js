var input;
var ritaString;
var content

function setup(){
    noCanvas();
    input = createInput();
    input.changed(rita);
    content = createElement('div');
    content.id('content');
}

function rita(event) {
    var str = event.target.value;
    console.log(str);
    
    ritaString = RiString(str); // once cast as RiString - we can use their methods
    var words = ritaString.words(); // no need to split
    
    words.forEach(function (w){
       var features = RiString(w).features();
        console.log(features);
        
        var span = createElement('span', features.text);
        
        if (features.pos == 'nn'){
            span.style('background', 'purple');
        }
        
        span.parent(content);
    });
    
    
}