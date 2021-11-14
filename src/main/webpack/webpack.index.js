import './webpack.init';


//TODO: load script based on Window observer
function getScriptTag(src) {
    var newScript = document.createElement("script");
    newScript.src = src;
    return newScript;
}

function init(scriptContainer) {
    //load mxClient
    scriptContainer.appendChild(getScriptTag("./assets/mxgraph/mxClient.js"));

    scriptContainer.appendChild(getScriptTag("./assets/mxgraph/grapheditor/deflate/pako.min.js"));
    scriptContainer.appendChild(getScriptTag("./assets/mxgraph/grapheditor/deflate/base64.js"));
    scriptContainer.appendChild(getScriptTag("./assets/mxgraph/grapheditor/jscolor/jscolor.js"));
    scriptContainer.appendChild(getScriptTag("./assets/mxgraph/grapheditor/sanitizer/sanitizer.min.js"));
    //load Graph Editor
    setTimeout(() => {
        scriptContainer.appendChild(getScriptTag("./assets/mxgraph/grapheditor/EditorUi.js"))
        scriptContainer.appendChild(getScriptTag("./assets/mxgraph/grapheditor/Editor.js"))
        scriptContainer.appendChild(getScriptTag("./assets/mxgraph/grapheditor/Sidebar.js"))
        scriptContainer.appendChild(getScriptTag("./assets/mxgraph/grapheditor/Graph.js"))

    }, 100);

    setTimeout(() => {
        scriptContainer.appendChild(getScriptTag("./assets/mxgraph/grapheditor/Format.js"))
        scriptContainer.appendChild(getScriptTag("./assets/mxgraph/grapheditor/Shapes.js"))
        scriptContainer.appendChild(getScriptTag("./assets/mxgraph/grapheditor/Actions.js"))
        scriptContainer.appendChild(getScriptTag("./assets/mxgraph/grapheditor/Menus.js"))
        scriptContainer.appendChild(getScriptTag("./assets/mxgraph/grapheditor/Toolbar.js"))
        scriptContainer.appendChild(getScriptTag("./assets/mxgraph/grapheditor/Dialogs.js"))
    }, 250);
}

function grapheditor(container, scriptContainer) {
    init(scriptContainer);
    // var newScript = document.createElement("script");
    // newScript.src = "./mxgraph/mxClient.js";
    // container.appendChild(newScript);
    console.log("webpack:grapheditor", container, window);
    // const element = document.createElement('div');
    // element.innerHTML = 'Its graphedit using webpack';
    // container.appendChild(element);
    setTimeout(() => {
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
    }, 500);
}

if (typeof isWebpack !== 'undefined') {
    grapheditor(document.getElementById('mxgraph-diagram-container'), document.getElementById('mxgraph-scripts-container'));
}

export default grapheditor;