PerficientCCPApp.controller("AgentStateController", function($scope, $rootScope) {
    $scope.thisControllerName = "AgentStateController";
    console.log($scope.thisControllerName);

    angular.element(document.getElementById("changeStatusPage")).ready(function() {
        var agentStateChoices = document.getElementsByClassName("agentStateChoice");
        for(var index = 0; index < agentStateChoices.length; index ++) {
            if (agentStateChoices[index].textContent.trim() === $rootScope.agentState) {
                agentStateChoices[index].classList.add("active");
            }
        }
    });

    $scope.setAgentStatus = function(state) {
        delete state.$$hashKey; // Streams API fails when state object has this attribute.
        $rootScope.perm_agent.setState(state, {
           success: function() {
               localStorage.setItem("agentState", state.name);
               console.log(`Set agent ot ${state.name}`);
               window.location.href ='#/';
           },
           failure: function(err) {
               console.log(err);
               console.log(`Failed to set agent to ${state.name}`);
           }
        });
    };
});
