var interactionSelectPointerMove = new ol.interaction.Select({
  condition: ol.events.condition.pointerMove,
  style: new ol.style.Style({
    // fill: new ol.style.Fill({
    //   color: 'grey'
    // }),
    stroke: new ol.style.Stroke({
      color: "grey",
      width: 2
    })
  })
});

var interactionSelect = new ol.interaction.Select({});

var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');


var overlay = new ol.Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250
  }
});

// click close button to close the popup window
closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};


let WMSsource_oasis = function (lyr, params = null, cqlFilter = null) {
  let source = new ol.source.TileWMS({
    url: 'http://hera1.oasis.unc.edu:8080/geoserver/hera/wms',
    projection: 'EPSG:4269',
    params: {
      "VERSION": "1.3.0",
      'LAYERS': lyr,
      // 'bbox': [-84.3664321899414,31.9729919433594,-75.3555068969727,36.6110992431641],
      'TILED': true,
      'FORMAT': 'image/png',
      'viewparams': params,
      'CQL_FILTER': cqlFilter,
    },
    serverType: 'geoserver',
    crossOrigin: 'anonymous', // Add to enable CQL filter on WMS
    // Countries have transparency, so do not fade tiles:
    transition: 0,
  });

  return source;
};

var basemap = new ol.layer.Tile({
  source: new ol.source.OSM()
});

var countyvector = new ol.layer.Vector({
  source: new ol.source.Vector({
    renderMode: 'image', // Vector layers are rendered as images. Better performance. Default is 'vector'.
    format: new ol.format.GeoJSON(),
    url: function (extent) {
      return 'http://hera1.oasis.unc.edu:8080/geoserver/hera/wfs?service=WFS' +
        '&version=1.0.0&request=GetFeature' +
        '&typeName=hera:tl_nc_county' +
        '&outputFormat=application/json&srsname=EPSG:4326'
      // '&CQL_FILTER=stusps=%27NC%27'
    },
    strategy: ol.loadingstrategy.bbox,
  }),
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: [255, 255, 255, 0],
    }),
    stroke: new ol.style.Stroke({
      color: '#867E77',
      width: 0.1
    })
  }),
});

var view = new ol.View({
  // projection: 'EPSG:3857',
  center: ol.proj.fromLonLat([-79.5, 34.9]),
  zoom: 8

});


var map = new ol.Map({
  target: 'map',
  loadTilesWhileAnimating: true,
  loadTilesWhileInteracting: true,
  controls: [
    new ol.control.OverviewMap(),
    new ol.control.Zoom(),
    new ol.control.ScaleLine(),
  ],
  interactions: [
    interactionSelectPointerMove,
    new ol.interaction.MouseWheelZoom(),
    new ol.interaction.DragPan(),
    interactionSelect,
  ],
  layers: [
    new ol.layer.Group({
      title: "Base maps",
      fold: 'open',
      layers: [
        new ol.layer.Group({
          title: "North and South Carolina county",
          type: 'base',
          // combine: true,
          visible: true,
          layers: [
            basemap,

            countyvector
          ]
        }),
      ]
    }),

    new ol.layer.Group({
      title: "Layers",
      fold: 'open',
      layers: [

        new ol.layer.Tile({
          title: "2017 population",
          visible: false,
          // source: WMSsource('hera:ncsc_population_lyr', null, "stusps = 'NC'")
          source: WMSsource_oasis('hera:tl_nc_population_lyr')
        }),

        // new ol.layer.Tile({
        //   title: "2015 Impervious Surface Area",
        //   visible: false,
        //   // source: WMSsource('hera:ncsc_isa_lyr', null, "stusps = 'NC'")
        // }),

        new ol.layer.Tile({
          title: "Winter Weather ",
          visible: false,
          // source: WMSsource_oasis('hera:nc_ww_sql')
          source: WMSsource_oasis('hera:ww_sql', "state:nc")
        }),

        new ol.layer.Tile({
          // title: "NC Floods ",
          title: "Floods ",
          visible: false,
          // source: WMSsource_oasis('hera:nc_floods_sql')
          // source: WMSsource_oasis('hera:nc_floods_sql_2')
          source: WMSsource_oasis('hera:floods_sql', "state:nc")
          // layers: createGroupedLyrs('hera:nc_floods_sql', "minYear:2010-01-01;maxYear:2018-12-31;sublist:'FA'\\,'CF'")
        }),

        new ol.layer.Tile({
          title: "High Winds ",
          visible: true,
          // source: WMSsource_oasis('hera:nc_hw_sql')
          source: WMSsource_oasis('hera:hw_sql', "state:nc")
        }),

        new ol.layer.Tile({
          title: "Heat ",
          visible: false,
          // source: WMSsource_oasis('hera:nc_heats_sql')
          source: WMSsource_oasis('hera:heats_sql', "state:nc")
        }),

        new ol.layer.Tile({
          title: "Hails ",
          visible: false,
          // source: WMSsource_oasis('hera:nc_hl_sql')
          source: WMSsource_oasis('hera:hl_sql', "state:nc")
        }),

      ]
    }),


  ],
  overlays: [overlay],
  // view: new ol.View({
  //   // projection: 'EPSG:3857',
  //   center: ol.proj.fromLonLat([-80,35.5]),
  //   zoom: 7
  view: view

  // })
});

