var enviroment = {
    'restClientService': window?.configs?.['restClientService'] || 'https://connect.instantar.io/restapi/',
    'restBackendService': window?.configs?.['restBackendService'] || 'https://connect.instantar.io/restapi/',
    'appBuilder': window?.configs?.['appBuilder'] || 'https://dev.emachine.ai/api/api/v2.0/'
}

window.enviroment = enviroment;
