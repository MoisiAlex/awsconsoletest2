var PerficientCCPApp = angular.module('PerficientCCPApp', ["ngRoute"]);

PerficientCCPApp.config(["$routeProvider", "$locationProvider", "$interpolateProvider", function($routeProvider, $locationProvider, $interpolateProvider) {


    $interpolateProvider.startSymbol("INTERPOLATE_OPEN[");
    $interpolateProvider.endSymbol("]INTERPOLATE_CLOSE");

    $locationProvider.hashPrefix('');

    $routeProvider
        .when("/settings", {
            templateUrl: "static/partials/settings.html",
            controller: "AgentCCPUtilsController"
        })
        .when("/change-status", {
            templateUrl: "static/partials/change-status.html",
            controller: "AgentStateController"
        })
        .when("/dial-pad", {
            templateUrl: "static/partials/dial-pad.html",
            controller: "DialPadController"
        })
        .when("/quick-connects", {
            templateUrl: "static/partials/quick-connects.html",
            controller: "QuickConnectsController"
        })
        .otherwise({
            redirectTo: "/"
        })
}]);

PerficientCCPApp.run(

    function($rootScope, OutboundPhoneNumberHolder) {
        $rootScope.scopeName = "$rootScope";
        console.log($rootScope.scopeName);

        $rootScope.muteButtonActionLabel = "Mute";
        $rootScope.customerPhoneNumber = null;
        $rootScope.thirdPartyPhoneNumber = null;

        $rootScope.agentStates = "Initializing...";

        $rootScope.perm_contact = null;
        $rootScope.perm_agent = null;
        $rootScope.callConnecting = false;
        $rootScope.callConnected = false;
        $rootScope.callIsInbound = false;

        $rootScope.agentState = null;

        $rootScope.setCallConnected = function(val) {
            $rootScope.callConnected = val;
            $rootScope.$apply();
        };

        $rootScope.callIsConnected = function() {
            return $rootScope.callConnected;
        };

        connect.agent(subscribeToAgentEvents);
        connect.contact(subscribeToContactEvents);

        function handleAfterCallWork() {
            console.log("Handling After Call Work");
            $rootScope.agentState = "After Call Work";
            $rootScope.$emit("UpdateCustomerCallStatus");
            $rootScope.$apply();
        }

        function handleAgentOffline() {
            $rootScope.agentState = $rootScope.perm_agent.getStatus().name;
            $rootScope.$apply();
        }

        function handleMuteToggle(obj) {
            if (obj.muted === true) {
                $rootScope.muteButtonActionLabel = "Unmute";
            }
            else {
                $rootScope.muteButtonActionLabel = "Mute";
            }

            $rootScope.$apply();
        }

        function handleAgentOnline() {
            console.log("Handling agent online");
            $rootScope.agentState = $rootScope.perm_agent.getStatus().name;
            $rootScope.$emit("UpdateCustomerCallStatus");
            $rootScope.$apply();
        }

        function handleContactConnecting() {
            console.log("Handling Contact Connecting");
            $rootScope.callConnecting = true;
            $rootScope.agentState = $rootScope.perm_contact.getInitialConnection().getType() === "outbound"
              ? "Outbound Call"
              : "Connecting...";

            $rootScope.$emit("UpdateCustomerCallStatus");
            $rootScope.$apply();
        }

        function handleContactConnected() {
            console.log("Handling Contact Connected");
            $rootScope.callConnecting = false;
            $rootScope.callIsInbound = false;
            $rootScope.agentState = "Connected";
            $rootScope.setCallConnected(true);
            $rootScope.$emit("UpdateCustomerCallStatus");
            $rootScope.$apply();
        }

        function handleContactEnded() {
            console.log("Handling Contact Ended");
            $rootScope.setCallConnected(false);
            $rootScope.callConnecting = false;
            $rootScope.callIsInbound = false;
            $rootScope.$apply();
            $rootScope.perm_contact = null;
            OutboundPhoneNumberHolder.value = "";
        }

        function subscribeToContactEvents(contact) {
            console.log("Subscribing to contact events");

            $rootScope.perm_contact = contact;
            $rootScope.perm_contact.onConnecting(handleContactConnecting);
            $rootScope.perm_contact.onConnected(handleContactConnected);
            $rootScope.perm_contact.onEnded(handleContactEnded);

            $rootScope.customerPhoneNumber = $rootScope.perm_contact.getInitialConnection().getType() === "outbound"
              ? $rootScope.perm_contact.getInitialConnection().getEndpoint().phoneNumber.split(":")[1].split("@")[0]
              : $rootScope.customerPhoneNumber = $rootScope.perm_contact.getInitialConnection().getEndpoint().phoneNumber;
            // When contact is outbound, its endpoint phone number is in the format sip:+15416222013@lily-outbound, hence the need to do all this splitting.

            if ($rootScope.perm_contact.isInbound()) {
                console.log("inbound call.");
                $rootScope.callIsInbound = true;
                console.log($rootScope.callIsInbound);
                $rootScope.customerPhoneNumber = $rootScope.perm_contact.getInitialConnection().getEndpoint().phoneNumber.split(":")[1].split("@")[0];
                $rootScope.$apply();
                $rootScope.$emit("UpdateCustomerCallStatus");
                $rootScope.agentState = "Inbound Call";
            }
        }

        function subscribeToAgentEvents(agent) {
            console.log("Subscribing to agent events");

            $rootScope.perm_agent = agent;
            $rootScope.agentState = $rootScope.perm_agent.getStatus().name;
            $rootScope.agentStates = $rootScope.perm_agent.getAgentStates();
            $rootScope.$apply();

            $rootScope.perm_agent.onMuteToggle(handleMuteToggle);
            $rootScope.perm_agent.onAfterCallWork(handleAfterCallWork);
            $rootScope.perm_agent.onOffline(handleAgentOffline);
            $rootScope.perm_agent.onRoutable(handleAgentOnline);

            $rootScope.perm_agent.isAvailable = function() {
                return this.getStatus().name === "Available";
            };

            var quickConnectsPhoneNumbers = [];
            var quickConnectsQueues = [];
            $rootScope.perm_agent.getEndpoints($rootScope.perm_agent.getAllQueueARNs(), {
                success: function(data){
                    data.endpoints.forEach(
                        function(endpoint) {
                            if (endpoint.type === "phone_number") {
                                quickConnectsPhoneNumbers.push(endpoint);
                            }
                            else {
                                quickConnectsQueues.push(endpoint);
                            }
                        }
                    );
                    $rootScope.perm_agent.quickConnectsPhoneNumbers = quickConnectsPhoneNumbers;
                    $rootScope.perm_agent.quickConnectsQueues = quickConnectsQueues;
                },
                failure:function(){
                    console.log("Failed to getEndpoints");
                }
            });
        }



    }
);
