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
	$scope.stock_date = "Week";
	get_user_portfolios();
	if ($cookies.getObject("stock")){
		$scope.automation_tool = true;
		a = $cookies.getObject("stock");
		var date1 = new Date();
		var date2 = new Date(a.date);
		var timeDiff = Math.abs(date2.getTime() - date1.getTime());
		var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
		if (diffDays == 0) {
			$cookies.remove("stock");
			console.log("Strategy finished");
		} else if (diffDays == a.days) {
			a.days -= 1;
			$cookies.putObject("stock",a);
			setTimeout(function(){
				shannon_ratchet();
			}, 3000);
		}
	}
	
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
		$http.post("/stocks",{stock:symbol})
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
	$scope.show_stock = function (holding) {
		$scope.stock_view = true;
		$scope.stock_view_holding = holding;
		$scope.get_stock_date_view(holding[1],$scope.stock_date);
	}
	$scope.get_stock_date_view = function (holding, date) {
		var ltime = 0;
		var htime = Math.floor((new Date()).getTime()/1000);
		var temp = new Date();
        switch(date) {
		    case 'Week':
		    	ltime = temp.setDate(temp.getDate() - temp.getDay());
		    	ltime = Math.floor(ltime/1000);
		        break;
		    case 'Month':
		        ltime  = new Date(temp.getFullYear(), temp.getMonth(), 0);
		        ltime = Math.floor(ltime.getTime()/1000);
		        break;
		    case 'Quarter':
		    	var quarter = temp.getMonth();
		    	if (0<=quarter && quarter<=2) {
		    		ltime  = new Date(temp.getFullYear(), 0, 0);
		    	} else if (3<=quarter && quarter<=5) {
		    		ltime  = new Date(temp.getFullYear(), 3, 0);
		    	} else if (6<=quarter && quarter<=8) {
		    		ltime  = new Date(temp.getFullYear(), 6, 0);
		    	} else {
		    		ltime  = new Date(temp.getFullYear(), 9, 0);
		    	}
		    	ltime = Math.floor(ltime.getTime()/1000);
		    	break;
		    case 'Year':
		    	ltime = new Date(temp.getFullYear(),0,0);
		    	ltime = Math.floor(ltime.getTime()/1000);
		    	break;
		    case '5-year':
		    	ltime = new Date(temp.getFullYear()-5,0,0);
		    	ltime = Math.floor(ltime.getTime()/1000);
		    	break;
		    case '10-year':
		    	ltime = new Date(temp.getFullYear()-10,0,0);
		    	ltime = Math.floor(ltime.getTime()/1000);
		    	break;
		    default:
		    	ltime = new Date(temp.getFullYear()-10,0,0);
		    	ltime = Math.floor(ltime.getTime()/1000);
		}
		var req = {
			request: "get_stock_information",
			symbol: holding,
			ltime: ltime,
			htime: htime
		}
		$http.post("/proxy",req)
		.then(function(data){
			$scope.stock_table = data.data;
			var x = [];
			var y = [];
			$scope.stock_table.forEach(function(data){
				x.push(new Date(data[1]*1000));
				y.push(data[5]);
			})
			var trace1 = {
			  x: x,
			  y: y,
			  type: 'scatter'
			};

			var data = [trace1];

			Plotly.newPlot('myChart', data);
		})
	}
	$scope.get_joint_view = function (holding, rownum) {
		var req = {
			request: "get_top_stock_information",
			symbol: holding,
			rownum: rownum
		}
		$http.post("/proxy",req)
		.then(function(data){
			$scope.stock_table = data.data;
			var x = [];
			var y = [];
			$scope.stock_table.forEach(function(data){
				x.push(new Date(data[1]*1000));
				y.push(data[5]);
			});
			var trace1 = {
			  x: x,
			  y: y,
			  type: 'scatter'
			};
			var data = [trace1];
			Plotly.newPlot('myChart', data);
		});
	}
	$scope.default_view = function () {
		$scope.stock_view = false;
	}
	$scope.predict = function () {
		if ($scope.stock_table.length > 5){
			table = $scope.stock_table;
			var result = table.map(function(data){
				return [(new Date(data[1]*1000)),data[5]]
			});
			$http.post("/predict",{data: result})
			.then(function(data){
				$scope.predicted_value = data.data.forecast;
				var table = data.data.data;
				var x = [];
				var y = [];
				table.forEach(function(data){
					x.push(new Date(data[0]));
					y.push(data[1]);
				})
				x.unshift(new Date( (new Date()).setDate((new Date()).getDate()+1)));
				y.unshift($scope.predicted_value);
				var trace1 = {
				  x: x,
				  y: y,
				  type: 'scatter'
				};
				var plotting = [trace1];
				Plotly.newPlot('myChart', plotting);
			})
		} else {
			alert('Need more inputs');
		}
	}
	$scope.automation = function (stock_option,stock_automation_date) {
		if ($cookies.getObject("stock")){
			alert("There is an existing automation strategy.");
		} else {
			var temp = new Date();
			var days;
			if (stock_automation_date == 'Day'){
				temp.setDate(temp.getDate()+1);
				days = 1;
			} else if (stock_automation_date == 'Week'){
				temp.setDate(temp.getDate()+7);
				days = 7;
			} else if (stock_automation_date == 'Month'){
				temp.setMonth(temp.getMonth()+1);
				days = 30;
			}
			var automate = {
				date: temp,
				stock: stock_option,
				days: days
			}
			$cookies.putObject("stock",automate);
			$scope.automation_tool = true;
			shannon_ratchet();
			alert("Automation Created");
		}
	}
	$scope.delete_automation = function () {
		$cookies.remove("stock");
		$scope.automation_tool = false;
		alert("Automation Deleted");
	}
	function shannon_ratchet () {
		var a_stock = $cookies.getObject("stock");
		var stock = a_stock.stock;
		var cash_value = $scope.portfolios[$scope.index][2];
		var market;
		var shares;
		$scope.holdings.forEach(function(data){
			if (data[1] == stock) {
				market = data[4];
				shares = data[3];
			}
		});
		var total = market * shares;
		if (cash_value > total) {
			var dividend = (cash_value - total) /2;
			shares = Math.floor(dividend / market);
			$scope.get_quantity($scope.portfolios[$scope.index][0],stock);
			setTimeout(function(){
				$scope.buy_stock(shares,market,$scope.portfolios[$scope.index][0],stock);
			}, 2000);
		} else {
			var dividend = (total-cash_value) /2;
			shares = Math.floor(dividend / market);
			$scope.sell_stock(shares,market,$scope.portfolios[$scope.index][0],stock);
		}		
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
				var req1 = {
					stock: item[1]
				}
				$http.post("/stocks",req1)
				.then(function(data){
					$scope.holdings.forEach(function(second){
						if (second[1] == item[1]) {
							var temp = data.data.split("/")
							temp = JSON.parse(temp[2]);
							second.push(parseFloat(temp[0].l));
						}
					});
				})
				.then(function(){
					$scope.present_value = 0;
					$scope.holdings.forEach(function(item){
						if (item[4]) {
							$scope.present_value += item[3]*item[4];
						}
					})
				})
			})
		});
	}
});