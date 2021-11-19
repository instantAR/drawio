// src/main/webapp/js/grapheditor
import './webpack.init';

window.graphEditorRefCount = 0;
window.webpackScripts = [];
window.windowKeysBackup = [];
window.grapheditorKeysDefault = ["webpackScripts", "graphEditorRefCount", "windowKeysBackup", "grapheditorKeysDefault", "grapheditorKeys", "grapheditor", "onDestroy"];
window.grapheditorKeys = [];


export class GraphEditor {

    /** @private */
    static editorUiObj;

    /** @private */
    loadScript(scriptIndex, scriptContainer) {
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
                    this.backupWindowObject();
                }
                scriptContainer.appendChild(script);
            }
        });
    }

    /** @private */
    backupWindowObject() {
        windowKeysBackup = Object.keys(window);
    }

    /** @private */
    pouplateScriptVars() {
        let windowUpdatedKeys = Object.keys(window);
        grapheditorKeys = windowUpdatedKeys.filter(x => !windowKeysBackup.includes(x));
        grapheditorKeys = grapheditorKeys.filter(x => !grapheditorKeysDefault.includes(x));
        // console.log('pouplateScriptVars', windowKeysBackup, windowUpdatedKeys, grapheditorKeys);
    }

    /** @private */
    addWebScript(name, src) {
        webpackScripts.push({
            name: name,
            loaded: false,
            src: src
        })
    }


    /**
     * @private
     * @typedef {{ hide: {menu?:{help?:boolean} subMenu? : {new?: boolean, open?: boolean, import?: boolean, export?:boolean,editDiagram?:boolean}} }} GraphInitConfig
     * @param {GraphInitConfig} config - Grapheditor Configuration.
     */
    appendScriptAtIndex(scriptIndex, scriptContainer, config) {
        return new Promise((resolve, reject) => {
            // console.info('appendScriptAtIndex', scriptIndex);
            if (webpackScripts[scriptIndex] != undefined) {
                this.loadScript(scriptIndex, scriptContainer).then((scriptLoaded) => {
                    // console.log("script loaded", scriptLoaded);
                    this.appendScriptAtIndex(++scriptIndex, scriptContainer, config).then(solved => {
                        // console.log(`nested:appendScriptAtIndex ${scriptIndex}`, solved);
                        solved.scriptIndex.push(scriptIndex);
                        resolve(solved)
                    })
                })
            } else {
                this.postScript(config);
                resolve({
                    scriptLoaded: true,
                    scriptIndex: [scriptIndex]
                })
            }
        })
    }

    /**
     * @private
     * @param {GraphInitConfig} config - Grapheditor Configuration.
     */
    init(scriptContainer, config) {

        graphEditorRefCount++;

        this.addWebScript('mxClient', './mxgraph/mxClient.js')
        this.addWebScript('pako', './mxgraph/grapheditor/deflate/pako.min.js')
        this.addWebScript('base64', './mxgraph/grapheditor/deflate/base64.js')
        this.addWebScript('jscolor', './mxgraph/grapheditor/jscolor/jscolor.js')
        this.addWebScript('html_sanitize', './mxgraph/grapheditor/sanitizer/sanitizer.min.js')
        this.addWebScript('EditorUi', './mxgraph/grapheditor/EditorUi.js')
        this.addWebScript('Editor', './mxgraph/grapheditor/Editor.js')
        this.addWebScript('Sidebar', './mxgraph/grapheditor/Sidebar.js')
        this.addWebScript('Graph', './mxgraph/grapheditor/Graph.js')
        this.addWebScript('Format', './mxgraph/grapheditor/Format.js')
        this.addWebScript('Shapes', './mxgraph/grapheditor/Shapes.js')
        this.addWebScript('Actions', './mxgraph/grapheditor/Actions.js')
        this.addWebScript('Menus', './mxgraph/grapheditor/Menus.js')
        this.addWebScript('Toolbar', './mxgraph/grapheditor/Toolbar.js')
        this.addWebScript('Dialogs', './mxgraph/grapheditor/Dialogs.js')


        return this.appendScriptAtIndex(0, scriptContainer, config);

    }

    /**
     * @private
     * @param {GraphInitConfig} config - Grapheditor Configuration.
     */
    postScript(config) {
        // Menus.prototype.defaultMenuItems = []; // uncomment if menu need to hide


        let self = this;


        /**
         * Creates the keyboard event handler for the current graph and history.
         */
        let menusCreateMenubar = Menus.prototype.createMenubar;
        Menus.prototype.createMenubar = function (container) {
            if (config.hide.menu != undefined) {
                if (config.hide.menu.help) {
                    this.defaultMenuItems = this.defaultMenuItems.filter((menu) => menu.toLowerCase() != 'help')
                }
            }

            return menusCreateMenubar.apply(this, arguments);
        }

        /**
         * Remove the action under the given name.
         */
        Actions.prototype.removeAction = function (key) {
            if (this.actions[key] != undefined) {
                delete this.actions[key];
            }
        };

        /**
         * Remove actions.
         */
        let editorUiInit = EditorUi.prototype.init;
        EditorUi.prototype.init = function () {
            if (config.hide.subMenu != undefined) {
                if (config.hide.subMenu.open) {
                    this.actions.removeAction('open');
                }
                if (config.hide.subMenu.new) {
                    this.actions.removeAction('new'); //TODO: func expose 
                }
                if (config.hide.subMenu.import) {
                    this.actions.removeAction('import'); //TODO: func expose 
                }
                if (config.hide.subMenu.export) {
                    this.actions.removeAction('export'); //TODO: func expose 
                }
                if (config.hide.subMenu.editDiagram) {
                    this.actions.removeAction('editDiagram'); //TODO: func expose 
                }
            }
            editorUiInit.apply(this, arguments);
        }
        /**
         * Extends: EditorUi.prototype.openFile and open xml content in TS-Func.
         */
        // let superOpenFile = EditorUi.prototype.openFile;
        EditorUi.prototype.openFile = function () {
            try {
                self.openGraphEditorList().then(resolve => {
                    console.log("openFile:resolve", resolve);
                }, reject => {
                    console.log("openFile:reject", reject);
                    if (reject != undefined && reject.status != undefined) {
                        mxUtils.alert(reject.status);
                    }
                }).catch(e => {
                    console.log(e);
                });
            } catch (e) {}
        };
        /**
         * Extends: EditorUi.prototype.saveFile and save xml content in TS-Func.
         */
        // let superSaveFile = EditorUi.prototype.saveFile;
        EditorUi.prototype.saveFile = function (forceDialog) {

            // superSaveFile.apply(this, arguments);

            if (this.editor.graph.isEditing()) {
                this.editor.graph.stopEditing();
            }

            var xml = mxUtils.getXml(this.editor.getGraphXml());
            // console.log("saveFile", forceDialog, xml);
            try {
                self.saveGrapheditor({
                    xml: xml
                }).then(resolve => {
                    console.log("saveGraphEditor", resolve);
                    this.editor.setStatus(mxUtils.htmlEntities(mxResources.get('saved')) + ' ' + new Date());
                    this.editor.setModified(false);
                    this.editor.setFilename('ts.xml');
                    this.updateDocumentTitle();
                }, reject => {
                    console.log("saveGraphEditor:reject", reject);
                    if (reject != undefined && reject.status != undefined) {
                        mxUtils.alert(reject.status);
                    }
                }).catch(e => {
                    console.log(e);
                });
            } catch (e) {
                this.editor.setStatus(mxUtils.htmlEntities(mxResources.get('errorSavingFile')));
            }

        };
    }


    /**
     * @typedef {{ xml: string }} xml
     * @typedef {{ status?: string, graphData: xml}} GraphEditorSave
     * @param {xml} graphData - Grapheditor xml.
     * @returns {Promise<GraphEditorSave>} Promise<GraphEditorSave>
     */
    saveGrapheditor(graphData) {
        return new Promise((resolve, reject) => {
            reject({
                status: "Implementation required",
                graphData: graphData
            })
        })
    }

    /**
     * @typedef {{ status: string, graphData?: xml}} GraphEditorOpen
     * @returns {Promise<GraphEditorOpen>} Promise<GraphEditorOpen>
     */
    openGraphEditorList() {
        return new Promise((resolve, reject) => {
            reject({
                status: "Implementation required",
            })
        })
    }


    /**
     * @typedef {{ status: string, graphData: xml, document?: DOMParser|XMLDocument , reason?: any }} GraphEditorData
     * @param {xml} graphData - Grapheditor xml.
     * @returns {Promise<GraphEditorData>} Promise<GraphEditorData>
     */
    setGrapheditorData(graphData) {
        return new Promise((resolve, reject) => {
            try {

                let doc = mxUtils.parseXml(graphData.xml);
                // console.log("setGraphData", graphData, doc);
                this.editorUiObj.editor.setGraphXml(doc.documentElement);
                this.editorUiObj.editor.setModified(false);
                this.editorUiObj.editor.undoManager.clear();
                resolve({
                    status: "Loaded",
                    graphData: graphData,
                    document: doc
                })
            } catch (e) {
                reject({
                    status: "Failed",
                    reason: e,
                    graphData: graphData
                })
            }
        })
    }

    /**
     * @typedef {{ status: string, graphEditorObj?: any, message?: string , reason?: any }} GraphEditorLoaded
     * @param {HTMLDivElement | HTMLElement} container - Grapheditor container.
     * @param {HTMLDivElement | HTMLElement} scriptContainer - Grapheditor scripts container.
     * @param {GraphInitConfig} config - Grapheditor Configuration.
     * @returns {Promise<GraphEditorLoaded>} Promise<GraphEditorLoaded>
     */
    initialized(container, scriptContainer, config) {
        return new Promise((resolve, reject) => {


            this.init(scriptContainer, config).then(res => {
                this.pouplateScriptVars();
                // console.log('script init', res, grapheditorKeys);
                let self = this;

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
                    self.editorUiObj = new EditorUi(new Editor(
                        urlParams['chrome'] == '0' || uiTheme == 'min',
                        null, null, null, urlParams['chrome'] != '0'), container);
                    resolve({
                        status: 'Initialized',
                        graphEditorObj: self.editorUiObj
                    })
                }, function () {

                    const element = document.createElement('div');

                    element.innerHTML = '<center style="margin-top:10%;">Error loading resource files. Please check browser console.</center>';

                    container.appendChild(element);
                    reject({
                        status: 'Failed',
                        message: 'Error loading resource files. Please check browser console.'
                    });
                });

            }, rej => {
                console.log("grapheditor-init:reject", rej);
                reject({
                    status: 'Failed',
                    reason: rej,
                });
                reject(rej);
            }).catch(e => {
                console.log(e);
                reject({
                    status: 'Failed',
                    reason: e,
                });
            });
        })
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
    let xml = "<mxGraphModel dx=\"1038\" dy=\"381\" grid=\"1\" gridSize=\"10\" guides=\"1\" tooltips=\"1\" connect=\"1\" arrows=\"1\" fold=\"1\" page=\"1\" pageScale=\"1\" pageWidth=\"850\" pageHeight=\"1100\"><root><mxCell id=\"0\"/><mxCell id=\"1\" parent=\"0\"/><mxCell id=\"4\" value=\"\" style=\"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;\" edge=\"1\" parent=\"1\" source=\"2\" target=\"3\"><mxGeometry relative=\"1\" as=\"geometry\"/></mxCell><mxCell id=\"6\" style=\"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;exitX=1;exitY=0.3333333333333333;exitDx=0;exitDy=0;exitPerimeter=0;\" edge=\"1\" parent=\"1\" source=\"2\" target=\"5\"><mxGeometry relative=\"1\" as=\"geometry\"><Array as=\"points\"><mxPoint x=\"440\" y=\"210\"/><mxPoint x=\"590\" y=\"210\"/></Array></mxGeometry></mxCell><mxCell id=\"2\" value=\"Actor\" style=\"shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;\" vertex=\"1\" parent=\"1\"><mxGeometry x=\"410\" y=\"170\" width=\"30\" height=\"60\" as=\"geometry\"/></mxCell><mxCell id=\"3\" value=\"\" style=\"swimlane;startSize=0;\" vertex=\"1\" parent=\"1\"><mxGeometry x=\"120\" y=\"80\" width=\"200\" height=\"200\" as=\"geometry\"/></mxCell><mxCell id=\"5\" value=\"\" style=\"shape=tape;whiteSpace=wrap;html=1;\" vertex=\"1\" parent=\"1\"><mxGeometry x=\"530\" y=\"60\" width=\"120\" height=\"100\" as=\"geometry\"/></mxCell></root></mxGraphModel>";
    let graphEditor = new GraphEditor();
    graphEditor.initialized(
            document.getElementById('mxgraph-diagram-container'),
            document.getElementById('mxgraph-scripts-container'), {
                hide: {
                    menu: {
                        help: true
                    },
                    subMenu: {
                        import: true,
                        export: true,
                        new: true,
                        editDiagram: true
                    }
                }
            })
        .then(resolve => {
            // console.log("init", resolve)
        }, reject => {
            console.log("init", reject)
        }).catch(e => {
            console.log("init", e)
        });
    setTimeout(() => {
        graphEditor.setGrapheditorData({
            xml: xml
        }).then(resolve => {
            // console.log("setGraphEditor", resolve)
        }, reject => {
            console.log("setGraphEditor", reject)
        }).catch(e => {
            console.log("setGraphEditor", e)
        });
    }, 1000);
}



// export {
//     grapheditor,
//     saveGrapheditor,
//     destroyGrapheditor
// };