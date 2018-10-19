PerficientCCPApp.controller("CallController", function($scope, $rootScope, OutboundPhoneNumberHolder, CountryCodesHolder) {
    $scope.thisControllerName = "CallController";
    console.log($scope.thisControllerName);

    $scope.OutboundPhoneNumberHolder = OutboundPhoneNumberHolder;
    $scope.countryCode = "+1";
    $scope.callableCountries = CountryCodesHolder.value.callableCountries;
    $scope.countryCodesToDialCodes = CountryCodesHolder.value.countryCodesToDialCodes;
    $scope.countryISOCodesToCountryNames = CountryCodesHolder.value.countryISOCodesToCountryNames;
    $scope.countryNamesToCountryISOCodes = CountryCodesHolder.value.countryNamesToCountryISOCodes;

    $scope.agentMuted = false;
    $scope.holdCustomerButtonActionLabel = "Hold";
    $scope.holdAllButtonActionLabel = "Hold all";

    $scope.isCustomerOnHold = $rootScope.perm_contact !== null && $rootScope.perm_contact.getInitialConnection() !== null
      ? $rootScope.perm_contact.getInitialConnection().isOnHold()
      : false;

    $scope.holdCustomerButtonActionLabel = $scope.isCustomerOnHold
      ? "Resume"
      : "Hold";

    $scope.customerCallStatus = $scope.isCustomerOnHold
      ? "On Hold"
      : $rootScope.agentState;


    $scope.connectedThirdParty = false;

    $rootScope.$on("MakingOutboundCall", function(event, data) {
        console.log("Received emission MakingOutboundCall");

        if ($rootScope.perm_contact && $rootScope.perm_contact.isConnected()) {
            $scope.transferToNumber();
        }
        else if (data) {
            $scope.sendCall(data);
        }
        else {
            $scope.sendCall();
        }
    });

    $rootScope.$on("TransferToOrCallQuickConnect", function(event, data) {
        $scope.callOrTransferToQuickConnect(data);
    });

    $rootScope.$on("HoldOrResumeCall", function() {
        $scope.holdOrResumeCustomerCall()
    });

    $rootScope.$on("MuteOrUnmute", function() {
        $scope.muteOrUnmuteAgent()
    });

    $rootScope.$on("EndCall", function() {
        $scope.hangUpAgent();
    });

    $rootScope.$on("AnsweringCall", function() {
        $scope.answerCall();
    });

    $rootScope.$on("SendToSurvey", function() {
        $scope.transferToQueueAndEndCall();
    });

    $rootScope.$on("SwapActiveCalls", function() {
        $scope.swapActiveCalls();
    });

    $rootScope.$on("AllHoldOrAllResume", function() {
        $scope.allHoldOrAllResume();
    });

    $rootScope.$on("JoinCalls", function() {
        $scope.mergeActiveCalls();
    });

    $rootScope.$on("UpdateCustomerCallStatus", function() {
        $scope.updateCustomerCallStatus();
    });

    $scope.numberIsValid = function() {
        return $scope.OutboundPhoneNumberHolder.value.trim().length !== 0
        // This is the only validation logic for outbound phone numbers in the default CCP.
    };

    $scope.connectAgent = function(endpoint) {
        $rootScope.perm_agent.connect(endpoint, {
            success: function() {
                console.log("Successfully sent outbound call");
            },
            failure: function(err) {
                console.log("Failed to send outbound call");
                console.log(err);
            }
        });

    };

    $scope.callOrTransferToQuickConnect = function(endpoint) {

        if ($rootScope.perm_contact && $rootScope.perm_contact.isConnected()) {
            console.log("Adding connection to Contact");
            $scope.connectedThirdParty = true;
            $rootScope.thirdPartyPhoneNumber = endpoint.phoneNumber;

            $scope.addConnectionToContact(endpoint);
        }
        else {
            $scope.sendCall(endpoint.phoneNumber);
        }
    };

    $scope.transferToNumber = function() {
        if ($scope.numberIsValid(OutboundPhoneNumberHolder.value)) {
            const endpoint = connect.Endpoint.byPhoneNumber(OutboundPhoneNumberHolder.value);
            $rootScope.thirdPartyPhoneNumber = OutboundPhoneNumberHolder.value;
            const successCallback = function (data) {
              $scope.connectedThirdParty = true;
              $scope.isCustomerOnHold = true;
              $scope.updateCustomerCallStatus();
              console.log("Transfering to number");
              $scope.$apply()
            }.bind($scope);

            $scope.addConnectionToContact(endpoint, successCallback);
        }
    };

    $scope.sendCall = function(number = null) {
        console.log("Sending call");

        if (number) {
            $scope.OutboundPhoneNumberHolder.value = number;
        }
        if ($scope.numberIsValid($scope.OutboundPhoneNumberHolder.value)) {
            let endpoint = connect.Endpoint.byPhoneNumber($scope.OutboundPhoneNumberHolder.value);
            $scope.connectAgent(endpoint);
        }
    };

    $scope.answerCall = function() {
        console.log("Answering call");
        $rootScope.perm_contact.accept({
            success: function(data) {
                console.log("Successfully answered call.");
                console.log(data);
            },
            failure: function(data) {
                console.log("Failed to answer the call.");
                console.log(data);
            }
        })
    };

    $scope.hangUpAgent = function() {
        if ($rootScope.perm_contact.getAttributes().give_survey !== undefined) {
            if ($rootScope.perm_contact.getAttributes().give_survey.value === "true") {
                $scope.transferToQueueAndEndCall();
            }
        }
        else {
            console.log("Ending call");
            $rootScope.perm_contact.getAgentConnection().destroy();
            $scope.connectedThirdParty = false;
        }
    };

    $scope.hangUpCustomer = function() {
        $rootScope.perm_contact.getInitialConnection().destroy({
            success: function() {
               console.log("Customer hung up by agent")
            },
            failure: function() {
                console.log("Agent failed to hang up customer.");
            }
        });
    };

    $scope.hangUpThirdParty = function() {
        var thirdParty = $rootScope.perm_contact.getSingleActiveThirdPartyConnection();
        if (!thirdParty) {
            return;
        }

        thirdParty.destroy({
            success: function() {
                console.log("Hung up third party");
                $scope.connectedThirdParty = false;
                $rootScope.$apply();
            },
            failure: function(){
                console.log("Failed to hang up third party");
            }
       });
    };

    $scope.addConnectionToContact = function(endpoint, success) {
        if (success == undefined) {
          success = function(data) {
            $scope.holdCustomerButtonActionLabel = "Resume";
            $rootScope.thirdPartyPhoneNumber = $rootScope.perm_contact.getSingleActiveThirdPartyConnection().getEndpoint().phoneNumber;
            console.log("transfer success");
          }
        }

        $rootScope.perm_contact.addConnection(endpoint, {
            success: success,
            failure: function(err, data) {
                console.log(err);
                console.log(data);
                console.log("transfer failed");
            }
        });

    };

    $scope.resumeThirdParty = function() {
        console.log("resuming thirdParty");
        var thirdParty = $rootScope.perm_contact.getThirdPartyConnections().filter(function(conn) {
            return conn.isActive();
        })[0];
        thirdParty.resume({
            success: function() {
                console.log("Resumed third party");
            },
            failure: function() {
                console.log("Failed to resume third party");
            }
        });
    };

    $scope.resumeCustomer = function() {
        console.log("Resuming customer");
        $rootScope.perm_contact.getInitialConnection().resume({
            success: function() {
                console.log("Resumed customer");
            },
            failure: function() {
                console.log("Failed to resume customer")
            }
        });
    };

    $scope.transferToQueueAndEndCall = function() {
        const definedEndpoint = {
          "agentLogin": null,
          "endpointARN": "arn:aws:connect:us-west-2:553456133668:instance/0e7f9d5a-6133-4f3d-9921-6d8bb95ee988/transfer-destination/f6893d65-205b-4df8-8237-fdee3a0f4d45",
          "endpointId": "arn:aws:connect:us-west-2:553456133668:instance/0e7f9d5a-6133-4f3d-9921-6d8bb95ee988/transfer-destination/f6893d65-205b-4df8-8237-fdee3a0f4d45",
          "name": "POC_get_to_survey_queue_quick_connect",
          "phoneNumber": null,
          "queue": null,
          "type": "queue"
        }

        var success = function(data) {
          $scope.connectedThirdParty = false;
          $rootScope.perm_contact.getAgentConnection().destroy();
        }

        $scope.addConnectionToContact(definedEndpoint, success);
        return;
        let endpointName = "POC_get_to_survey_queue_quick_connect";
        let endpoint = null;
        $rootScope.perm_agent.getEndpoints($rootScope.perm_agent.getAllQueueARNs(), {
            success: function(data){
                for (var i = 0; i < data.endpoints.length; i ++) {
                    if (data.endpoints[i].name === endpointName) {
                        console.log(data.endpoints[i].name);
                        endpoint = data.endpoints[i];
                        $scope.addConnectionToContact(endpoint);
                        $scope.connectedThirdParty = false;
                        $rootScope.perm_contact.getAgentConnection().destroy();
                    }
                }
            },
            failure:function(){
                console.log("failed to retrieve endpoints");
            }
        });
    };

    $scope.holdOrResumeCustomerCall = function() {
        if ($rootScope.perm_contact.getInitialConnection().isOnHold()) {
            $scope.resumeCustomerCall();
        }
        else {
            $scope.holdCustomerCall();
        }
    };

    $scope.allHoldOrAllResume = function() {

        if ($scope.isAllHold()) {
            console.log("Merging calls");
            $scope.mergeActiveCalls();
            $scope.holdAllButtonActionLabel = "Hold all";
        }
        else {
            console.log("holding all");
            var connectedConns = $rootScope.perm_contact.getConnections().filter(function (conn) {
                return conn.getType() !== lily.ConnectionType.AGENT &&
                    conn.getStatus().type === lily.ConnectionStatusType.CONNECTED;
            });

            // Comment from Amazon;
            /**
             * This is necessary due to the nature of Conferenced state
             * in the VoiceService.  We can't immediately put both legs
             * on hold or one of the calls will fail.  So we put one leg
             * on hold, wait ALL_HOLD_DELAY_TIMEOUT_MS milliseconds, then
             * put the other leg on hold.  This gives GACD Critical and
             * VoiceService enough time to update the conversation state
             * so that the second hold operation is valid.
             */
            var allHoldImpl = function(conns) {
                var ALL_HOLD_DELAY_TIMEOUT_MS = 500;
                if (conns.length > 0) {
                    var conn = conns.pop();
                    conn.hold({
                        success: function() {
                            window.setTimeout(allHoldImpl(conns), ALL_HOLD_DELAY_TIMEOUT_MS);
                            if (callbacks && callbacks.success) {
                                callbacks.success();
                            }
                        },
                        failure: function(data) {
                            lily.getLog().error('Failed to put %s conn on hold.', conn.getConnectionId())
                                .withData(data);
                            if (callbacks && callbacks.failure) {
                                callbacks.failure();
                            }
                        }
                    });
                }
            };

            allHoldImpl(connectedConns);
            $scope.holdAllButtonActionLabel = "Resume all"
        }
    };

    $scope.isAllHold = function() {
        var contact = $rootScope.perm_contact;
        if (contact == null) {
            return false;
        }

        var initialConn = contact.getInitialConnection();
        var thirdPartyConn = contact.getSingleActiveThirdPartyConnection();

        if (initialConn && thirdPartyConn) {
            return initialConn.isOnHold() && thirdPartyConn.isOnHold();
        } else {
            return false;
        }
    };



    $scope.handlingThirdPartContact = function() {
        if ($rootScope.perm_contact == null) {
            return false;
        }

        var initialConnection = $rootScope.perm_contact.getActiveInitialConnection();
        var thirdPartyConnection = $rootScope.perm_contact.getSingleActiveThirdPartyConnection();

        if (initialConnection && thirdPartyConnection) {
            return !initialConnection.isConnected();

        } else if (thirdPartyConnection) {
            return true;
        } else {
            return false;
        }
    };

    $scope.holdCustomerCall = function() {
        if ($rootScope.perm_contact && $scope.handlingThirdPartContact($rootScope.perm_contact)) {
            var thirdPartyConnection = $rootScope.perm_contact.getThirdPartyConnections().filter(function (connection) {
                return connection.isActive();
            })[0];

            thirdPartyConnection.hold({
                success: function () {
                    console.log("Successfully held call");
                },
                failure: function (err) {
                    console.log("Failed to hold call");
                    console.log(err);
                }
            });
        }

        else {
            $rootScope.perm_contact.getInitialConnection().hold({
                success: function() {
                    $scope.isCustomerOnHold = true;
                    $scope.holdCustomerButtonActionLabel = "Resume";
                    $scope.customerCallStatus = "On Hold";
                    $scope.$apply();
                    console.log("Successfully held call");
                }.bind($scope),
                failure: function(err) {
                    console.log("Failed to hold call");
                    console.log(err);
                }
            });
        }
    };

    $scope.threeWayHoldImpl = function(holdingCustomer, callbacks) {
        var contact = $rootScope.perm_contact;
        var initialConn = contact ? contact.getInitialConnection() : null;
        var thirdPartyConn = contact ? contact.getSingleActiveThirdPartyConnection() : null;

        if (contact !== null && initialConn && thirdPartyConn) {
            if (initialConn.isConnected() && thirdPartyConn.isConnected()) {
                if (holdingCustomer) {
                    initialConn.hold(callbacks);
                } else {
                    thirdPartyConn.hold(callbacks);
                }
            } else {
                $rootScope.perm_contact.toggleActiveConnections(callbacks);
            }
        }
    };

    $scope.resumeCustomerCall = function() {
        $rootScope.perm_contact.getInitialConnection().resume({
          success: function() {
              $scope.isCustomerOnHold = false;
              $scope.holdCustomerButtonActionLabel = "Hold";
              $scope.customerCallStatus = $rootScope.agentState;
              $scope.$apply();
              console.log("Successfully resumed call");
          }.bind($scope),
          failure: function(err) {
            console.log(err);
          }
        });
    };

    $scope.muteOrUnmuteAgent = function() {
        if ($scope.agentMuted) {
            $rootScope.perm_agent.unmute();
        }
        else {
            $rootScope.perm_agent.mute();
        }

        $scope.agentMuted = !$scope.agentMuted;
    };

    $scope.swapActiveCalls = function() {
        console.log("Swapping calls");
        if ($rootScope.perm_contact) {
            $rootScope.perm_contact.toggleActiveConnections({
                success: function() {
                    console.log("Successfully swapped calls");
                },
                failure: function(err) {
                    console.log("Failed to swap calls");
                    console.log(err);
                }
            })
        }
    };

    $scope.mergeActiveCalls = function() {
        $rootScope.perm_contact.conferenceConnections({
            success: function(data) {
                console.log("Successfully started a conference call");
                console.log(data);
                $rootScope.$apply();
            },
            failure: function(err) {
                console.log("Failed to start a conference call");
                console.log(err);
            }
        })
    };

    $scope.updateCustomerCallStatus = function() {
      $scope.customerCallStatus = $scope.isCustomerOnHold
        ? "On Hold"
        : $rootScope.agentState;
    }
});
