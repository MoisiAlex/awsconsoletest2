PerficientCCPApp.controller("AgentCCPUtilsController", function($scope, $rootScope, CountryCodesHolder) {
    $scope.thisControllerName = "AgentCCPUtilsController";
    console.log($scope.thisControllerName);

    $scope.countryCode = "+1";
    $scope.callableCountries = CountryCodesHolder.value.callableCountries;
    $scope.countryCodesToDialCodes = CountryCodesHolder.value.countryCodesToDialCodes;
    $scope.countryISOCodesToCountryNames = CountryCodesHolder.value.countryISOCodesToCountryNames;
    $scope.countryNamesToCountryISOCodes = CountryCodesHolder.value.countryNamesToCountryISOCodes;

    angular.element(document.getElementById("settingsPage")).ready(function() {
        console.log("ready");
        var phoneTypeSelect = document.getElementsByName("phoneType");
        var val = null;
        if (localStorage.getItem("phoneType") === null) {
            console.log("It's null");
            localStorage.setItem("phoneType", "Softphone");
            val = localStorage.getItem("phoneType");
            $scope.setSoftPhone();
        }
        else {
            val = localStorage.getItem("phoneType");
        }
        for(var i = 0; i < phoneTypeSelect.length; i++) {

            if (phoneTypeSelect[i].value === val) {
                phoneTypeSelect[i].checked = true;

            }
        }
    });

    $scope.setSoftPhone = function() {
        var newConfig = $rootScope.perm_agent.getConfiguration();
        newConfig.softphoneEnabled = true;
        $rootScope.perm_agent.setConfiguration(newConfig, {
            success: function() {
                console.log("Changed to softphone");
                localStorage.setItem("phoneType", "Softphone")
            },
            failure: function() {
                console.log("Failed to change to softphone");
            }
        })
    };

    $scope.setHardPhone = function(number) {
        var newConfig = $rootScope.perm_agent.getConfiguration();
        newConfig.softphoneEnabled = false;
        let countryCode = $scope.countryCode;
        newConfig.extension = countryCode + number;
        $rootScope.perm_agent.setConfiguration(newConfig, {
            success: function() {
                console.log("Changed to hardphone");
                localStorage.setItem("phoneType", "hardPhone");
            },
            failure: function() {
                console.log("Failed to change to hardphone");
            }
        })
    };

    $scope.downloadAgentLog = function() {
        connect.getLog().download();
    };
});
