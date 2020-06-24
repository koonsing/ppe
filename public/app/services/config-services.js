// Always use an IIFE, i.e., (function() {})();
(function () {
    // Attaches DeptService service to the SVCDASHB module
    angular
        .module("PaivConfig")
        .service("ConfigSvc", ConfigSvc);
    ConfigSvc.$inject = ['$http'];

    // ********** REGISTER SERVICE
    function ConfigSvc($http) {

        var service = this;
        service.getConfig = getConfig;
        service.paivLogin = paivLogin;
        service.paivModels = paivModels;
        service.updateConfig=  updateConfig;
        
        // Function declaration and definition -------------------------------------------------------------------------
        function getConfig() {
            console.log("SERVICE => Get config")
            return $http({
                method: 'GET'
                , url: '/api/config',                
            });
        };

        function updateConfig(config){
            console.log("SERVICE => Update config" + JSON.stringify(config))
            return $http({
                method: 'POST'
                , url: '/api/config'
                , data : config
                , headers : {
                    'Content-Type': 'application/json'
                }
            })
        }

        function paivLogin(paivUrl, paivUser, paivPwd){
            console.log("SERVICE => VI Login")
            return $http({
                method: 'POST'
                // , url: 'https://9.178.216.58/powerai-vision/api/tokens'
                , url: paivUrl + '/api/tokens'
                , data : {
                    "grant_type": "password",
                    "username": paivUser,
                    "password": paivPwd
                }
            })
        }

        function paivModels(paivUrl, paivToken){
            console.log("SERVICE => VI Models Query " + paivToken)
            return $http({
                method: 'GET'
                // , url: 'https://9.178.216.58/powerai-vision/api/webapis'
                , url: paivUrl + '/api/webapis'
                , headers : {
                    "X-Auth-Token": paivToken,                    
                }
            })
        }
    };
})();