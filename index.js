//none of these depend on the data being loaded so fine to define here
var width = 500;
var height = 450;
var margin = {top: 20, right: 20, bottom: 30, left: 40};
var w = width - margin.left - margin.right;
var h = height - margin.top - margin.bottom;

var dataset = {}; //the full dataset
var channels = ["AF3", "F7", "F3", "FC5", "T7", "P7", "O1", "O2", "P8", "T8", "FC6", "F4", "F8", "AF4"];

d3.tsv("/example/test_rest_spectra.txt", function(data) {
    // format the data
    for(var i in data) {
        var channelData = [];
        var keys = Object.keys(data[i]);
        for (var j = 4; j < 82; j++) {
            channelData.push({
                "freq" : +(keys[j].substring(0, keys[j].length - 2)),
                "spect" : +(data[i][keys[j]])
            });
        }
        dataset[data[i].Channel] = channelData;
    }
    console.log("data done");
});

var col = d3.scaleOrdinal(d3.schemeCategory10);

var x = d3.scaleLinear()
    .domain([0, 40])
    .range([0, w]);

var y = d3.scaleLinear()
    .domain([6, 15])
    .range([h, 0]);

var line = d3.line()
    .x(function(d) {
        return x(d.freq);
    })
    .y(function(d){
        return y(d.spect);
    });

var xAxis = d3.axisBottom()
    .ticks(4)
    .scale(x);

var yAxis = d3.axisLeft()
    .ticks(4)
    .scale(y);

var bisect = d3.bisector(function(d) {return d.freq;}).left;

function drawViz(chartName) {
    var chart = d3.select(chartName)
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom+15)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    chart.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + h + ")")
        .call(xAxis)
        .append("text")
        .attr("x", w)
        .attr("y", 30)
        .style("text-anchor", "end")
        .text("Frequency (Hz)");

    chart.append("g")
        .attr("class", "axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Log Power");

    chart.append('rect')
        .attr("x", function(d) { return x(8);  })
        .attr("y", function(d) { return y(15);  })
        .attr("width", function(d) { return x(5); })
        .attr("height", function(d) { return y(6); })
        .style("fill", "lightgreen")
        
    chart.append("text")
        .attr("class", "axis")
        .attr("x", function(d) {return x(11.5); })
        .attr("y", function(d) {return y(14.5);})
        .style("text-anchor", "end")
        .text("Alpha");

    var data;
    var ch;
    if (chartName == "#chart1") {
        ch = document.getElementById("stored1").value;
        data = dataset[ch];
        document.getElementById("title1").innerHTML = "Spectogram of " + ch;
    } else if (chartName == "#chart2") {
        ch = document.getElementById("stored2").value;
        data = dataset[ch];
        document.getElementById("title2").innerHTML = "Spectogram of " + ch;
    }
    console.log(data);

    chart.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line);


    // tooltip
    var focus = chart.append("g")
        .attr("class", "focus")
        .style("display", "none");

    focus.append("line")
        .attr("class", "x-hover-line hover-line")
        .attr("y1", 0)
        .attr("y2", height);

    focus.append("line")
        .attr("class", "y-hover-line hover-line")
        .attr("x1", width)
        .attr("x2", width);

    focus.append("circle")
        .attr("r", 4.5);

    focus.append("text")
        .attr("x", 15)
      	.attr("dy", ".31em");

    chart.append("rect")
        .attr("class", "overlay")
        .attr("width", width - 70)
        .attr("height", height)
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", mousemove);
    
    function mousemove() {
        var x0 = x.invert(d3.mouse(this)[0]),
            i = bisect(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0.freq > d1.freq - x0 ? d1 : d0;
        focus.attr("transform", "translate(" + x(d.freq) + "," + y(d.spect) + ")");
        focus.select("text").text(function() { return "(" + d.freq + "Hz, " + d.spect + ")"; });
        focus.select(".x-hover-line").attr("y2", height - y(d.spect) - 50);
        focus.select(".y-hover-line").attr("x2", width + width);
    }
}

var click = 0;

var a = document.getElementById("brain-svg");
a.addEventListener("load",function(){
    // get the inner DOM of alpha.svg
    var svgDoc = a.contentDocument;
    svgDoc.querySelector("svg").setAttribute("viewBox", "-50 -50 400 400");

    // get all circles and set to grey
    var gees = svgDoc.querySelectorAll("g");
    for (var i = 0; i < 78; i++) {
        // console.log("g: " + gees[i]);
        var firstCircle = gees[i].querySelector("circle");
        if (firstCircle != null) {
            firstCircle.setAttribute("style", "fill:grey");

            for (var ch in channels) {
                var ts = gees[i].querySelector("tspan");
                if (ts != null && (ts.innerHTML == channels[ch])) {
                    console.log("found");

                    firstCircle.setAttribute("style", "fill:greenyellow");

                    // add behaviour
                    ts.addEventListener("mousedown",function(e){
                        if (click < 2) {
                            var c = e.target.parentElement.parentElement.querySelector("circle");
                            console.log(e.target.parentElement);
                            c.setAttribute("style", "fill:lightblue");
                            var ch = e.target.innerHTML;
                            for (var k in dataset) {
                                if (dataset[k]["Channel"] == ch) {
                                    console.log(dataset[k]);
                                }
                            }
                            click++;
                        }

                        var prompt = document.getElementById("prompt");
                        if (click == 1) {
                            prompt.innerHTML = "Please select the second channel";
                            document.getElementById("stored1").value = e.target.innerHTML;
                        }
                        if (click == 2) {
                            prompt.innerHTML = "Scroll down to see results or reset to reselect channels"
                            document.getElementById("stored2").value = e.target.innerHTML;
                            drawViz("#chart1");
                            drawViz("#chart2");
                        }
                    }, false);
                }
            }
        }
    }

    console.log("svg done");
}, false);

window.onload = function() {
    document.getElementById("reset").addEventListener("click", function() {
        var gees = a.contentDocument.querySelectorAll("g");
        for (var i = 0; i < 78; i++) {
            var firstCircle = gees[i].querySelector("circle");
            if (firstCircle != null) {
                firstCircle.setAttribute("style", "fill:grey");
                for (var ch in channels) {
                    var ts = gees[i].querySelector("tspan");
                    if (ts != null && (ts.innerHTML == channels[ch])) {
                        firstCircle.setAttribute("style", "fill:greenyellow");
                    }
                }
            }
        }
        document.getElementById("chart1").innerHTML = "";
        document.getElementById("chart2").innerHTML = "";

        var prompt = document.getElementById("prompt");
        prompt.innerHTML = "Please select the first channel";
        click = 0;
    }, false);

    console.log("done");
};
