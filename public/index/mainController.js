var app = angular.module('mainController', []);

app.controller('mainController', function($scope,$http,$cookies) {
	$scope.hi = "hi";
	$scope.login = function () {
		var req = {
			request: "login",
			username: $scope.lusername,
			password: $scope.lpassword
		}
		$http.post("/proxy",req)
		.then(function(data){
			if (data.data.result == "success") {
				$scope.lusername = "";
				$scope.lpassword = "";
				$scope.login_success = true;
				$('#login').modal('hide');
				alert("Login Successful");
				$cookies.put("login", "true");
				$cookies.put("user", req.username);
			} else {
				$scope.lpassword = "";
				alert("Login credentials are not correct");
			}
		});
	}
	$scope.register = function () {
		var req = {
			request: "signup",
			username: $scope.rusername,
			password: $scope.rpassword,
			email: $scope.remail
		}
		$http.post("/proxy",req)
		.then(function(data){
			$scope.rusername = "";
			$scope.rpassword = "";
			$scope.remail = "";
			if (data.data.result == "success") {
				$('#signup').modal('hide')
				alert("Congratulations you may now login.")
			} else {
				alert("Username or email is not unique.")
			}
		})
	}
	$scope.logout = function () {
		$cookies.remove("login");
		$cookies.remove("user");
		$scope.login_success = false;
	}
	if ($cookies.get("login") == "true") {
		$scope.login_success = true;
	}
});