// adjust the base map color
basemap.on('postcompose', function (e) {
  greyscale(e.context);
  // document.querySelector('canvas').style.filter = "invert(90%)";
});


// grey scale function for the base map
function greyscale(context) {
  var width = context.canvas.width;
  var height = context.canvas.height;
  var inputData = context.getImageData(0, 0, width, height).data;
  // console.log('inputData.length: ' + inputData.length);

  var canvas = document.getElementsByClassName('ol-unselectable')[0];
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = "rgba(0, 0, 0, 0)"
  var myImageData = ctx.createImageData(width, height);
  var d = myImageData.data;

  for (i = 0; i < inputData.length; i += 4) {

    var r = inputData[i];
    var g = inputData[i + 1];
    var b = inputData[i + 2];
    // CIE luminance for the RGB
    var v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    d[i + 0] = v; // Red
    d[i + 1] = v; // Green
    d[i + 2] = v; // Blue
    d[i + 3] = 255; // Alpha

  }
  ctx.putImageData(myImageData, 0, 0);

}

// If there is any feature at the event pixel (where the mouse points at), the pointer will change to the 'hand' symbol
map.on('pointermove', function (e) {
  if (e.dragging) {
    return;
  }
  var pixel = map.getEventPixel(e.originalEvent);
  var hit = map.hasFeatureAtPixel(pixel);

  e.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
});


// let createContent = function (lyr, features) {
//   var counties = '';
//   var total = 0;
//   var probaArray = [];
//   var probability = 0;
//   let startyear = parseInt($('.slider-time').html());
//   let endyear = parseInt($('.slider-time2').html());
//   switch (lyr) {
//     case 'ncsc_population_lyr':
//       for (f of features) {
//         counties += f.get('county') + ', ';
//         total += f.get('population');
//       }
//       averagePopulation = Math.round((total / features.length));
//       content.innerHTML = '<h5>Selected County: ' + counties + '</h5><br><p>2017 Population: ' + averagePopulation + '</p>';
//       break;
//     case 'ncsc_isa_lyr':
//       for (f of features) {
//         counties += f.get('county') + ', ';
//         total += f.get('percent_isa');
//       }
//       averageIsa = (total / features.length * 100).toFixed(2);
//       content.innerHTML = '<h5>Selected County: ' + counties + '</h5><br><p>2015 ISA: ' + averageIsa + '</p>';
//       break;
//     case 'nc_floods_sql':
//       for (f of features) {
//         counties += f.get('county') + ', ';
//         total += f.get('count');
//         features[0].getKeys().filter(i =>
//           endyear >= parseInt(i.slice(1)) && parseInt(i.slice(1)) >= startyear && f.get(i) != null
//         ).forEach(i => {
//           if (!probaArray.includes(i)) {
//             probaArray.push(i)
//           }
//         });
//       }
//       // Create an array of the year headers based on the year range, e.g. 'y2006',...,'y2019'
//       // var newarray = [...Array(2019-2006+1).keys()].map(i => 'y' + (i+2006).toString()) 
//       // var testarray = features[0].getKeys().filter(i => newarray.includes(i)&& features[0].get(i) != null);

//       // var testarray = features[0].getKeys().filter(i =>
//       //   endyear >= parseInt(i.slice(1)) && parseInt(i.slice(1)) >= startyear && features[0].get(i) != null
//       // );

//       // console.log(probaArray);
//       probability = (probaArray.length / (endyear - startyear + 1) * 100).toFixed(2) + '%';

