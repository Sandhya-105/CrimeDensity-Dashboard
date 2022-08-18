const map = L.map("map").setView([53.80, -2.21], 6);
const apiUrl = "http://localhost:3000/";

L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{attribution: '&copy; OpenStreetMap contributors, &copy; CartoDB'}).addTo(map);

let bufferRadius = 5000; // In meters
let bufferCircle, centerPoint;
var chart;

map.on("click", (e) => {
    let lat = e.latlng.lat;
    let lng = e.latlng.lng;
    let year = $("#year").val();
    let month = $("#month").val();
    let date = year + "-" + month;

    if(map.hasLayer(bufferCircle)) map.removeLayer(bufferCircle);
    if(map.hasLayer(centerPoint)) map.removeLayer(centerPoint);

    centerPoint = L.marker(e.latlng).addTo(map);
    bufferRadius = $("#bufferRadius").val() * 1000;

    getCrimeIntensity(lat, lng, date);
    getCrimeTypes(lat, lng, date);
});

function changeRadius()
{
    let year = $("#year").val();
    let month = $("#month").val();
    let date = year + "-" + month;
    bufferRadius = $("#bufferRadius").val() * 1000;

    if(centerPoint)
    {
        let latlng = centerPoint.getLatLng();
        if(map.hasLayer(bufferCircle)) map.removeLayer(bufferCircle);
        getCrimeIntensity(latlng.lat, latlng.lng, date);
        getCrimeTypes(latlng.lat, latlng.lng, date);
    }
}

function getCrimeIntensity(lat, lng, date)
{
    $.ajax({
        url: apiUrl + "contains",
        method: "post",
        data: {lat: lat, lng: lng, buffer: bufferRadius, date: date},
        dataType: "json",
        cache: false,
        success: function(response)
        {
            const count = response[0].count;
            const area = Math.PI * bufferRadius * bufferRadius;
            const crimeIntensity = (count / area) * 1000000;
            let crimeDescription = "";
            
            bufferCircle = L.circle([lat, lng], {radius: bufferRadius});
            if(crimeIntensity < 5)
            {
                bufferCircle.setStyle({color: "#5cb85c", fillColor: "#5cb85c"});
                crimeDescription = "Low Crime Intensity";
            }
            else if(crimeIntensity < 15)
            {
                bufferCircle.setStyle({color: "#f0ad4e", fillColor: "#f0ad4e"});
                crimeDescription = "Moderate Crime Intensity";
            }
            else
            {
                bufferCircle.setStyle({color: "#d9534f", fillColor: "#d9534f"});
                crimeDescription = "High Crime Intensity";
            }
            centerPoint.bindPopup(crimeDescription).openPopup();
            bufferCircle.addTo(map);
        }
    });
}

function getCrimeTypes(lat, lng, date)
{
    $.ajax({
        url: apiUrl + "getCrimeTypes",
        method: "post",
        data: {lat: lat, lng: lng, buffer: bufferRadius, date: date},
        dataType: "json",
        cache: false,
        success: function(response)
        {
            if(response.length == 0)
            {
                if(chart)   chart.dispose();
                chart = null;
                $("#chart").html("<h5 class='text-center text-danger' style='font-size: 1em'>Crime data is not available for the given month and location</h5>");
            }
            else
                drawChart(response);
        }
    });
}

function drawChart(data)
{
    am4core.useTheme(am4themes_animated);
    if(chart)
        chart.data = data;
    else
    {
        chart = am4core.create("chart", am4charts.PieChart);
        var pieSeries = chart.series.push(new am4charts.PieSeries());
        pieSeries.dataFields.value = "count";
        pieSeries.dataFields.category = "crime_type";

        // Let's cut a hole in our Pie chart the size of 30% the radius
        chart.innerRadius = am4core.percent(30);

        // Put a thick white border around each Slice
        pieSeries.slices.template.stroke = am4core.color("#fff");
        pieSeries.slices.template.strokeWidth = 2;
        pieSeries.slices.template.strokeOpacity = 1;
        pieSeries.slices.template.cursorOverStyle = [
            {
            "property": "cursor",
            "value": "pointer"
            }
        ];

        pieSeries.labels.template.disabled = true;
        // pieSeries.alignLabels = false;
        // pieSeries.labels.template.bent = true;
        // pieSeries.labels.template.radius = 3;
        // pieSeries.labels.template.padding(0,0,0,0);

        // pieSeries.ticks.template.events.on("ready", hideSmall);
        // pieSeries.ticks.template.events.on("visibilitychanged", hideSmall);
        // pieSeries.labels.template.events.on("ready", hideSmall);
        // pieSeries.labels.template.events.on("visibilitychanged", hideSmall);

        // function hideSmall(ev)
        // {
        //     if (ev.target.dataItem && (ev.target.dataItem.values.value.percent < 10))
        //         ev.target.hide();
        //     else
        //         ev.target.show();
        // }

        pieSeries.ticks.template.disabled = true;

        // Create a base filter effect (as if it's not there) for the hover to return to
        var shadow = pieSeries.slices.template.filters.push(new am4core.DropShadowFilter);
        shadow.opacity = 0;

        // Create hover state
        var hoverState = pieSeries.slices.template.states.getKey("hover"); // normally we have to create the hover state, in this case it already exists

        // Slightly shift the shadow and make it more prominent on hover
        var hoverShadow = hoverState.filters.push(new am4core.DropShadowFilter);
        hoverShadow.opacity = 0.7;
        hoverShadow.blur = 5;

        // Add a legend
        chart.legend = new am4charts.Legend();

        chart.data = data;

        var legendContainer = am4core.create("legend", am4core.Container);
        legendContainer.width = am4core.percent(100);
        legendContainer.height = am4core.percent(100);
        chart.legend.parent = legendContainer;
    }
}