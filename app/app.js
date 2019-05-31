angular.module('app', ['ui.router'])
.constant('lodash', _ )
.config(function($stateProvider, $urlRouterProvider){
  var helloState = {
    name: 'Home',
    url: '/',
    templateUrl: './views/home.html',
    controller: 'Home'
  }  
  var dashState = {
    name: 'Dashboard',
    url: '/dash/:id',
    templateUrl: './views/dashboard.html',
    controller: 'Dash'
  } 
  var reportState = {
    name: 'Report',
    url: '/report/:id',
    templateUrl: './views/report.html',
    controller: 'Report'
  }
  var aboutState = {
    name: 'Builder',
    url: '/builder',
    templateUrl: './views/builder.html',
    controller: 'Builder'
  } 
  var apisState = {
    name: 'Apis',
    url: '/apis',
    templateUrl: './views/apis.html',
    controller: 'Apis'
  } 
  var apiState = {
    name: 'Api',
    url: '/apis/:id',
    templateUrl: './views/apis.html',
    controller: 'Apis'
  }
  $stateProvider.state(helloState);
  $stateProvider.state(dashState);
  $stateProvider.state(reportState);
  $stateProvider.state(aboutState)
  $stateProvider.state(apisState)
  $stateProvider.state(apiState)
  $urlRouterProvider.otherwise('/');
})

.filter('trustUrl', ['$sce', function ($sce) {
    return function(url) {
      return $sce.trustAsResourceUrl(url);
    };
  }])

.controller('Builder', function($scope, $http){
    $scope.report = {};
    $scope.request = {};
    $scope.data = [];
    $scope.apis = [];
    $scope.loading = false;

    var derivers = $.pivotUtilities.derivers;
    var renderers = $.extend(
      $.pivotUtilities.renderers, 
      $.pivotUtilities.gchart_renderers,
      $.pivotUtilities.export_renderers,
      $.pivotUtilities.plotly_renderers
    );

    $scope.loadApis = function(){
      $scope.loading = true;
      $http.get('./api.php/records/restbi_apis').then(function(json){ 
        $scope.apis = json.data.records
        $scope.loading = false
      })
    }
    $scope.loadApis();

    $scope.updateData = function(req) {
      $scope.loading = true;
      if(req) $scope.request = req;
      return $http($scope.request).then(function(json)
      {
          $("#output").pivotUI(json.data, {
              renderers: renderers,
              cols: [], rows: [],
              rendererName: "table",
              rendererOptions: { plotly: {width: ($('#output').innerWidth() - 30), height: 'auto', responsive: true } }
          });

          $scope.report.api_id = $scope.request.id;
          $scope.data = json.data;
          $scope.loading = false;
      })
    }

    $scope.saveRequest = function(data){
        $scope.loading = true;
        if(data.id)
           var rtn = $http.put('./api.php/records/restbi_apis/'+data.id, data)
        else
           var rtn = $http.post('./api.php/records/restbi_apis', {type: 'api', data: data} )

        rtn.then(success, error).then(function(){ $scope.loading = false })
    }

    $scope.saveReport = function(){
        var config = $("#output").data("pivotUIOptions");
        delete config["aggregators"];
        delete config["renderers"];
        $scope.report.config = JSON.stringify( config );
        if($scope.report.id)
           var rtn = $http.put('./api.php/records/restbi_reports/'+$scope.report.id, $scope.report )
        else
           var rtn = $http.post('./api.php/records/restbi_reports', $scope.report )

        rtn.then(success, error).then(function(){ $scope.loading = false })
    }

    function success(msg){ alert('Saved') }
    function error(err){ alert('Error'+err.toString()) }
})