//       console.log(startyear, endyear);
//       average = (total / features.length).toFixed(2);
//       content.innerHTML = '<b>Layer: </b>Floods<br>' + '<h5>Selected County: ' + counties + '</h5><br><p>Year: 2006-2019</p><br><p>Total count: ' +
//         total + '</p><br><p>Probability: ' + probability + '</p><br><p>Average count: ' + average + '</p>';
//       // content.innerHTML = 'Number of records: ' + total;
//       break;
//     case 'nc_ww_sql':
//       for (f of features) {
//         counties += f.get('county') + ', ';
//         total += f.get('count');
//         features[0].getKeys().filter(i =>
//           endyear >= parseInt(i.slice(1)) && parseInt(i.slice(1)) >= startyear && f.get(i) != null
//         ).forEach(i => {
//           if (!probaArray.includes(i)) {
//             probaArray.push(i)
//           }
//         });
//       };
//       probability = (probaArray.length / (endyear - startyear + 1) * 100).toFixed(2) + '%';
//       average = (total / features.length).toFixed(2);
//       content.innerHTML = '<b>Layer: </b>Winter Weather<br>' + '<h5>Selected County: ' + counties + '</h5><br><p>Year: 2006-2019</p><br><p>Total count: ' +
//         total + '</p><br><p>Probability: ' + probability + '</p><br><p>Average count: ' + average + '</p>';
//       // content.innerHTML = 'Number of records: ' + total;
//       break;
//     case 'nc_hw_sql':
//       for (f of features) {
//         counties += f.get('county') + ', ';
//         total += f.get('count');
//         features[0].getKeys().filter(i =>
//           endyear >= parseInt(i.slice(1)) && parseInt(i.slice(1)) >= startyear && f.get(i) != null
//         ).forEach(i => {
//           if (!probaArray.includes(i)) {
//             probaArray.push(i)
//           }
//         });
//       };
//       // console.log(endyear, startyear)
//       // endyear = 2018;
//       // startyear = 1989;
//       probability = (probaArray.length / (endyear - startyear + 1) * 100).toFixed(2) + '%';
//       average = (total / features.length).toFixed(2);
//       content.innerHTML = '<b>Layer: </b>High Winds<br>' + '<h5>Selected County: ' + counties + '</h5><br><p>Year: 1989-2018</p><br><p>Total count: ' +
//         total + '</p><br><p>Probability: ' + probability + '</p><br><p>Average count: ' + average + '</p>';
//       // content.innerHTML = 'Number of records: ' + total;
//       break;
//     case 'nc_hl_sql':
//       for (f of features) {
//         counties += f.get('county') + ', ';
//         total += f.get('count');
//         features[0].getKeys().filter(i =>
//           endyear >= parseInt(i.slice(1)) && parseInt(i.slice(1)) >= startyear && f.get(i) != null
//         ).forEach(i => {
//           if (!probaArray.includes(i)) {
//             probaArray.push(i)
//           }
//         });
//       };
//       // console.log(endyear, startyear)
//       // endyear = 2018;
//       // startyear = 1989;
//       probability = (probaArray.length / (endyear - startyear + 1) * 100).toFixed(2) + '%';
//       average = (total / features.length).toFixed(2);
//       content.innerHTML = '<b>Layer: </b>Hails<br>' + '<h5>Selected County: ' + counties + '</h5><br><p>Year: 1989-2018</p><br><p>Total count: ' +
//         total + '</p><br><p>Probability: ' + probability + '</p><br><p>Average count: ' + average + '</p>';
//       // content.innerHTML = 'Number of records: ' + total;
//       break;
//     case 'nc_heats_sql':
//       for (f of features) {
//         counties += f.get('county') + ', ';
//         total += f.get('count');
//         features[0].getKeys().filter(i =>
//           endyear >= parseInt(i.slice(1)) && parseInt(i.slice(1)) >= startyear && f.get(i) != null
//         ).forEach(i => {
//           if (!probaArray.includes(i)) {
//             probaArray.push(i)
//           }
//         });
//       };
//       probability = (probaArray.length / (endyear - startyear + 1) * 100).toFixed(2) + '%';
//       average = (total / features.length).toFixed(2);
//       content.innerHTML = '<b>Layer: </b>Heat<br>' + '<h5>Selected County: ' + counties + '</h5><br><p>Year: 2006-2019</p><br><p>Total count: ' +
//         total + '</p><br><p>Probability: ' + probability + '</p><br><p>Average count: ' + average + '</p>';
//       // content.innerHTML = 'Number of records: ' + total;
//       break;

//   }
// }

