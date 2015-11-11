var app = angular.module('overviewController', []);

app.controller('overviewController', function($scope, $cookies, $http) {
	// keeps track of which portfolio we're looking at
	$scope.index = 0;
	// gets user
	$scope.user = $cookies.get("user");
	// gets all user portfolios
	get_user_portfolios();
	$scope.logout = function () {
		$cookies.remove("login");
		$cookies.remove("user");
		window.location.href = "/";
	}
	// $http.get("http://www.google.com/finance/info?q=AAPL")
	// .then(function(data){
	// 	console.log(data);
	// })
	$scope.create_new = function (name, cash_amnt) {
		var req = {
			request: "create_portfolio",
			name: name,
			cash_amnt: cash_amnt,
			owner: $scope.user
		}
		$http.post("/proxy",req)
		.then(function(data){
			if (data.data.result == "success") {
				alert("Created New Portfolio");
				get_user_portfolios();
			}
		});
	}
	$scope.act = function (index) {
		$scope.index = index;
	}
	function get_user_portfolios () {
		var req = {
			request: "find_all_user_portfolios",
			owner: $scope.user
		}
		$http.post("/proxy",req)
		.then(function(data){
			$scope.portfolios = data.data;
		})
	}
});