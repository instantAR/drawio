var enviroment = {
    'restClientService': window?.configs?.['restClientService'] || 'https://emachine.instantar.io/restclient',
    'restBackendService': window?.configs?.['restBackendService'] || 'https://emachine.instantar.io/restbackend',
    'appBuilder': window?.configs?.['appBuilder'] || 'https://dev.emachine.ai/api/api/v2.0/'
}

window.enviroment = enviroment;
