
//**********************************************************************************************************
//* >>> CONFIG CONTROLLER >>>
//*     This file controls the content of Config Page
//**********************************************************************************************************
(function () {
    angular
        .module("PaivConfig")
        .controller("ConfigCtrl", ConfigCtrl)
        .config(function ($mdThemingProvider) {
            // Configure a dark theme with primary foreground yellow
            $mdThemingProvider.theme('docs-dark', 'default')
                .backgroundPalette('grey')
                .primaryPalette('light-green')
        });
    ConfigCtrl.$inject = ["ConfigSvc", "$scope", "$mdDialog"];

    function ConfigCtrl(ConfigSvc, $scope, $mdDialog) {
        console.log("CONFIG CTRL STARTED");

        //=====================================
        //* VARIABLE DECLARATIONS AND EXPORTS
        //=====================================
        var vm = this;

        // Exposed view model       
        vm.config = {};
        vm.configTemp = {};
        vm.addModel = addModel;
        vm.program = ''
        vm.cancel = cancel;
        vm.selectIntegrated = selectIntegrated;
        vm.selectStandalone = selectStandalone;
        vm.selectNonTwoSteps = selectNonTwoSteps;
        vm.selectTwoSteps = selectTwoSteps;
        vm.selectModel = selectModel;
        vm.paivLogin = paivLogin;
        vm.updateModel = updateModel;
        vm.configEdit = configEdit;
        vm.configSave = configSave;
        vm.configCancel = configCancel;
        vm.configDelete = configDelete;
        vm.configConfirmDelete = configConfirmDelete;
        vm.paivUser = '';
        vm.paivPwd = '';
        vm.paivUrl = '';
        vm.paivToken = '';
        vm.paivModels = [];
        vm.model = '';
        vm.modelDetails = {};
        vm.configFilter = '';
        vm.standaloneType = 'detection';
        vm.standaloneUrl = '';
        vm.standaloneGood = [];
        vm.standaloneBad = [];
        vm.standaloneTracking = [];
        vm.standaloneTwosteps = [];
        vm.integratedTwostepsGood = []
        vm.integratedTwostepsBad = []
        vm.classificationUrl = '';
        vm.twoSteps = false;


        vm.integrated = false;
        vm.standalone = false;
        vm.integratedLogin = false;
        vm.integratedWait = false;
        vm.integratedError = false;
        vm.integratedModel = false;
        vm.integratedConfig = false;
        vm.integratedWaitMsg = "";
        vm.integratedErrorMsg = "";
        vm.paivWaitClass = 'waithide';
        vm.paivErrorClass = 'waithide';


        //=====================================
        //* FUNCTIONS EXECUTED UPON CTRL LOAD
        //=====================================
        init();

        //=====================================
        //* LOCAL FUNCTIONS
        //=====================================
        function init() {
            console.log("Getting Config)")
            ConfigSvc.getConfig()
                .then(function (config) {
                    vm.config = config.data;
                    // console.log(JSON.stringify(vm.config))
                })
                .catch(function (error) {
                    console.log("ERROR: " + JSON.stringify(error))
                })
        }

        function resetDialog() {
            vm.integrated = false;
            vm.standalone = false;
            vm.integratedLogin = false;
            vm.integratedWait = false;
            vm.integratedError = false;
            vm.integratedModel = false;
            vm.integratedConfig = false;
            vm.twoSteps = false;
            vm.integratedWaitMsg = "";
            vm.integratedErrorMsg = "";
            vm.classificationUrl = "";
            vm.paivWaitClass = 'waithide';
            vm.paivErrorClass = 'waithide';

        }

        function addModel(ev) {
            console.log("ADD MODEL")
            $mdDialog.show({
                // controller: DialogController,
                controller: () => this,
                controllerAs: 'ctrl',
                templateUrl: 'config_popup.html',
                // parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: false,
                bindToController: true
            })
        }

        function cancel() {
            console.log("CANCEL: " + vm.program)
            resetDialog();
            vm.paivUser = '';
            vm.paivPwd = '';
            vm.paivUrl = '';
            vm.paivToken = '';
            vm.program = '';
            $mdDialog.cancel();
        };

        function selectIntegrated() {
            resetDialog();
            vm.program = 'integrated'
            vm.integrated = true;
            vm.integratedLogin = true;
            console.log(vm.program)
        }

        function selectStandalone() {
            resetDialog();
            vm.program = 'standalone'
            vm.standalone = true;
            console.log(vm.program)
            vm.modelDetails = {
                'display': '',
                'name': ''
            }
        }

        function selectModel(idx) {
            vm.integratedConfig = true;
            vm.modelDetails = vm.paivModels[idx]
            vm.modelDetails.categories.forEach(function (cat, idx) {
                vm.modelDetails.categories[idx]['logic_category'] = "good"
            })
            vm.modelDetails.display = ''
            console.log(vm.modelDetails)
        }

        function selectNonTwoSteps() {
            console.log("SelectNonTwoSteps");
            vm.twoSteps = false;
            vm.classificationUrl = '';

        }
        function selectTwoSteps() {
            console.log("SelectTwoSteps");
            vm.twoSteps = true;
        }


        function updateModel() {
            console.log("MODEL" + JSON.stringify(vm.modelDetails))
            var modeltype = ""
            var goodObjects = []
            var badObjects = []
            var trackingObjects = []
            var twoStepsObjects = []
            var url = ''
            var programClassification = ""

            if (vm.program == "integrated") {
                if (vm.modelDetails.usage == "cod") { modeltype = "detection" }
                else { modeltype = "classification" }
                vm.modelDetails.categories.forEach(function (cat, idx) {
                    switch (cat.logic_category) {
                        case "good":
                            goodObjects.push(cat.category_name)
                            break;
                        case "bad":
                            badObjects.push(cat.category_name)
                            break;
                        case "tracking":
                            trackingObjects.push(cat.category_name)
                            break;
                        case "twoSteps":
                            twoStepsObjects.push(cat.category_name)
                            break;
                    }                    
                })
                if (vm.twoSteps) {
                    if (vm.integratedTwostepsGood.length > 0) {
                        vm.integratedTwostepsGood.forEach(function (good, idx) {
                            goodObjects.push(good);
                        })
                    }
                    if (vm.integratedTwostepsBad.length > 0) {
                        vm.integratedTwostepsBad.forEach(function (bad, idx) {
                            badObjects.push(bad);
                        })
                    }
                    modeltype = "twoSteps"
                    programClassification = "standalone"
                }
                url = vm.paivUrl + "/api/dlapis/" + vm.modelDetails["_id"]

            } else if (vm.program == "standalone") {
                modeltype = vm.standaloneType;
                url = vm.standaloneUrl;
                goodObjects = vm.standaloneGood;
                badObjects = vm.standaloneBad;
                trackingObjects = vm.standaloneTracking;
                twoStepsObjects = vm.standaloneTwosteps;
            }


            vm.config.paivUri[vm.modelDetails.name] = {
                "active": true,
                "type": modeltype,
                "program": vm.program,
                "display": vm.modelDetails.display,
                "url": url,
                "url_classification": vm.classificationUrl,
                "program_classification": programClassification,
                "edit": false
            }

            vm.config.goodObjects[vm.modelDetails.name] = goodObjects;
            vm.config.badObjects[vm.modelDetails.name] = badObjects;
            vm.config.trackingObjects[vm.modelDetails.name] = trackingObjects;
            vm.config.twoStepsObjects[vm.modelDetails.name] = twoStepsObjects;


            console.log(vm.config)

            ConfigSvc.updateConfig(vm.config)
                .then(function () {
                    cancel();
                })
                .catch(function (err) {
                    console.log("ERROR!!" + err)
                    vm.integratedError = true;
                    vm.integratedErrorMsg = err;
                })
        }

        function configEdit(model) {
            vm.configTemp = angular.copy(vm.config);
            vm.config.paivUri[model].edit = true;
        }

        function configSave(model) {
            vm.config.paivUri[model].edit = false;
            console.log(vm.config)
            ConfigSvc.updateConfig(vm.config)
                .then(function () {
                    console.log("Config Updated");
                })
                .catch(function (err) {
                    console.log(err)
                })

        }

        function configCancel(model) {
            vm.config = angular.copy(vm.configTemp);
            vm.config.paivUri[model].edit = false;

        }

        function configDelete(model) {

        }
        function configConfirmDelete(ev, model) {
            // Appending dialog to document.body to cover sidenav in docs app
            var confirm = $mdDialog.confirm()
                .title('Are you sure you want to delete this model?')
                .textContent('This will remove the model from this list')
                .ariaLabel('Confirm Delete')
                .targetEvent(ev)
                .ok('Confirm')
                .cancel('Cancel');

            $mdDialog.show(confirm).then(function () {
                console.log("Deleting Model " + model);
                delete vm.config.paivUri[model];
                delete vm.config.goodObjects[model];
                delete vm.config.badObjects[model];
                delete vm.config.trackingObjects[model];
                console.log(vm.config);
                ConfigSvc.updateConfig(vm.config)
                    .then(function () {
                        console.log("Config Updated");
                    })
                    .catch(function (err) {
                        console.log(err)
                    })

            }, function () {
                console.log("Delete Cancelled");
            });
        };


        function paivLogin() {
            resetDialog();
            vm.integrated = true;
            vm.integratedWait = true
            vm.integratedWaitMsg = "Logging in to Visual Insights... Please Wait..."
            vm.paivWaitClass = "waitshow"
            ConfigSvc.paivLogin(vm.paivUrl, vm.paivUser, vm.paivPwd)
                .then(function (loginRes) {
                    console.log("VI LOGIN: " + JSON.stringify(loginRes.data))
                    if (loginRes.data.result == "success") {
                        vm.paivToken = loginRes.data.token
                        resetDialog();
                        vm.integrated = true;
                        vm.integratedWait = true;
                        vm.integratedWaitMsg = "Retrieving Models... Please Wait..."
                        vm.paivWaitClass = "waitshow"
                        return (ConfigSvc.paivModels(vm.paivUrl, vm.paivToken))
                    } else {
                        console.log("VI LOGIN ERROR: " + loginRes.data.fault)
                        throw (new Error(loginRes.data.fault))
                    }
                })
                .then(function (models) {
                    console.log(JSON.stringify(models.data))
                    vm.paivModels = models.data
                    resetDialog();
                    vm.integrated = true;
                    vm.integratedModel = true;
                })
                .catch(function (err) {
                    resetDialog();
                    console.log("VI LOGIN ERROR " + JSON.stringify(err));
                    vm.integrated = true;
                    vm.integratedError = true;
                    if ("statusText" in err) {
                        vm.integratedErrorMsg = "VI Connection Error " + err.statusText;
                        vm.integratedLogin = true
                    } else {
                        vm.integratedErrorMsg = err;
                        vm.integratedLogin = true
                    }

                    vm.paivErrorClass = "waitshow"
                })
        }
    }
})();