let createContent = function (lyr, selected) {
  let counties = '';
  let total = 0;
  let flength = Object.keys(selected).length;
  let probaArray = [];
  let probability = 0;
  // let startyear = parseInt($('.slider-time').html());
  // let endyear = parseInt($('.slider-time2').html());
  let startyear = selected[Object.keys(selected)[0]]['minyear'];
  console.log(startyear);
  let endyear = selected[Object.keys(selected)[0]]['maxyear'];


  Object.keys(selected).forEach(function (key) {
    switch (lyr.split(':')[1]) {
      case 'ncsc_population_lyr':
        total += selected[key]['population'];
        break;
      case 'ncsc_isa_lyr':
        total += selected[key]['percent_isa'];
        break;
      default:
        total += selected[key]['count'];
    }

    console.log('counties: ', counties += selected[key]['county'] + ', ');
    console.log('total: ', total);
    console.log('average: ', total / flength);

    console.log(Object.keys(selected[key]));
    Object.keys(selected[key]).filter(i =>
      endyear >= parseInt(i.slice(1)) && parseInt(i.slice(1)) >= startyear && selected[key][i] != null
    ).forEach(i => {
      if (!probaArray.includes(i)) {
        probaArray.push(i)
      }
    });
    probability = (probaArray.length / (endyear - startyear + 1) * 100).toFixed(2) + '%';
    console.log(probability);
    content.innerHTML = '<h5>Selected County: ' + counties + '</h5><br><p>Year: ' + startyear + '-' + endyear + '</p><br><p>Total count: ' +
      total + '</p><br><p>Probability: ' + probability + '</p>';
  })
};

var shiftPressed = false;
$(document).keydown(function (event) {
  shiftPressed = event.keyCode == 16;
});
$(document).keyup(function (event) {
  shiftPressed = false;
});

var selected = {};

map.on('singleclick', function (evt) {
  let coord = evt.coordinate;
  let resolution = map.getView().getResolution();
  let projection = map.getView().getProjection();
  let lyr;

  let wmslayerSource = map.forEachLayerAtPixel(evt.pixel,
    function (layer) {
      // return only layers with ol.source.TileWMS
      var source = layer.getSource();
      if (source instanceof ol.source.TileWMS) {
        lyr = layer['values_']['source']['params_']['LAYERS'];
        return source;
      }
    });
  if (wmslayerSource) {
    var url = wmslayerSource.getGetFeatureInfoUrl(
      coord, resolution, projection, {
        'INFO_FORMAT': 'application/json',
      }
    );
    console.log("shiftpressed?: ", shiftPressed);

    // if (url) {
    fetch(url)
      .then(function (response) {
        return response.json();
      })
      .then(function (json) {
        let featureid = json["features"][0]['id'];
        // console.log(featureid);
        // console.log(typeof(featureid));
        let properties = json["features"][0]["properties"];
        // console.log(typeof(properties));
        // let countyname = properties['county'];
        if (!shiftPressed) {
          console.log('if')
          selected = {};
          selected[featureid] = properties;
        } else if (featureid in selected) {
          console.log('else if');
          delete selected[featureid];
        } else {
          console.log('else');
          selected[featureid] = properties;
        };

        console.log(Object.keys(selected).length);
        // console.log(selected)


        createContent(lyr, selected);

      });
    overlay.setPosition(coord);
  } else {
    overlay.setPosition(undefined);
    selected.length = 0;
  }
});

// interactionSelect.on('select', function (e) {
// var coord = e.mapBrowserEvent.coordinate;
// var features = e.target.getFeatures().getArray();
// console.log(e.target.getFeatures());

// if (features.length >= 1) {
//   var layerid = features[0].getId().split('.')[0];
//   // console.log(layerid);
//   createContent(layerid, features);
//   overlay.setPosition(coord);
// } else {
//   overlay.setPosition(undefined);
// }
// });


// var sidebar = new ol.control.Sidebar({
//   element: 'sidebar',
//   position: 'right'
// });
// var toc = document.getElementById("layers");
// ol.control.LayerSwitcher.renderPanel(map, toc);
// map.addControl(sidebar);

document.getElementById("tab-1").innerHTML = "2017 population";
document.getElementById("tab-2").innerHTML = "2015 Impervious Surface Area";
document.getElementById("tab-3").innerHTML = "NC floods";

// document.getElementById("about-tab-1").innerHTML = "HERA Data Source";
// document.getElementById("about-tab-2").innerHTML = "Contact Us";


// Create attribute table using Jquery library DataTable
function createTabTable(attributeTableID, layerID, properties) {
  // Use the new 'DataTable' function rather than the older one 'dataTable'
  var table = $(attributeTableID).DataTable({
    responsive: 'true',
    // dom: 'iBfrtlp',
    "dom": '<"top"fB>rt<"bottom"lip>',
    buttons: [
      'csv',
      {
        extend: 'excelHtml5',
        exportOptions: {
          columns: ':visible'
        }
      }
    ],
    "scrollX": true,
    "ajax": {
      // Delete the limitation: maxFeatures=50
      // Solved from Stackoverflow questions no.48147970
      "url": 'http://hera1.oasis.unc.edu:8080/geoserver/hera/wfs?service=WFS' +
        '&version=1.0.0&request=GetFeature' +
        '&typeName=hera:' + layerID +
        '&outputFormat=application/json',
      "dataSrc": "features"
    },
    "columns": properties,
  });

  return table;
};

