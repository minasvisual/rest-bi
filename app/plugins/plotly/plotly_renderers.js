(function() {
  var callWithJQuery;

  callWithJQuery = function(pivotModule) {
    if (typeof exports === "object" && typeof module === "object") {
      return pivotModule(require("jquery"), require("plotly.js"));
    } else if (typeof define === "function" && define.amd) {
      return define(["jquery", "plotly.js"], pivotModule);
    } else {
      return pivotModule(jQuery, Plotly);
    }
  };

  callWithJQuery(function($, Plotly) {
    var makePlotlyChart, makePlotlyScatterChart, makePlotlyGaugeChart;
    makePlotlyChart = function(traceOptions, layoutOptions, transpose) {
      if (traceOptions == null) {
        traceOptions = {};
      }
      if (layoutOptions == null) {
        layoutOptions = {};
      }
      if (transpose == null) {
        transpose = false;
      }
      return function(pivotData, opts) {
        var colKeys, columns, d, data, datumKeys, defaults, fullAggName, groupByTitle, hAxisTitle, i, layout, result, rowKeys, rows, titleText, traceKeys;
        defaults = {
          localeStrings: {
            vs: "vs",
            by: "by"
          },
          plotly: {},
          plotlyConfig: {}
        };
        opts = $.extend(true, {}, defaults, opts);
        rowKeys = pivotData.getRowKeys();
        colKeys = pivotData.getColKeys();
        traceKeys = transpose ? colKeys : rowKeys;
        if (traceKeys.length === 0) {
          traceKeys.push([]);
        }
        datumKeys = transpose ? rowKeys : colKeys;
        if (datumKeys.length === 0) {
          datumKeys.push([]);
        }
        fullAggName = pivotData.aggregatorName;
        if (pivotData.valAttrs.length) {
          fullAggName += "(" + (pivotData.valAttrs.join(", ")) + ")";
        }
        data = traceKeys.map(function(traceKey) {
          var datumKey, j, labels, len, trace, val, values;
          values = [];
          labels = [];
          for (j = 0, len = datumKeys.length; j < len; j++) {
            datumKey = datumKeys[j];
            val = parseFloat(pivotData.getAggregator(transpose ? datumKey : traceKey, transpose ? traceKey : datumKey).value());
            values.push(isFinite(val) ? val : null);
            labels.push(datumKey.join('-') || ' ');
          }
          trace = {
            name: traceKey.join('-') || fullAggName
          };
          if (traceOptions.type === "pie") {
            trace.values = values;
            trace.labels = labels.length > 1 ? labels : [fullAggName];
          } else {
            trace.x = transpose ? values : labels;
            trace.y = transpose ? labels : values;
          }
          return $.extend(trace, traceOptions);
        });
        if (transpose) {
          hAxisTitle = pivotData.rowAttrs.join("-");
          groupByTitle = pivotData.colAttrs.join("-");
        } else {
          hAxisTitle = pivotData.colAttrs.join("-");
          groupByTitle = pivotData.rowAttrs.join("-");
        }
        titleText = fullAggName;
        if (hAxisTitle !== "") {
          titleText += " " + opts.localeStrings.vs + " " + hAxisTitle;
        }
        if (groupByTitle !== "") {
          titleText += " " + opts.localeStrings.by + " " + groupByTitle;
        }
        layout = {
          title: titleText,
          hovermode: 'closest',
          width: window.innerWidth / 1.4,
          height: window.innerHeight / 1.4 - 50
        };
        if (traceOptions.type === 'pie') {
          columns = Math.ceil(Math.sqrt(data.length));
          rows = Math.ceil(data.length / columns);
          layout.grid = {
            columns: columns,
            rows: rows
          };
          for (i in data) {
            d = data[i];
            d.domain = {
              row: Math.floor(i / columns),
              column: i - columns * Math.floor(i / columns)
            };
            if (data.length > 1) {
              d.title = d.name;
            }
          }
          if (data[0].labels.length === 1) {
            layout.showlegend = false;
          }
        } else {
          layout.xaxis = {
            title: transpose ? fullAggName : null,
            automargin: true
          };
          layout.yaxis = {
            title: transpose ? null : fullAggName,
            automargin: true
          };
        }
        result = $("<div>").appendTo($("body"));
        Plotly.newPlot(result[0], data, $.extend(layout, layoutOptions, opts.plotly), opts.plotlyConfig);
        return result.detach();
      };
    };
    makePlotlyScatterChart = function() {
      return function(pivotData, opts) {
        var colKey, colKeys, data, defaults, j, k, layout, len, len1, renderArea, result, rowKey, rowKeys, v;
        defaults = {
          localeStrings: {
            vs: "vs",
            by: "by"
          },
          plotly: {},
          plotlyConfig: {}
        };
        opts = $.extend(true, {}, defaults, opts);
        rowKeys = pivotData.getRowKeys();
        if (rowKeys.length === 0) {
          rowKeys.push([]);
        }
        colKeys = pivotData.getColKeys();
        if (colKeys.length === 0) {
          colKeys.push([]);
        }
        data = {
          x: [],
          y: [],
          text: [],
          type: 'scatter',
          mode: 'markers'
        };
        for (j = 0, len = rowKeys.length; j < len; j++) {
          rowKey = rowKeys[j];
          for (k = 0, len1 = colKeys.length; k < len1; k++) {
            colKey = colKeys[k];
            v = pivotData.getAggregator(rowKey, colKey).value();
            if (v != null) {
              data.x.push(colKey.join('-'));
              data.y.push(rowKey.join('-'));
              data.text.push(v);
            }
          }
        }
        layout = {
          title: pivotData.rowAttrs.join("-") + ' vs ' + pivotData.colAttrs.join("-"),
          hovermode: 'closest',
          xaxis: {
            title: pivotData.colAttrs.join('-'),
            automargin: true
          },
          yaxis: {
            title: pivotData.rowAttrs.join('-'),
            automargin: true
          },
          width: window.innerWidth / 1.5,
          height: window.innerHeight / 1.4 - 50
        };
        renderArea = $("<div>", {
          style: "display:none;"
        }).appendTo($("body"));
        result = $("<div>").appendTo(renderArea);
        Plotly.newPlot(result[0], [data], $.extend(layout, opts.plotly), opts.plotlyConfig);
        result.detach();
        renderArea.remove();
        return result;
      };
    };
    makePlotlyGaugeChart = function(){
      return function(pivotData, opts) {
           // Enter a speed between 0 and 180
            var colTotals = ( pivotData.colTotals && Object.values(pivotData.colTotals).length > 0 ? Object.values(pivotData.colTotals)[0]['count'] : 0 )
            var rowsTotal = pivotData.allTotal.count;
            var totalsPercent = ((colTotals * 100 ) / pivotData.allTotal.count ); // % de items
        
            var level = (180 * totalsPercent) / 100;
            var levelBlock = pivotData.allTotal.count * 0.166;

            // Trig to calc meter point
            var degrees = 180 - level,  radius = .5;
            var radians = degrees * Math.PI / 180;
            var x = radius * Math.cos(radians);
            var y = radius * Math.sin(radians);

            // Path: may have to change to create a better triangle
            var mainPath = 'M -.0 -0.025 L .0 0.025 L ',
               pathX = String(x),
               space = ' ',
               pathY = String(y),
               pathEnd = ' Z';
            var path = mainPath.concat(pathX,space,pathY,pathEnd);

            var data = [{ 
              type: 'scatter',
               x: [0], y:[0],
              marker: {size: 28, color:'850000'},
              showlegend: false,
              name: pivotData.colAttrs.join("-"),
              text: colTotals +' of '+ rowsTotal,
              hoverinfo: 'text+name'
            },
            { values: [50/6, 50/6, 50/6, 50/6, 50/6, 50/6, 50],
              rotation: 90,
              text: [
                ((rowsTotal-levelBlock*1).toFixed(0)+'-'+ rowsTotal.toFixed(0)), 
                ((rowsTotal-levelBlock*1).toFixed(0)+'-'+(rowsTotal-levelBlock*2).toFixed(0)), 
                ((rowsTotal-levelBlock*2).toFixed(0)+'-'+(rowsTotal-levelBlock*3).toFixed(0)), 
                ((rowsTotal-levelBlock*3).toFixed(0)+'-'+(rowsTotal-levelBlock*4).toFixed(0)), 
                ((rowsTotal-levelBlock*4).toFixed(0)+'-'+(rowsTotal-levelBlock*5).toFixed(0)), 
                ((rowsTotal-levelBlock*5).toFixed(0)+'-'+(rowsTotal-levelBlock*6).toFixed(0)), 
                ''
              ],
              textinfo: 'text',
              textposition:'inside',	  
              marker: {colors:['rgba(14, 127, 0, .5)', 'rgba(110, 154, 22, .5)',
                       'rgba(170, 202, 42, .5)', 'rgba(202, 209, 95, .5)',
                       'rgba(210, 206, 145, .5)', 'rgba(232, 226, 202, .5)',
                       'rgba(255, 255, 255, 0)']},
              labels: [ 
                ((rowsTotal-levelBlock*1).toFixed(0)+'-'+ rowsTotal.toFixed(0)), 
                ((rowsTotal-levelBlock*1).toFixed(0)+'-'+(rowsTotal-levelBlock*2).toFixed(0)), 
                ((rowsTotal-levelBlock*2).toFixed(0)+'-'+(rowsTotal-levelBlock*3).toFixed(0)), 
                ((rowsTotal-levelBlock*3).toFixed(0)+'-'+(rowsTotal-levelBlock*4).toFixed(0)), 
                ((rowsTotal-levelBlock*4).toFixed(0)+'-'+(rowsTotal-levelBlock*5).toFixed(0)), 
                ((rowsTotal-levelBlock*5).toFixed(0)+'-'+(rowsTotal-levelBlock*6).toFixed(0)), 
                ''
              ],
              hoverinfo: 'label',
              hovertext:'',
              hole: .5,
              type: 'pie',
              showlegend: false
            }];

            var layout = {
              shapes:[{
                  type: 'path',
                  path: path,
                  fillcolor: '850000',
                  line: {
                    color: '850000'
                  }
                }],
              title: pivotData.aggregatorName + ' vs ' + pivotData.colAttrs.join("-"),
              width: window.innerWidth / 1.5,
              height: window.innerHeight / 1.4 - 50,
              xaxis: {
                  zeroline:false, 
                  showticklabels:false,
                  showgrid: false, range: [-1, 1],
//                   title:{ text: '<b>'+colTotals +'/'+ rowsTotal+'</b>', font: {size:24}  }
              },
              yaxis: {zeroline:false, showticklabels:false,
                   showgrid: false, range: [-1, 1]}
            };
            var result = $("<div>").appendTo($("body"));
           
           // Plotly.newPlot('myDiv', data, layout, {showSendToCloud:true}); 
            Plotly.newPlot(result[0], data, $.extend(layout, opts.plotly), opts.plotlyConfig);
            var body = `
               <div class="gauge-footer" style="width: calc(100% - 40px) !important;padding: 25px 15px;position: absolute; bottom: 100px; z-index: 999;"> 
                    <h2 style="text-align:center;">
                      ${colTotals +'/'+ rowsTotal} 
                    </h2>
               </div>
           `;
            result.append(body).detach();
            return result;
        };
    };
    var textKPI = function(){
      return function(pivotData, opts) {
          var colTotals = ( pivotData.colTotals && Object.values(pivotData.colTotals).length > 0 ? Object.values(pivotData.colTotals)[0]['count'] : 0 )
          var rowsTotal = pivotData.allTotal.count;
          var totalsPercent = ((colTotals * 100 ) / pivotData.allTotal.count ); // % de items

          var level = (180 * totalsPercent) / 100;
        
         var body = `
             <div class="kpi-wrap" style="width:100%; padding: 25px 15px;"> 
                  <h2 style="text-align:center;color: #39afd1;">
                    ${ colTotals || pivotData.allTotal.count } 
                    <small style="color: #999;font-size: .6em;">${pivotData.colAttrs.join("-") || 'items'}</small>
                  </h2>
             </div>
         `;
        
         var result = $("<div>").appendTo($("body")).html( body );
         return result;
      }
    }
    return $.pivotUtilities.plotly_renderers = {
      "Horizontal Bar Chart": makePlotlyChart({
        type: 'bar',
        orientation: 'h'
      }, {
        barmode: 'group'
      }, true),
      "Horizontal Stacked Bar Chart": makePlotlyChart({
        type: 'bar',
        orientation: 'h'
      }, {
        barmode: 'relative'
      }, true),
      "Bar Chart": makePlotlyChart({
        type: 'bar'
      }, {
        barmode: 'group'
      }),
      "Stacked Bar Chart": makePlotlyChart({
        type: 'bar'
      }, {
        barmode: 'relative'
      }),
      "Line Chart": makePlotlyChart(),
      "Area Chart": makePlotlyChart({
        stackgroup: 1
      }),
      "Scatter Chart": makePlotlyScatterChart(),
      "Gauge Chart":   makePlotlyGaugeChart(),
      "KPI Text":   textKPI(),
      'Multiple Pie Chart': makePlotlyChart({
        type: 'pie',
        scalegroup: 1,
        hoverinfo: 'label+value',
        textinfo: 'none'
      }, {}, true)
    };
  });

}).call(this);

//# sourceMappingURL=plotly_renderers.js.map