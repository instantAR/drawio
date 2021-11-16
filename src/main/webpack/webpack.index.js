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
            script.id = webpackScripts[scriptIndex].name;
            if (script.readyState) { //IE
                script.onreadystatechange = ($event) => {
                    // console.log("onreadystatechange", $event, window);
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
                script.onload = ($event) => {
                    // console.log(".onload", $event, window);
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
            if (scriptIndex == 0) {
                backupWindowObject();
            }
            scriptContainer.appendChild(script);
        }
    });
}

function backupWindowObject() {
    window.windowKeysBackup = Object.keys(window);
    window.grapheditorKeysDefault = ["webpackScripts", "graphEditorRefCount", "windowKeysBackup", "grapheditorKeysDefault", "grapheditorKeys", "grapheditor", "onDestroy"];
    window.grapheditorKeys = [];
}

function pouplateScriptVars() {
    let windowUpdatedKeys = Object.keys(window);
    grapheditorKeys = windowUpdatedKeys.filter(x => !windowKeysBackup.includes(x));
    grapheditorKeys = grapheditorKeys.filter(x => !grapheditorKeysDefault.includes(x));
    // console.log('pouplateScriptVars', windowKeysBackup, windowUpdatedKeys, grapheditorKeys);
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
            postScript();
            resolve({
                scriptLoaded: true,
                scriptIndex: [scriptIndex]
            })
        }
    })
}



function init(scriptContainer) {

    window.graphEditorRefCount = window.graphEditorRefCount++ || 1;

    addWebScript('mxClient', './mxgraph/mxClient.js')
    addWebScript('pako', './mxgraph/grapheditor/deflate/pako.min.js')
    addWebScript('base64', './mxgraph/grapheditor/deflate/base64.js')
    addWebScript('jscolor', './mxgraph/grapheditor/jscolor/jscolor.js')
    addWebScript('html_sanitize', './mxgraph/grapheditor/sanitizer/sanitizer.min.js')
    addWebScript('EditorUi', './mxgraph/grapheditor/EditorUi.js')
    addWebScript('Editor', './mxgraph/grapheditor/Editor.js')
    addWebScript('Sidebar', './mxgraph/grapheditor/Sidebar.js')
    addWebScript('Graph', './mxgraph/grapheditor/Graph.js')
    addWebScript('Format', './mxgraph/grapheditor/Format.js')
    addWebScript('Shapes', './mxgraph/grapheditor/Shapes.js')
    addWebScript('Actions', './mxgraph/grapheditor/Actions.js')
    addWebScript('Menus', './mxgraph/grapheditor/Menus.js')
    addWebScript('Toolbar', './mxgraph/grapheditor/Toolbar.js')
    addWebScript('Dialogs', './mxgraph/grapheditor/Dialogs.js')


    return appendScriptAtIndex(0, scriptContainer);

}

function postScript() {
    // Menus.prototype.defaultMenuItems = [];
}


function grapheditor(container, scriptContainer) {
    init(scriptContainer).then(resolve => {
        pouplateScriptVars();
        console.log('script init', resolve, grapheditorKeys);

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

//Test: html button click
window.onDestroy = function () {
    destroyGrapheditor().then(res => {
        console.log('onDestroy', res);
    })
}

//TODO: Not usable right now
function destroyGrapheditor() {
    new Promise((resolve, reject) => {
        graphEditorRefCount--;
        if (graphEditorRefCount > 0) {
            resolve({
                graphEditorRefCount: graphEditorRefCount,
                status: `Running graph-editor instances ${graphEditorRefCount}`
            })
        } else {
            try {
                grapheditorKeys.forEach(item => {
                    if (window[item] !== undefined) {
                        delete window[item]
                    }
                })
            } catch (e) {
                console.log(e);
            }
            resolve({
                graphEditorRefCount: graphEditorRefCount,
                status: `Running graph-editor instances ${graphEditorRefCount}`
            })
        }
    })
}

if (typeof isWebpack !== 'undefined') {
    grapheditor(document.getElementById('mxgraph-diagram-container'), document.getElementById('mxgraph-scripts-container'));
}

export default {
    grapheditor,
    destroyGrapheditor
};