/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.0640826873385013, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.006, 500, 1500, "Get All Product"], "isController": false}, {"data": [0.0, 500, 1500, "Delete Product"], "isController": false}, {"data": [0.005847953216374269, 500, 1500, "Get Single Product (Textbook)"], "isController": false}, {"data": [0.014, 500, 1500, "Normal Login"], "isController": false}, {"data": [0.03955696202531646, 500, 1500, "Get Single Category (Electronics)"], "isController": false}, {"data": [0.0405, 500, 1500, "Get All Category"], "isController": false}, {"data": [0.5855, 500, 1500, "Get Payment Token"], "isController": false}, {"data": [0.0058997050147492625, 500, 1500, "Get Single Product (Smartphone)"], "isController": false}, {"data": [0.041428571428571426, 500, 1500, "Get Single Category (Book)"], "isController": false}, {"data": [0.001567398119122257, 500, 1500, "Get Single Product (Novel)"], "isController": false}, {"data": [0.0, 500, 1500, "Update Product"], "isController": false}, {"data": [0.017, 500, 1500, "Filter Product"], "isController": false}, {"data": [0.05, 500, 1500, "Admin Login"], "isController": false}, {"data": [0.0, 500, 1500, "Product by Category"], "isController": false}, {"data": [0.0, 500, 1500, "Update Category"], "isController": false}, {"data": [0.004, 500, 1500, "Register"], "isController": false}, {"data": [0.0, 500, 1500, "Create Category"], "isController": false}, {"data": [0.02, 500, 1500, "Search Product"], "isController": false}, {"data": [0.0, 500, 1500, "Get All Orders"], "isController": false}, {"data": [0.0, 500, 1500, "Delete Category"], "isController": false}, {"data": [0.02245508982035928, 500, 1500, "Get Single Category (Clothing)"], "isController": false}, {"data": [0.004, 500, 1500, "Get User Orders"], "isController": false}, {"data": [0.0, 500, 1500, "Create Product"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 11610, 0, 0.0, 19731.29043927653, 261, 61601, 17190.0, 44554.7, 49946.149999999994, 60280.34, 107.34097633136095, 15756.364413831361, 21.456566082655325], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Get All Product", 1000, 0, 0.0, 30384.944000000032, 275, 48092, 35367.0, 46016.3, 46971.2, 47708.98, 9.946883641355164, 43.56852571331589, 1.3890667585095589], "isController": false}, {"data": ["Delete Product", 10, 0, 0.0, 27477.699999999997, 11454, 45391, 27484.5, 45168.3, 45391.0, 45391.0, 0.10676802511183951, 0.03378207044554297, 0.04650247968738322], "isController": false}, {"data": ["Get Single Product (Textbook)", 342, 0, 0.0, 30561.55263157896, 422, 48017, 35441.5, 46282.5, 47185.55, 47856.54, 3.419555457790487, 2.1873133055202825, 0.5075902632657754], "isController": false}, {"data": ["Normal Login", 2000, 0, 0.0, 15016.683499999976, 753, 28635, 15121.5, 26168.100000000002, 27443.999999999993, 28212.9, 22.560631697687533, 14.25461787930062, 5.574062323745064], "isController": false}, {"data": ["Get Single Category (Electronics)", 316, 0, 0.0, 14540.718354430386, 261, 28156, 15395.5, 25266.6, 26308.95, 27434.26, 3.632852018762071, 1.5077754960682426, 0.5676331279315736], "isController": false}, {"data": ["Get All Category", 1000, 0, 0.0, 13896.926999999983, 279, 28218, 14048.5, 25150.8, 26342.649999999998, 27438.59, 11.490818835750236, 13.809327187421001, 1.6271179015466644], "isController": false}, {"data": ["Get Payment Token", 1000, 0, 0.0, 807.9449999999993, 270, 5294, 743.0, 1318.9, 1491.0, 1787.5300000000004, 15.601110799088895, 40.63297119254891, 2.2396125854160815], "isController": false}, {"data": ["Get Single Product (Smartphone)", 339, 0, 0.0, 30222.84660766961, 364, 47846, 33999.0, 46172.0, 46759.0, 47760.200000000004, 3.390508576286443, 2.2217102096564485, 0.5099007038555783], "isController": false}, {"data": ["Get Single Category (Book)", 350, 0, 0.0, 14429.139999999998, 278, 28012, 14441.5, 25508.7, 27057.649999999998, 27828.010000000002, 4.019708054346453, 1.613378916344133, 0.6006009104638743], "isController": false}, {"data": ["Get Single Product (Novel)", 319, 0, 0.0, 31626.025078369905, 1212, 48050, 37463.0, 45860.0, 46714.0, 47760.6, 3.178715559762842, 1.9991140825070997, 0.46252794766080413], "isController": false}, {"data": ["Update Product", 10, 0, 0.0, 41766.799999999996, 9149, 60843, 45206.5, 60842.4, 60843.0, 60843.0, 0.1094606871941942, 0.06702329186597633, 0.16853097600621736], "isController": false}, {"data": ["Filter Product", 1000, 0, 0.0, 14970.738999999983, 499, 28394, 15077.0, 26250.7, 27463.399999999998, 28046.93, 11.389002778916678, 3916.6483152461733, 2.702663745387454], "isController": false}, {"data": ["Admin Login", 40, 0, 0.0, 3761.7, 773, 8980, 3761.0, 6858.199999999998, 7994.949999999999, 8980.0, 1.5024602787063817, 0.9390376741914885, 0.365344345115126], "isController": false}, {"data": ["Product by Category", 1000, 0, 0.0, 45631.92399999996, 2422, 61601, 51369.5, 60372.3, 60740.7, 61289.75, 9.36592675845275, 12635.205832704061, 1.4634260560082422], "isController": false}, {"data": ["Update Category", 10, 0, 0.0, 43761.59999999999, 12770, 60841, 53088.5, 60766.4, 60841.0, 60841.0, 0.10228295556828411, 0.04636694138163816, 0.0462570671129613], "isController": false}, {"data": ["Register", 500, 0, 0.0, 29928.903999999988, 1079, 48199, 33913.0, 46508.4, 47265.15, 47997.54, 5.034536923293795, 1.617541648206698, 1.9054935608272752], "isController": false}, {"data": ["Create Category", 10, 0, 0.0, 17135.8, 3520, 31919, 16893.5, 31714.0, 31919.0, 31919.0, 0.22773336977067252, 0.09478511933228576, 0.09409569213864408], "isController": false}, {"data": ["Search Product", 1000, 0, 0.0, 14864.844999999998, 484, 28580, 15018.5, 26136.1, 27285.399999999998, 28052.88, 11.369967368193652, 2.964630163386431, 1.5989016611522326], "isController": false}, {"data": ["Get All Orders", 10, 0, 0.0, 23854.4, 8669, 38893, 23810.5, 38586.3, 38893.0, 38893.0, 0.19218942189421895, 0.30254819149754, 0.06156067420049201], "isController": false}, {"data": ["Delete Category", 10, 0, 0.0, 28850.8, 4632, 59571, 29084.0, 58524.200000000004, 59571.0, 59571.0, 0.11191691288387501, 0.03552050457740173, 0.04896364938669531], "isController": false}, {"data": ["Get Single Category (Clothing)", 334, 0, 0.0, 13474.94311377246, 524, 27940, 13098.0, 25262.0, 26438.5, 27705.85, 3.8415973683907847, 1.5719036106989637, 0.5889949090208527], "isController": false}, {"data": ["Get User Orders", 1000, 0, 0.0, 16505.88300000002, 701, 28099, 16998.0, 25997.7, 27181.699999999997, 27795.86, 10.102846982279607, 2.6342384221373583, 3.1966039279869065], "isController": false}, {"data": ["Create Product", 10, 0, 0.0, 10832.199999999999, 1660, 18891, 10873.0, 18700.3, 18891.0, 18891.0, 0.30528758090120894, 0.1881811729148858, 0.46446047098241544], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 11610, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
