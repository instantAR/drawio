import './webpack.init';


//TODO: load script based on Window observer

window.webpackScripts = [];

function loadScript(scriptIndex, scriptContainer) {
    return new Promise((resolve, reject) => {
        //resolve if already loaded
        if (webpackScripts[scriptIndex].loaded) {
            resolve({
                script: scriptIndex,
                loaded: true,
                status: 'Already Loaded'
            });
        } else {
            //load script
            let script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = webpackScripts[scriptIndex].src;
            script.defer = true;
            script.id = webpackScripts[scriptIndex].name;
            if (script.readyState) { //IE
                script.onreadystatechange = () => {
                    if (script.readyState === "loaded" || script.readyState === "complete") {
                        script.onreadystatechange = null;
                        webpackScripts[scriptIndex].loaded = true;
                        resolve({
                            script: webpackScripts[scriptIndex],
                            loaded: true,
                            status: 'Loaded'
                        });
                    }
                };
            } else { //Others
                script.onload = () => {
                    webpackScripts[scriptIndex].loaded = true;
                    resolve({
                        script: webpackScripts[scriptIndex],
                        loaded: true,
                        status: 'Loaded'
                    });
                };
            }
            script.onerror = (error) => resolve({
                script: webpackScripts[scriptIndex],
                loaded: false,
                status: 'Loaded'
            });
            scriptContainer.appendChild(script);
        }
    });
}

function addWebScript(name, src) {
    webpackScripts.push({
        name: name,
        loaded: false,
        src: src
    })
}

function appendScriptAtIndex(scriptIndex, scriptContainer) {
    return new Promise((resolve, reject) => {
        // console.info('appendScriptAtIndex', scriptIndex);
        if (webpackScripts[scriptIndex] != undefined) {
            loadScript(scriptIndex, scriptContainer).then((scriptLoaded) => {
                // console.log("script loaded", scriptLoaded);
                appendScriptAtIndex(++scriptIndex, scriptContainer).then(solved => {
                    // console.log(`nested:appendScriptAtIndex ${scriptIndex}`, solved);
                    solved.scriptIndex.push(scriptIndex);
                    resolve(solved)
                })
            })
        } else {
            resolve({
                scriptLoaded: true,
                scriptIndex: [scriptIndex]
            })
        }
    })
}

function init(scriptContainer) {

    window.graphEditorRefCount = window.graphEditorRefCount++ || 1;

    addWebScript('mxClient', './assets/mxgraph/mxClient.js')
    addWebScript('pako', './assets/mxgraph/grapheditor/deflate/pako.min.js')
    addWebScript('base64', './assets/mxgraph/grapheditor/deflate/base64.js')
    addWebScript('jscolor', './assets/mxgraph/grapheditor/jscolor/jscolor.js')
    addWebScript('html_sanitize', './assets/mxgraph/grapheditor/sanitizer/sanitizer.min.js')
    addWebScript('EditorUi', './assets/mxgraph/grapheditor/EditorUi.js')
    addWebScript('Editor', './assets/mxgraph/grapheditor/Editor.js')
    addWebScript('Sidebar', './assets/mxgraph/grapheditor/Sidebar.js')
    addWebScript('Graph', './assets/mxgraph/grapheditor/Graph.js')
    addWebScript('Format', './assets/mxgraph/grapheditor/Format.js')
    addWebScript('Shapes', './assets/mxgraph/grapheditor/Shapes.js')
    addWebScript('Actions', './assets/mxgraph/grapheditor/Actions.js')
    addWebScript('Menus', './assets/mxgraph/grapheditor/Menus.js')
    addWebScript('Toolbar', './assets/mxgraph/grapheditor/Toolbar.js')
    addWebScript('Dialogs', './assets/mxgraph/grapheditor/Dialogs.js')


    return appendScriptAtIndex(0, scriptContainer);

}

function grapheditor(container, scriptContainer) {
    init(scriptContainer).then(resolve => {
        console.log('script init', resolve);
        // Adds required resources (disables loading of fallback properties, this can only
        // be used if we know that all keys are defined in the language specific file)
        mxResources.loadDefaultBundle = false;
        var bundle = mxResources.getDefaultBundle(RESOURCE_BASE, mxLanguage) ||
            mxResources.getSpecialBundle(RESOURCE_BASE, mxLanguage);

        // Fixes possible asynchronous requests
        mxUtils.getAll([bundle, STYLE_PATH + '/default.xml'], function (xhr) {
            // Adds bundle text to resources
            mxResources.parse(xhr[0].getText());

            // Configures the default graph theme
            var themes = new Object();
            themes[Graph.prototype.defaultThemeName] = xhr[1].getDocumentElement();

            // Main
            // new EditorUi(new Editor(urlParams['chrome'] == '0', themes), container);
            new EditorUi(new Editor(
                urlParams['chrome'] == '0' || uiTheme == 'min',
                null, null, null, urlParams['chrome'] != '0'), container);
        }, function () {

            const element = document.createElement('div');

            element.innerHTML = '<center style="margin-top:10%;">Error loading resource files. Please check browser console.</center>';

            container.appendChild(element);
        });

    });
}

if (typeof isWebpack !== 'undefined') {
    grapheditor(document.getElementById('mxgraph-diagram-container'), document.getElementById('mxgraph-scripts-container'));
}

export default grapheditor;