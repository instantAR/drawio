export const enviroment = {
    'restBackendService': window?.configs?.['restBackendService'] || 'https://connect.instantar.io/restapi/',
    'appBuilder': window?.configs?.['appBuilder'] || 'https://dev24.api.instantar.io/api/v2.0/'
}

console.log("enviroment appBuilder",enviroment.appBuilder);
console.log("window?.configs?.['appBuilder'] :",window?.configs?.['appBuilder']);
