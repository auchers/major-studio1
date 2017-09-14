function setup() {
    createCanvas(windowWidth, windowHeight); 
    
    //loadTable creates p5 table object that comes with perks
    //showData is a callback -- happens when the table is done loading
    loadTable('groceries.tsv', 'tsv', 'header', showData);  

} 

function showData (data){
    var count = data.getRowCount();
    console.log(count);
    
    for (var i=0; i<count; i++){
        var amount = data.getString(i,0); //(row,column)
        var unit = data.getString(i,1);
        var item = data.getString(i,2);
        var source = data.getString(i,3);
        
        if (source.includes('store')){
            // if only 1 line, you can do without {}
            fill(0, 102, 153); 
        } else {
            fill(0);
        }
            textAlign(CENTER);
            text(amount + ' | ' + unit + ' | '+ item + ' | ' + source, width/2, 30 * (i + 1));

    }
    
}