createTabTable('#attributeTb', 'nc_ww_sql', [{
    //   "title": "FIPS",
    //   data: "properties.fips",
    //   "class": "center"
    // },
    // {
    "title": "County",
    data: "properties.county",
    "class": "center"
  },
  {
    "title": "Count",
    data: "properties.count",
    "class": "center"
  },
], );

createTabTable('#attributeTb2', 'nc_floods_sql', [{
    //   "title": "FIPS",
    //   data: "properties.fips",
    //   "class": "center"
    // },
    // {
    "title": "County",
    data: "properties.county",
    "class": "center"
  },
  {
    "title": "Count",
    data: "properties.count",
    "class": "center"
  },
], );

createTabTable('#attributeTb3', 'nc_hw_sql', [{
    //   "title": "FIPS",
    //   data: "properties.fips",
    //   "class": "center"
    // },
    // {
    "title": "County",
    data: "properties.county",
    "class": "center"
  },
  {
    "title": "Count",
    data: "properties.count",
    "class": "center"
  },

], );

$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
  $.fn.dataTable.tables({
    visible: true,
    api: true
  }).columns.adjust();
});


// var jsonSource = 'hera:floods_highlight'
// Create mock-up highlight table as tableau
// let layerjson = (function (jsonSource) {
//   var json;
//   $.ajax({
//     async: false,
//     url: `http://152.7.99.155:8080/geoserver/hera/ows?service=WFS&version=1.0.0
//         &request=GetFeature&typeName=hera:floods_highlight&outputFormat=json
//         &format_options=callback:getJson`,
//     dataType: 'json',
//     jsonpCallback: 'getJson',
//     // success: parsejson
//     success: function (data) {
//       json = data
//     }
//   });
//   return json;
// })();


var dummy = [];

// layerjson.features.forEach(
//   function (i) {
//     var yearlist = [];
//     yearlist.push(i.properties['year_issued'], i.properties['jan'], i.properties['feb'], i.properties['mar'], i.properties['apr'], i.properties['may'],
//       i.properties['jun'], i.properties['jul'], i.properties['aug'], i.properties['sep'], i.properties['oct'], i.properties['nov'], i.properties['dec']);
//     dummy.push(yearlist);
//   })

// function parsejson(data) {
//   data.features.forEach(
//     function (i) {
//       var yearlist = [];
//       yearlist.push(i.properties['year_issued'], i.properties['jan'], i.properties['feb'], i.properties['mar'], i.properties['apr'], i.properties['may'],
//         i.properties['jun'], i.properties['jul'], i.properties['aug'], i.properties['sep'], i.properties['oct'], i.properties['nov'], i.properties['dec']);
//       dummy.push(yearlist);
//     }
//   )
//   /*   console.log(data.features); */
// };


// var rowLabel = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var rowLabel = ['', 'J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];


// Using RBG
var colors = [{
  r: 255,
  g: 255,
  b: 255
}, {
  r: 59,
  g: 115,
  b: 143
}, {
  r: 59,
  g: 115,
  b: 143
}, {
  r: 59,
  g: 115,
  b: 143
}, {
  r: 59,
  g: 115,
  b: 143
}, {
  r: 59,
  g: 115,
  b: 143
}, {
  r: 59,
  g: 115,
  b: 143
}, {
  r: 59,
  g: 115,
  b: 143
}, {
  r: 59,
  g: 115,
  b: 143
}, {
  r: 59,
  g: 115,
  b: 143
}, {
  r: 59,
  g: 115,
  b: 143
}, {
  r: 59,
  g: 115,
  b: 143
}, {
  r: 59,
  g: 115,
  b: 143
}];

var alpha = d3.scaleLinear().domain([0, 100]).range([0, 1]);

var d3table = d3.select("#chart").append("table");

thead = d3table.append("thead");
tbody = d3table.append("tbody")


thead.append("tr")
  .selectAll("th")
  .data(rowLabel)
  .enter()
  .append("th")
  .text(function (d) {
    return d;
  })

var rows = tbody.selectAll("tr")
  .data(dummy)
  .enter()
  .append("tr");

var cells = rows.selectAll("td")
  .data(function (d, i) {
    //d.shift();
    //d.unshift(rowLabel[i]);
    return d;
  })
  .enter()
  .append("td")
  .style('background-color', function (d, i) {
    return 'rgba(' + colors[i].r + ',' + colors[i].g + ',' + colors[i].b + ',' + alpha(d) + ')';
  })
  .text(function (d) {
    return d;
  });

