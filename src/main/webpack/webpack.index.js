import './webpack.init';

window.graphEditorRefCount = 0;
window.webpackScripts = [];
window.windowKeysBackup = [];
window.grapheditorKeysDefault = ["webpackScripts", "graphEditorRefCount", "windowKeysBackup", "grapheditorKeysDefault", "grapheditorKeys", "grapheditor", "onDestroy"];
window.grapheditorKeys = [];


export class GraphEditor {

    #loadScript(scriptIndex, scriptContainer) {
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
                    this.#backupWindowObject();
                }
                scriptContainer.appendChild(script);
            }
        });
    }
    
    #backupWindowObject() {
        windowKeysBackup = Object.keys(window);
    }
    
    #pouplateScriptVars() {
        let windowUpdatedKeys = Object.keys(window);
        grapheditorKeys = windowUpdatedKeys.filter(x => !windowKeysBackup.includes(x));
        grapheditorKeys = grapheditorKeys.filter(x => !grapheditorKeysDefault.includes(x));
        // console.log('pouplateScriptVars', windowKeysBackup, windowUpdatedKeys, grapheditorKeys);
    }
    
    #addWebScript(name, src) {
        webpackScripts.push({
            name: name,
            loaded: false,
            src: src
        })
    }
    
    #appendScriptAtIndex(scriptIndex, scriptContainer) {
        return new Promise((resolve, reject) => {
            // console.info('appendScriptAtIndex', scriptIndex);
            if (webpackScripts[scriptIndex] != undefined) {
                this.#loadScript(scriptIndex, scriptContainer).then((scriptLoaded) => {
                    // console.log("script loaded", scriptLoaded);
                    this.#appendScriptAtIndex(++scriptIndex, scriptContainer).then(solved => {
                        // console.log(`nested:appendScriptAtIndex ${scriptIndex}`, solved);
                        solved.scriptIndex.push(scriptIndex);
                        resolve(solved)
                    })
                })
            } else {
                this.#postScript();
                resolve({
                    scriptLoaded: true,
                    scriptIndex: [scriptIndex]
                })
            }
        })
    }
    
    
    
    #init(scriptContainer) {
    
        graphEditorRefCount++;
    
        this.#addWebScript('mxClient', './mxgraph/mxClient.js')
        this.#addWebScript('pako', './mxgraph/grapheditor/deflate/pako.min.js')
        this.#addWebScript('base64', './mxgraph/grapheditor/deflate/base64.js')
        this.#addWebScript('jscolor', './mxgraph/grapheditor/jscolor/jscolor.js')
        this.#addWebScript('html_sanitize', './mxgraph/grapheditor/sanitizer/sanitizer.min.js')
        this.#addWebScript('EditorUi', './mxgraph/grapheditor/EditorUi.js')
        this.#addWebScript('Editor', './mxgraph/grapheditor/Editor.js')
        this.#addWebScript('Sidebar', './mxgraph/grapheditor/Sidebar.js')
        this.#addWebScript('Graph', './mxgraph/grapheditor/Graph.js')
        this.#addWebScript('Format', './mxgraph/grapheditor/Format.js')
        this.#addWebScript('Shapes', './mxgraph/grapheditor/Shapes.js')
        this.#addWebScript('Actions', './mxgraph/grapheditor/Actions.js')
        this.#addWebScript('Menus', './mxgraph/grapheditor/Menus.js')
        this.#addWebScript('Toolbar', './mxgraph/grapheditor/Toolbar.js')
        this.#addWebScript('Dialogs', './mxgraph/grapheditor/Dialogs.js')
    
    
        return this.#appendScriptAtIndex(0, scriptContainer);
    
    }
    
    #postScript() {
        // Menus.prototype.defaultMenuItems = []; // uncomment if menu need to hide
        let superSaveFile = EditorUi.prototype.saveFile;
        let self = this;
        /**
         * Extends: EditorUi.prototype.saveFile and save xml content in TS-Func.
         */
        EditorUi.prototype.saveFile = function (forceDialog) {
    
            // superSaveFile.apply(this, arguments);
    
            if (this.editor.graph.isEditing()) {
                this.editor.graph.stopEditing();
            }
    
            var xml = mxUtils.getXml(this.editor.getGraphXml());
            // console.log("saveFile", forceDialog, xml);
            try {
                self.saveGrapheditor(xml).then(resolve => {
                    console.log("saveGraphEditor", resolve);
                    this.editor.setStatus(mxUtils.htmlEntities(mxResources.get('saved')) + ' ' + new Date());
                    this.editor.setModified(false);
                    this.editor.setFilename('ts.xml');
                    this.updateDocumentTitle();
                }, reject => {
                    console.log("saveGraphEditor:reject", reject);
                }).catch(e => {
                    console.log(e);
                });
            } catch (e) {
                this.editor.setStatus(mxUtils.htmlEntities(mxResources.get('errorSavingFile')));
            }
    
        };
    }

    saveGrapheditor(xml) {
        return new Promise((resolve, reject) => {
            resolve({
                status: "Implementation required",
                xml: xml
            })
        })
    }

    grapheditor(container, scriptContainer) {
        this.#init(scriptContainer).then(resolve => {
            this.#pouplateScriptVars();
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

    //TODO: Not usable right now
    destroyGrapheditor() {
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

}


//Test: html button click
// window.onDestroy = function () {
//     destroyGrapheditor().then(res => {
//         console.log('onDestroy', res);
//     })
// }

if (typeof isWebpack !== 'undefined') {
    // grapheditor(document.getElementById('mxgraph-diagram-container'), document.getElementById('mxgraph-scripts-container'));
    new GraphEditor().grapheditor(document.getElementById('mxgraph-diagram-container'), document.getElementById('mxgraph-scripts-container'));
}



// export {
//     grapheditor,
//     saveGrapheditor,
//     destroyGrapheditor
// };