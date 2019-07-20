
angular.module('app')

.service('DataModel', function($http, lodash, $resource, baseUrl){
  return {
    loadSource: function($scope){ 
      if( !$scope.url || !$scope.method ){ return Promise.reject({}); } 
      return $http({
        url: $scope.url,
        method: $scope.method,
        headers: JSON.parse($scope.headers) || {},
        data: $scope.body || {},
      }).then(function(json){
          return ( $scope.root ? lodash.get( json.data, $scope.root) : json.data)
      })
    },
    
    loadApis: function(){
         var transResp = function(data, headers){  return angular.fromJson(data)['records']; }
         return $resource( baseUrl+'restbi_apis/:id', {id: '@id'}, {
              query: { method: 'GET', transformResponse: transResp, isArray:true },
              get: { method: 'GET', transformResponse: transResp }
          });
    }
    
  }
})