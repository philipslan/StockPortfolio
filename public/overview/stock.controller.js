var app = angular.module('overviewController', []);

app.controller('overviewController', function($scope, $cookies, $http) {
	// keeps track of which portfolio we're looking at
	$scope.index = 0;
	// default view is overiew
	$scope.view = "overview";
	// gets user
	$scope.user = $cookies.get("user");
	// gets all user portfolios
	$scope.sell_amount = 0;
	get_user_portfolios();
	$scope.logout = function () {
		$cookies.remove("login");
		$cookies.remove("user");
		window.location.href = "/";
	}
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
				$('#portfolio').modal('hide');
				alert("Created New Portfolio");
				get_user_portfolios();
			}
		});
	}
	$scope.act = function (index) {
		$scope.index = index;
		get_portfolio_holdings($scope.portfolios[index][0]);
	}
	$scope.quote = function (symbol) {
		$http.get("http://www.google.com/finance/info?q="+symbol)
		.then(function(data){
			var temp = data.data.split("/")
			temp = JSON.parse(temp[2]);
			$scope.market = parseFloat(temp[0].l);
		});
	}
	$scope.deposit = function (id, cash) {
		var req = {
			request: "deposit_portfolio_cash_amnt",
			amnt: cash,
			id: id
		}
		$http.post("/proxy",req)
		.then(function(data){
			get_user_portfolios();
		});
	}
	$scope.withdraw = function (id, cash) {
		var req = {
			request: "withdraw_portfolio_cash_amnt",
			amnt: cash,
			id: id
		}
		$http.post("/proxy",req)
		.then(function(data){
			get_user_portfolios();
		});
	}
	$scope.get_quantity = function (id, symbol) {
		var req = {
			request: "find_portfolio_holding",
			symbol: symbol,
			portfolio_id: id
		}
		$http.post("/proxy",req)
		.then(function(data){
			if (data.data.length == 0){
				$scope.quantity = null;
			} else {
				$scope.quantity = data.data[0][3];
			}
		});
	}
	$scope.buy_stock = function (buy_amount, market, id, symbol) {
		var date = Math.round(Date.now()/1000);
		symbol = symbol.toUpperCase();
		var req = {
			portfolio_id: id,
			symbol: symbol,
			timestamp: date,
			amount: buy_amount
		}
		if ($scope.quantity == null) {
			req.request = "create_holding";
		} else {
			req.request = "update_holding";
		}
		$http.post("/proxy",req)
		.then(function(data){
			$scope.withdraw(id,buy_amount*market);
		});
	}
	$scope.sell_stock = function (sell_amount, market, id, symbol) {
		var date = Math.round(Date.now()/1000);
		symbol = symbol.toUpperCase();
		var req = {
			request: "update_holding",
			portfolio_id: id,
			symbol: symbol,
			timestamp: date,
			amount: -sell_amount
		}
		$http.post("/proxy",req)
		.then(function(data){
			$scope.deposit(id,sell_amount*market);
		});
	}
	$scope.ssubmit = function(symbol,open,high,low,close,volume,date){
		var timestamp = date.getTime()/1000
		var req = {
			request: "insert_stock",
			symbol: symbol,
			timestamp: timestamp,
			open: open,
			high: high,
			low: low,
			close: close,
			volume: volume
		}
		$http.post("/proxy", req)
		.then(function(data){
			alert(data.data.result);
		});
	}
	function get_user_portfolios () {
		var req = {
			request: "find_all_user_portfolios",
			owner: $scope.user
		}
		$http.post("/proxy",req)
		.then(function(data){
			$scope.portfolios = data.data;
			get_portfolio_holdings($scope.portfolios[$scope.index][0]);
		});
	}
	function get_portfolio_holdings (portfolio_id) {
		var req = {
			request: 'find_all_portfolio_holdings',
			portfolio_id: portfolio_id
		}
		$http.post("/proxy",req)
		.then(function(data){
			$scope.holdings = data.data;
			$scope.holdings.forEach(function(item){
				$http.get("http://www.google.com/finance/info?q="+item[1])
				.then(function(data){
					$scope.holdings.forEach(function(second){
						if (second[1] == item[1]) {
							var temp = data.data.split("/")
							temp = JSON.parse(temp[2]);
							second.push(parseFloat(temp[0].l));
						}
					})
				})
			})
		});
	}
});