var sourcedata = [{
    "Dataset": "Local Storm Reports (LSR)",
    "Years": "1989-2018",
    "Hazards": "Hail, High Winds, Tornadoes",
    "Description": "Local Storm Reports originate from National Weather Service (NWS) offices and are verified by the NWS Storm Prediction Center each spring. HERA displays LSR data for hail, high winds and tornadoes from 1989-2018. LSRs are generated from reports of severe weather in an area or county made by storm spotters (storm chasers, law enforcement officials, emergency management personnel, firefighters, EMTs, or public citizens). LSRs may also be issued by NWS Weather Forecast Offices (WFO) after a weather event has ended to inform media outlets and the public.",
  },
  {
    "Dataset": "National Hurricane Center (NHC) Best Track Data (HURDAT2)",
    "Years": "1950-2019",
    "Hazards": "Hurricanes, Tropical Storms",
    "Description": "The Atlantic hurricane database known as Atlantic HURDAT2 (1851-2019), has six-hourly information on the location, maximum winds, central pressure, and (beginning in 2004) size of all known tropical cyclones and subtropical cyclones. HERA displays hurricanes and tropical storms data from 1950-2019. The location of hurricane and tropical storm tracks every six hours was used to ascertain the proximity to county centroids. If hurricanes or tropical storms were found to be within 75 miles of a county centroid, they were counted for that county.",
  },
  {
    "Dataset": "National Weather Service (NWS) Watches, Warnings and Advisories (WWA or WaWA)",
    "Years": "2006-2019",
    "Hazards": "Floods, Heat, Winter Weather",
    "Description": `NWS WaWA data is used as a best-available proxy for occurrence of hazards in HERA related to floods, heat, and winter weather. The WaWA data is downloaded from the Iowa Environmental Mesonet (IEM) at <a href="https://mesonet.agron.iastate.edu/pickup/wwa/" target="_blank">WWA</a> for years 2006-2019. Only Warnings and Advisories are used as a proxy for the occurrence of hazards, because Advisories and Warnings are issued only when an event is imminent or occurring. However, users should be aware that the issuance of Advisories and Warnings may vary geographically, because they are issued by different Weather Forecast Offices (WFO) based on local criteria. The count of flood, heat, and winter weather Advisories and Warnings in HERA is made on a daily basis. So, multi-day events may be counted for each day an Advisory or Warning is in effect, if that Advisory or Warning is updated on a daily basis.`,
  },
];


$('#datasourceTb').DataTable({
  responsive: 'true',
  data: sourcedata,
  // "dom": 'Brt<"bottom"l>',
  "dom": 't',
  columns: [{
      data: 'Dataset'
    },
    {
      data: 'Years'
    },
    {
      data: 'Hazards'
    },
    {
      data: 'Description'
    }
  ]
});


$('a[href="#about-tabpanel-2"]').click(function (e) {
  e.preventDefault();
  $(this).tab('show');
  console.log('here');
});


$(function () {
  $("#dialog").dialog({
    autoOpen: true,
    modal: false,
    minHeight: 300,
    // width: 'auto',
    minWidth: 180,
    close: function (e, ui) {
      $('#toggle').bootstrapToggle('off');
      $(this).dialog("close");
    },
    // resizable: true
  });
});


let legendImg = document.getElementById("legend");
let legendSrc = "http://hera1.oasis.unc.edu:8080/geoserver/hera/wms?&REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER="
let firstLyr = 'hera:hw_sql';
legendImg.src = legendSrc + firstLyr;

updateLegend = function (l) {
  firstLyr = l.getSource().params_.LAYERS;
  legendImg.src = legendSrc + firstLyr;
};

function testtoggle() {
  let toggleon = document.getElementById('toggle').checked;
  if (toggleon) {
    $("#dialog").dialog("open");
    console.log("toggle on")
  } else {
    $("#dialog").dialog("close");
    console.log("toggle off")
  }
}


var dt_from = "2006/01/01";
var dt_to = "2019/12/31";

// $('.slider-time').html(dt_from);
// $('.slider-time2').html(dt_to);
$('.slider-time').html('2006');
$('.slider-time2').html('2019');
var min_val = Date.parse(dt_from) / 1000;
var max_val = Date.parse(dt_to) / 1000;

function zeroPad(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join("0") + num;
}

function formatDT(__dt) {
  var year = __dt.getFullYear();
  // var month = zeroPad(__dt.getMonth() + 1, 2);
  // var date = zeroPad(__dt.getDate(), 2);

  // return year + '/' + month + '/' + date;
  return year;
};


$("#slider-range").slider({
  range: true,
  min: min_val,
  max: max_val,
  step: 10,
  values: [min_val, max_val],
  slide: function (e, ui) {
    var dt_cur_from = new Date(ui.values[0] * 1000); //.format("yyyy-mm-dd hh:ii:ss");
    $('.slider-time').html(formatDT(dt_cur_from));

    var dt_cur_to = new Date(ui.values[1] * 1000); //.format("yyyy-mm-dd hh:ii:ss");                
    $('.slider-time2').html(formatDT(dt_cur_to));
  }
});