.controller('Dash', function($scope, $http, $sce, $stateParams){
    $scope.loading = false
    $scope.dash = {};
    $scope.allReports = [];
    $scope.reports = [
     // {"id":1, "api_id":"1","config":"{\"grid\":{\"type\":\"compact\",\"title\":\"\",\"showFilter\":true,\"showHeaders\":true,\"showTotals\":\"on\",\"showGrandTotals\":\"on\",\"grandTotalsPosition\":\"top\",\"showExtraTotalLabels\":false,\"showHierarchies\":true,\"showHierarchyCaptions\":true,\"drillthroughMaxRows\":1000,\"showReportFiltersArea\":true},\"configuratorActive\":false,\"configuratorButton\":true,\"showAggregations\":true,\"showCalculatedValuesButton\":true,\"drillThrough\":true,\"showDrillThroughConfigurator\":true,\"sorting\":\"on\",\"datePattern\":\"dd/MM/yyyy\",\"dateTimePattern\":\"dd/MM/yyyy HH:mm:ss\",\"saveAllFormats\":false,\"showDefaultSlice\":true,\"showEmptyData\":true,\"defaultHierarchySortName\":\"asc\",\"selectEmptyCells\":true,\"showAggregationLabels\":true}"},
      //{"id":2, "api_id":"1","config":"{\"grid\":{\"type\":\"compact\",\"title\":\"\",\"showFilter\":true,\"showHeaders\":true,\"showTotals\":\"on\",\"showGrandTotals\":\"on\",\"grandTotalsPosition\":\"top\",\"showExtraTotalLabels\":false,\"showHierarchies\":true,\"showHierarchyCaptions\":true,\"drillthroughMaxRows\":1000,\"showReportFiltersArea\":true},\"configuratorActive\":false,\"configuratorButton\":true,\"showAggregations\":true,\"showCalculatedValuesButton\":true,\"drillThrough\":true,\"showDrillThroughConfigurator\":true,\"sorting\":\"on\",\"datePattern\":\"dd/MM/yyyy\",\"dateTimePattern\":\"dd/MM/yyyy HH:mm:ss\",\"saveAllFormats\":false,\"showDefaultSlice\":true,\"showEmptyData\":true,\"defaultHierarchySortName\":\"asc\",\"selectEmptyCells\":true,\"showAggregationLabels\":true}"}
    ];

    var derivers = $.pivotUtilities.derivers;
    var renderers = $.extend(
      $.pivotUtilities.renderers, 
      $.pivotUtilities.gchart_renderers,
      $.pivotUtilities.export_renderers,
      $.pivotUtilities.plotly_renderers
    );

    $scope.loadApis = function(){
      $scope.loading = true;
      $scope.instances = {};

      $http.get( './api.php/records/restbi_dashs?filter=id,eq,'+$stateParams.id+'&join=restbi_reports,restbi_apis' ).then(function(json){
        if( !json.data || !json.data.records [0] || !json.data.records[0] ){
          alert('Dashboard doesn`t exists');
          return;
        }
        $scope.dash = json.data.records[0];
        $scope.reports = json.data.records[0].restbi_reports.map(function(i){
            i.config = JSON.parse(i.config);
                return i;
        })
        $scope.loading = false
      })
    }
    $scope.loadApis();

    $scope.createInstance = function(row, json){
       var config = Object.assign({
         renderer: $.pivotUtilities.plotly_renderers[row.config.rendererName]
       }, row.config)
       config['rendererOptions'] = { plotly: {width: ($('#table'+row.id).innerWidth() - 30), height: $('#table'+row.id).innerWidth(), responsive: true } };
       $('#table'+row.id).pivot(json, config, true);

    }

    $scope.forceRefresh = function(row){
      $scope.loadInstance(row)
      
     $scope.instances['#table'+row.id] = { 
        interval: setInterval(function(){ $scope.loadInstance(row) }, row.api_id.refresh)
     }
    } 

    $scope.stopRefresh = function(row){
      clearInterval( $scope.instances['#table'+row.id]['interval'] )
      delete $scope.instances['#table'+row.id]['interval'];
    }

    $scope.loadInstance = function(row){
       $http({
         method: row.api_id.method,
         url: $sce.trustAsResourceUrl(row.api_id.url),
         data: row.api_id.body,
       }).then(function(json){
          $scope.createInstance(row, json.data);
       })
    }
    
    $scope.loadReports = function(){
      $scope.loading = true
       $http.get( './api.php/records/restbi_reports?include=id,chart' ).then(function(json){
          $scope.allReports = json.data.records;
          $scope.loading = false
      })
    }
    $scope.AddReports = function(reportId){
      $scope.loading = true
       $http.post( './api.php/records/restbi_dash_report', {dash_id:$scope.dash.id, report_id: reportId }).then(function(json){
          $scope.loadApis()
          $scope.loading = false
      })
    }
    $scope.loadReports()

    //$scope.loadApis();
})

