PerficientCCPApp.controller('DialPadController', function($scope, $rootScope, OutboundPhoneNumberHolder, CountryCodesHolder) {
    $scope.thisControllerName = "DialPadController";
    console.log($scope.thisControllerName);

    $scope.OutboundPhoneNumberHolder = OutboundPhoneNumberHolder;
    $scope.callableCountries = CountryCodesHolder.value.callableCountries;
    $scope.countryCodesToDialCodes = CountryCodesHolder.value.countryCodesToDialCodes;
    $scope.countryISOCodesToCountryNames = CountryCodesHolder.value.countryISOCodesToCountryNames;
    $scope.countryNamesToCountryISOCodes = CountryCodesHolder.value.countryNamesToCountryISOCodes;
    $scope.countryCode = "+1";

    $scope.show = false;
    $scope.showCountryCodeList = function() {
        $scope.show = !$scope.show;
    };

    $scope.changeCountryCodeButtonOnClick = function(countryCode) {
        const countryDialCode = $scope.countryCodesToDialCodes[countryCode];
        $scope.countryCode = countryDialCode;
        const selectedFlag = $("#selectedDialFlag");

        const selectedClassList = selectedFlag.attr("class").split(' ');

        selectedClassList.forEach(function(cssClass) {
            if (cssClass.includes("flag-")) {
                selectedFlag.removeClass(cssClass);
            }
        });
        
        selectedFlag.addClass(`flag-${countryCode}`);
        $("#selectedDialCode").html(`&nbsp;&nbsp;&nbsp;${countryDialCode}`);
    };

    $scope.emitMakingOutboundCall = function() {
        console.log("Emitting MakingOutboundCall");
        $scope.$emit("MakingOutboundCall", $scope.countryCode + $scope.OutboundPhoneNumberHolder.value);
        window.location.href ='#/';
    };

    $scope.playBeepOnClick = function() {
        $scope.playBeep();
    };

    $scope.playBeep = function() {
        let beep = new Audio("static/audio/beep.mp3");

        let beepPromise = beep.play();

        if (beepPromise !== undefined) {
            beepPromise.then(function() {
            }).catch(function(error) {
                console.log(error);
            })
        }
    };

    $scope.appendToOutboundNumber = function (symbol) {
        $scope.OutboundPhoneNumberHolder.value += symbol;
    };
});