let updateMapBtn = document.getElementById('updateMap');
let targetLayer = document.getElementById('target-layer');
let subCategory = document.getElementById('subcategory');
let check = document.getElementById('checkboxes');
let form = document.getElementById('filterForm');

document.addEventListener('mouseup', function (e) {
  if (!check.contains(e.target)) {
    check.style.display = 'none';
  }
});

// From the stackoverflow post: 
// function refreshSource(source, params) {
function refreshSource(lyrname, params, l) {
  let newurl = 'http://152.7.99.155:8080/geoserver/hera/wfs?service=WFS' +
    '&version=1.0.0&request=GetFeature' +
    '&typeName=' + lyrname +
    '&outputFormat=application/json&srsname=EPSG:4326' +
    '&bbox=-84.321821,31.995954,-75.400119,36.588137' +
    '&viewparams=' + params;

  let newsource = new ol.source.Vector({
    renderMode: 'image',
    format: new ol.format.GeoJSON(),
    url: function () {
      return newurl;
    },
    strategy: ol.loadingstrategy.bbox,
  });

  l.setSource(newsource);
}

updateMapBtn.onclick = function () {
  overlay.setPosition(undefined);
  let selectedState = form.querySelector('#state-picker').value;
  let selectedLayer = form.querySelector('#target-layer').value;
  let minYear = form.querySelector('.slider-time').innerHTML.replace(/\//g, "-");
  let maxYear = form.querySelector('.slider-time2').innerHTML.replace(/\//g, "-");
  let categories = [];
  let params = "state:" + selectedState + ";";


  form.querySelectorAll('input[type="checkbox"]:checked').forEach(i => categories.push("'" + i.name + "'"));
  // let params = "minYear:" + minYear + ";maxYear:" + maxYear + ";sublist:" + "'CF'\\,'FA'";
  if (categories.length > 0) {
    params += "minYear:" + minYear + ";maxYear:" + maxYear + ";sublist:" + categories.join("\\,");
  } else {
    params += "minYear:" + minYear + ";maxYear:" + maxYear;
  }
  // let params = "sublist:" + categories.join("\\,");
  console.log(params);

  let lyrs = map.getLayerGroup().getLayers().array_.filter(e => {
    return e.values_.title == 'Layers'
  })[0];
  let lyrGroups = lyrs.getLayers().getArray();
  let selectedLyr = lyrGroups.filter(l => l.get('title') == selectedLayer);
  console.log(selectedLyr);

  // Update WMS layer
  selectedLyr[0].getLayersArray()[0].getSource().updateParams({
    'viewparams': params
  });

  // Update WFS layer
  // let wfsl = selectedLyr[0].getLayersArray()[1];
  // refreshSource(lyrname, params, wfsl);
}

targetLayer.onchange = function () {
  let selectedLayer = form.querySelector('#target-layer').value;

  let lyrs = map.getLayerGroup().getLayers().array_.filter(e => {
    return e.values_.title == 'Layers'
  })[0];
  let lyrGroups = lyrs.getLayers().getArray();
  let selectedLyr = lyrGroups.filter(l => l.get('title') == selectedLayer);
  let nonselectedLyr = lyrGroups.filter(l => l.get('title') != selectedLayer);

  nonselectedLyr.forEach(l => l.setVisible(false));
  selectedLyr[0].getLayersArray()[0].setVisible(true);
  updateLegend(selectedLyr[0]);
  // selectedLyr[0].getLayersArray()[0].getSource().getFeatureInfoUrl()


  console.log(this.value);
  check.innerHTML = '';
  // subCategory.options.length = 0;
  switch (this.value) {
    case 'Floods ':
      sub = ['FA', 'FL', 'FF', 'CF'];
      $('.slider-time').html('2006');
      $('.slider-time2').html('2019');

      break;
    case 'Winter Weather ':
      sub = ['BZ', 'WC', 'WW', 'HS', 'SN', 'ZR', 'IS', 'WS'];
      $('.slider-time').html('2006');
      $('.slider-time2').html('2019');

      break;
    case 'Heat ', 'Hails ':
      sub = [];
      $('.slider-time').html('2006');
      $('.slider-time2').html('2019');
      // check.style.visibility = 'hidden';
      break;
    case 'High Winds ':
      sub = ['Gale Force', 'Storm Force', 'Hurricane Force'];
      $('.slider-time').html('1989');
      $('.slider-time2').html('2018');
      // dt_from = "1989/01/01";
      // dt_to = "2018/12/31";
      // check.style.visibility = 'hidden';
      break;
  }

  for (s of sub) {
    var l = document.createElement('label');
    var input = document.createElement('input');
    input.value = s;
    input.id = s;
    input.name = s;
    input.type = 'checkbox';
    l.setAttribute('for', s);
    l.appendChild(input);
    l.innerHTML = l.innerHTML + s;

    // check.appendChild(input);
    check.appendChild(l);
    // check.appendChild(document.createElement('br'));
  };

  document.getElementsByClassName('ui-slider-handle ui-corner-all ui-state-default')[0].style.left = '0%';
  document.getElementsByClassName('ui-slider-handle ui-corner-all ui-state-default')[1].style.left = '100%';
  document.getElementsByClassName('ui-slider-range ui-corner-all ui-widget-header')[0].style.left = '0%';
  document.getElementsByClassName('ui-slider-range ui-corner-all ui-widget-header')[0].style.width = '100%';

}

var expanded = false;

function showCheckboxes() {
  var checkboxes = document.getElementById("checkboxes");
  if (!expanded) {
    checkboxes.style.display = "block";
    expanded = true;
  } else {
    checkboxes.style.display = "none";
    expanded = false;

  }
}



// (function loadingIndicator() {
//   let allLyrs = map.getLayerGroup().getLayers().array_;
//   let lyrsArray = allLyrs.filter(e => {
//     return e.values_.title == 'Layers'
//   })[0].getLayersArray();
//   // let tilelyrs = lyrsGroup.getLayersArray().filter(e => {
//   //   return e.type == 'TILE'
//   // });
//   var tilesLoading = 0;
//   var tilesLoaded = 0;

//   for (layer of lyrsArray) {
//     if (layer instanceof ol.layer.Tile) {
//       console.log('tileloaded: ', tilesLoaded);
//       console.log('tileloading: ', tilesLoading);
//       // if (layer instanceof ol.layer.Vector) {
//       // layer.on("precompose", function () {
//       layer.getSource().on('tileloadstart', function () {
//         tilesLoading++;
//         $("#ajaxSpinnerContainer").show();
//         $("#ajaxSpinnerImage").show();
//         console.log('show')
//       });
//       // layer.on("render", function () {
//       layer.getSource().on('tileloadend', function () {
//         tilesLoaded++;
//         if (tilesLoading === tilesLoaded) {
//           console.log(tilesLoaded + ' tiles finished loading');
//           $("#ajaxSpinnerContainer").hide();
//           $("#ajaxSpinnerImage").hide();
//           console.log("hide")
//           tilesLoading = 0;
//           tilesLoaded = 0;
//           //trigger another event, do something etc...
//         }

//       });
//     }

//   }



// })()

function toggleNav() {
  navSize = document.getElementById("tableSidenav").style.height;
  // If the height of table navigation bar equals to 250 px (the table is opened), close the table; otherwise, open it.
  if (navSize == "50%") {
    console.log("close");
    return closeNav();
  }
  return openNav();
}

function openNav() {
  document.getElementById("tableSidenav").style.height = "50%";
  document.getElementById("map").style.marginBottom = "50%";
}

function closeNav() {
  document.getElementById("tableSidenav").style.height = "0";
  document.getElementById("map").style.marginBottom = "0";
}


let viewObject = {
  'nc': [-79.5, 34.9],
  'sc': [-80.98, 33]
}

var statepicker = document.getElementById('state-picker');

statepicker.onchange = function (e) {
  let selstate = e.srcElement.value;
  let baselyrs = map.getLayerGroup().getLayers().array_.filter(e => {
    return e.values_.title == 'Base maps'
  })[0];


  let statelyr = baselyrs.getLayersArray().filter(l => l.type == 'VECTOR')[0];

  let newsource = new ol.source.Vector({
    renderMode: 'image', // Vector layers are rendered as images. Better performance. Default is 'vector'.
    format: new ol.format.GeoJSON(),
    url: function (extent) {
      return 'http://hera1.oasis.unc.edu:8080/geoserver/hera/wfs?service=WFS' +
        '&version=1.0.0&request=GetFeature' +
        '&typeName=hera:tl_' + selstate + '_county' +
        '&outputFormat=application/json&srsname=EPSG:4326'
    },
    strategy: ol.loadingstrategy.bbox,
  });
  statelyr.setSource(newsource);

  let lyrs = map.getLayerGroup().getLayers().array_.filter(e => {
    return e.values_.title == 'Layers'
  })[0];

  let lyrsArray = lyrs.getLayersArray();

  lyrsArray.forEach(function (l) {
    l.getSource().updateParams({
      // LAYERS: newl
      'viewparams': 'state:' + selstate
    })
  });


  let newView = new ol.View({
    center: ol.proj.fromLonLat(viewObject[selstate]),
    zoom: 8
  });
  map.setView(newView);
}