.controller('Report', function($scope, $http, $stateParams, $location, $sce){
    $scope.apis = [];
    $scope.dashs = [];
    $scope.reports = [];
    $scope.loading = false;
  
   var renderers = $.extend(
      $.pivotUtilities.renderers, 
      $.pivotUtilities.gchart_renderers,
      $.pivotUtilities.export_renderers,
      $.pivotUtilities.plotly_renderers
    );
  
   $scope.loadApis = function(){
      $scope.loading = true;
      $http.get('./api.php/records/restbi_apis').then(function(json){ 
        $scope.apis = json.data.records
        $scope.loading = false
      })
    }
    $scope.loadApis();
  
    $scope.loadReport = function(){
      $scope.loading = true;
      $http.get('./api.php/records/restbi_reports?filter=id,eq,'+$stateParams.id+'&join=restbi_apis').then(function(json){ 
        json.data['records'][0].config = JSON.parse(json.data['records'][0].config);
        $scope.reports = json.data['records'][0]
        $scope.loadInstance($scope.reports)
        $scope.loading = false
      })
    }      
    $scope.loadReport();
    
    $scope.loadInstance = function(row){
       $http({
         method: row.api_id.method,
         url: $sce.trustAsResourceUrl(row.api_id.url),
         data: row.api_id.body,
       }).then(function(json){
          $scope.createInstance(row, json.data);
       })
    }
    
    $scope.createInstance = function(row, json){
       var config = Object.assign({
         renderer: $.pivotUtilities.plotly_renderers[$scope.reports.config.rendererName]
       }, $scope.reports.config)
       config['rendererOptions'] = { plotly: {width: ($('.pvtRendererArea').innerWidth() - 30), height: $('.pvtRendererArea').innerWidth(), responsive: true } };
       $('#output').pivotUI(json, config, true);

    }
    
    $scope.saveReport = function(){
        var config = $("#output").data("pivotUIOptions");
        delete config["aggregators"];
        delete config["renderers"];
        $scope.reports.config = JSON.stringify( config );
        if($scope.reports.id)
           var rtn = $http.put('./api.php/records/restbi_reports/'+$scope.reports.id, $scope.reports )
        else
           var rtn = $http.post('./api.php/records/restbi_reports', $scope.reports )

        rtn.then(success, error).then(function(){ $scope.loading = false })
    }
    
    $scope.delete = function(row){
      if( confirm('Are you sure?') )
       $http({
         method: 'delete',
         url: './api.php/records/restbi_reports/'+$stateParams.id
       }).then(function(json){
          $location.path('/')
       })
    }
  
    function success(msg){ alert('Saved') }
    function error(err){ alert('Error'+err.toString()) }
})

.controller('Apis', function($scope, $http, lodash, $stateParams){
    $scope.request = {};
    $scope.data = [];
    $scope.apis = [];
    $scope.loading = false;
  
   $scope.loadApis = function(){
      $scope.loading = true;
      $http.get('./api.php/records/restbi_apis').then(function(json){ 
        $scope.apis = json.data.records
        $scope.loading = false
        if( $stateParams.id ) $scope.request = $scope.apis.find(function(i){ return i.id == $stateParams.id })
      })
    }
    $scope.loadApis();
  
    $scope.loadData = function(req) {
      $scope.loading = true;
      if(req) $scope.request = req;
      return $http($scope.request).then(function(json)
      {
          $scope.data = ( $scope.request.root ? lodash.get( json.data, $scope.request.root) : json.data);
          $scope.loading = false;
      })
    }
    
    $scope.saveRequest = function(data){
        $scope.loading = true;
        if(data.id)
           var rtn = $http.put('./api.php/records/restbi_apis/'+data.id, data)
        else
           var rtn = $http.post('./api.php/records/restbi_apis', data )

        rtn.then(success, error).then(function(){ $scope.loading = false; $scope.request = {}; $scope.loadApis() })
    }
    
    function success(msg){ alert('Saved') }
    function error(err){ alert('Error'+err.toString()) }
})

.controller('Nav', function($scope, $http){
    $scope.dashs = [];
    $scope.reports = [];
    $scope.loading = false;
    $scope.search = {};
  
    $scope.$watch('search.text', function(value, old){
      if( !value ){ $scope.search.results = null; return; }
      $scope.search.results = {}
      
      $http.get('./api.php/records/restbi_dashs?filter=name,cs,'+value).then(function(json){ $scope.search.results['Dashboards'] = json.data.records })
      $http.get('./api.php/records/restbi_reports?filter=chart,cs,'+value).then(function(json){ $scope.search.results['Reports'] = json.data.records })
      $http.get('./api.php/records/restbi_apis?filter=name,cs,'+value).then(function(json){ $scope.search.results['Apis'] = json.data.records })
      
    })
  
    $scope.loadApis = function(){
      $scope.loading = true;
      $http.get('./api.php/records/restbi_reports').then(function(json){ 
        $scope.reports = json.data.records
        $scope.loading = false
      })
    }  
    $scope.loadDashs = function(){
      $scope.loading = true;
      $http.get('./api.php/records/restbi_dashs').then(function(json){ 
        $scope.dashs = json.data.records
        $scope.loading = false
      })
    }
    $scope.loadApis();
    $scope.loadDashs()
})

.controller('Home', function($scope, $http){
    $scope.reports = [];
    $scope.loading = false;
  
    $scope.loadApis = function(){
      $scope.loading = true;
      $http.get('./api.php/records/restbi_dashs').then(function(json){ 
        $scope.reports = json.data.records
        $scope.loading = false
      })
    }
    $scope.loadApis();
  
    $scope.newDash = function(form){
      $scope.loading = true;
      $http.post('./api.php/records/restbi_dashs', form).then(function(json){ 
        $scope.loadApis()
        $scope.loading = false
      })
    }
})
