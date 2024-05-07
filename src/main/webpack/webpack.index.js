import './webpack.init';

window.graphEditorRefCount = 0;
window.webpackScripts = [];
window.windowKeysBackup = [];
window.grapheditorKeysDefault = ["webpackScripts", "graphEditorRefCount", "windowKeysBackup", "grapheditorKeysDefault", "grapheditorKeys", "grapheditor", "onDestroy"];
window.grapheditorKeys = [];

window.mxScriptsLoaded = false;
window.mxWinLoaded = false;

/**
 * Synchronously adds scripts to the page.
 */
window.mxscript = (src, onLoad, id, dataAppKey, noWrite) => {
    var defer = onLoad == null && !noWrite;
    console.log('mxscript', src, onLoad, id, dataAppKey, noWrite);
    if ((urlParams['dev'] != '1' && typeof document.createElement('canvas').getContext === "function") ||
        onLoad != null || noWrite) {
        var s = document.createElement('script');
        s.setAttribute('type', 'text/javascript');
        s.setAttribute('defer', 'true');
        s.setAttribute('src', src);

        if (id != null) {
            s.setAttribute('id', id);
        }

        if (dataAppKey != null) {
            s.setAttribute('data-app-key', dataAppKey);
        }

        if (onLoad != null) {
            var r = false;

            s.onload = s.onreadystatechange = function () {
                if (!r && (!this.readyState || this.readyState == 'complete')) {
                    r = true;
                    onLoad();
                }
            };
        }

        var t = document.getElementsByTagName('script')[0];

        if (t != null) {
            t.parentNode.insertBefore(s, t);
        }
    } else {
        document.write('<script src="' + src + '"' + ((id != null) ? ' id="' + id + '" ' : '') +
            ((dataAppKey != null) ? ' data-app-key="' + dataAppKey + '" ' : '') + '></scr' + 'ipt>');
    }
}

/**
 * @callback OptOut
 * @param {GraphXmlData | GraphEditorSVG} graphData Grapheditor xml
 * @returns {Promise<GraphEditorOut | GraphEditorSVG>} Promise<GraphEditorOut | GraphEditorSVG>
 */

/**
 * @callback OptIn
 * @returns {Promise<GraphEditorIn>} Promise<GraphEditorIn>
 */

/**
 * @callback OptNew
 * @returns {Promise<GraphEditorNew>} Promise<GraphEditorNew>
 */

/**
 * Enum for Action-Type values.
 * @readonly
 * @enum {string}
 */
export var ActionType = {
    DEFAULT: 'default',
    CUSTOM: 'custom',
    IMPORT: 'import_OptIn',
    EXPORT: 'export_OptOut',
    EXPORTSVG: 'export_SvG_OptOut',
    NEW: 'new_OptNew',
    OPEN: 'open_OptIn',
};

/**
 * @param { mimeType:string } mimeType
 * @param { base64Encoded:string } base64Encoded
 */
export function getImageSrc(mimeType, base64Encoded) {
    return ('data:' + mimeType + ';base64,' + base64Encoded)
}

//  {new?: OptNew, save?: OptOut, saveAs?: OptOut, open?: OptIn, import?: OptIn, export?: OptOut}
// graphSize?: GraphSize, printSetting?: {isPrint:boolean},
/**
 * @typedef {{ width: number, height: number }} GraphSize
 * @typedef {{ fillColor?: string, strokeColor?: string, fontColor?: string }} SvgStyle
 * @typedef {{ actionType:ActionType, callback: OptOut | OptIn, callbackOnFinish?:OptOut, callbackOnError?:OptOut|any }} MenuActionType
 * @typedef {{ actionType:ActionType, callback: OptOut | OptIn, callbackOnFinish?:OptOut, callbackOnError?:OptOut|any, 
 *              title?: string, style?:CSSStyleDeclaration, className?:string }} ButtonActionType
 * @typedef {{ orgChartDev?: boolean, navitgateToUrl?:string, svgStyle?: SvgStyle,
 *      actions?: {menu?:{help?:boolean} subMenu? : {save?: OptOut, saveAs?: OptOut, open?: OptIn}}, 
 *      actionsButtons?: {[key:string]: ButtonActionType},
 *      extraActions?: {[key:string]: 
 *          { [key:string]:MenuActionType | {[key:string]: MenuActionType }}
 *      }, loadAsync?: boolean 
 * }} GraphInitConfig
 * @typedef {{ xml: string, name: string }} GraphXmlData
 * @typedef {{ status: string, reason?: any}} GraphEditorNew
 * @typedef {{ status: string, graphData: GraphXmlData, reason?: any}} GraphEditorOut
 * @typedef {{ status: string, graphData?: GraphXmlData, reason?: any}} GraphEditorIn
 * @typedef {{ status: string, graphData: GraphXmlData, document?: DOMParser|XMLDocument , reason?: any }} GraphEditorData
 * @typedef {{ status: string, graphEditorObj?: any, message?: string , reason?: any }} GraphEditorLoaded
 * @typedef {{ base64Encoded: string, mimeType: string, getImageSrc?: getImageSrc }} GraphEditorImage
 * @typedef {{ status: string svg:string, xml?: string, name?: string, image: GraphEditorImage, reason?: any }} GraphEditorSVG
 */

export class GraphEditor {

    /** @private */
    printSetupActions = {
        fitWindow: 'fitWindow',
        fitPage: 'fitPage',
        grid: 'grid'
    }

    /** @private */
    hideMenus = {
        menu: ['help', 'extra'],
        subMenu: ['new', 'open', 'editDiagram', 'save', 'saveAs', 'outline', 'layers', 'tags', 'exportPdf', 'editStyle']
    }
    /** @public */
    editorUiObj;

    /** 
     * @private 
     * @param {number} scriptGroup
     * @param {number} scriptIndex
     * @param {HTMLDivElement | HTMLElement} scriptContainer - Grapheditor scripts container.
     */
    loadScript(scriptGroup, scriptIndex, scriptContainer) {

        return new Promise((resolve, reject) => {
            //resolve if already loaded
            if (webpackScripts[scriptGroup][scriptIndex].loaded) {
                resolve({
                    script: scriptIndex,
                    loaded: true,
                    status: 'Already Loaded'
                });
            } else {
                //load script
                let script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = webpackScripts[scriptGroup][scriptIndex].src;
                script.id = webpackScripts[scriptGroup][scriptIndex].name;
                if (script.readyState) { //IE
                    script.onreadystatechange = ($event) => {
                        // console.log("onreadystatechange", $event, window);
                        if (script.readyState === "loaded" || script.readyState === "complete") {
                            script.onreadystatechange = null;
                            webpackScripts[scriptGroup][scriptIndex].loaded = true;
                            resolve({
                                script: webpackScripts[scriptGroup][scriptIndex],
                                loaded: true,
                                status: 'Loaded'
                            });
                        }
                    };
                } else { //Others
                    script.onload = ($event) => {
                        // console.log(".onload", $event, window);
                        webpackScripts[scriptGroup][scriptIndex].loaded = true;
                        resolve({
                            script: webpackScripts[scriptGroup][scriptIndex],
                            loaded: true,
                            status: 'Loaded'
                        });

                    };
                }
                script.onerror = (error) => resolve({
                    script: webpackScripts[scriptGroup][scriptIndex],
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
    addWebScript(name, src, scriptGroup, config) {
        if (name == undefined) {
            name = 'E' + src.split('/').pop().split('.').shift()
        }

        scriptGroup = this.isLoadAsync(config) == false ? undefined : scriptGroup;
        scriptGroup = (scriptGroup == undefined ? webpackScripts.length : scriptGroup);
        webpackScripts[scriptGroup] == undefined && (webpackScripts[scriptGroup] = [])
        webpackScripts[scriptGroup].push({
            name: name,
            loaded: false,
            src: src
        })
    }

    /** @private */
    isLoadAsync(config) {
        return config && config.loadAsync === true;
    }

    /**
     * @private
     * @param {number} scriptIndex
     * @param {HTMLDivElement | HTMLElement} scriptContainer - Grapheditor scripts container.
     * @param {GraphInitConfig} [config] - Grapheditor Configuration.
     */
    
    appendScriptAtIndex(scriptGroupIndex, scriptContainer, config) {
        return new Promise((resolve, reject) => {
            let standAloneGroup = (1000 + scriptGroupIndex);
            if (webpackScripts[standAloneGroup] != undefined && webpackScripts[standAloneGroup].length > 0) {
                let allLoadScripts = [];

                webpackScripts[standAloneGroup].forEach((script, scriptIndex) => {
                    // console.log('script', script, scriptGroupIndex, ' =>', scriptIndex);
                    allLoadScripts.push(this.loadScript(standAloneGroup, scriptIndex, scriptContainer))
                }) 
                Promise.all(allLoadScripts).then(processScripts => {
                    // console.log("all alone scripts loaded ", standAloneGroup, processScripts);
                })
            }
            if (webpackScripts[scriptGroupIndex] != undefined) {
                let allLoadScripts = [];
                webpackScripts[scriptGroupIndex].forEach((script, scriptIndex) => {
                    // console.log('script', script, scriptGroupIndex, ' =>', scriptIndex);
                    allLoadScripts.push(this.loadScript(scriptGroupIndex, scriptIndex, scriptContainer))
                })
                Promise.all(allLoadScripts).then(processScripts => {
                    // console.log("all scripts", scriptGroupIndex, processScripts);
                    this.appendScriptAtIndex(++scriptGroupIndex, scriptContainer, config).then(solved => {
                        // console.log(`nested:appendScriptAtIndex ${scriptGroupIndex}`, solved);
                        solved.scriptIndex.push(scriptGroupIndex);
                        resolve(solved)
                    })
                })
            } else {
                this.postScript(config); // move this to after App.main()
                resolve({
                    scriptLoaded: true,
                    scriptIndex: [scriptGroupIndex]
                })
            }
            // webpackScripts.forEach((scripts, scriptGroupIndex) => {
            //     // console.log('scriptGroup', scripts, scriptGroupIndex);
            //     let allLoadScripts = [];
            //     scripts.forEach((script, scriptIndex) => {
            //         console.log('script', script, scriptGroupIndex, ' =>', scriptIndex);
            //         allLoadScripts.push(this.loadScript(scriptGroupIndex, scriptIndex, scriptContainer))
            //     })
            //     Promise.all(allLoadScripts).then(processScripts => {
            //         console.log("all scripts", processScripts);
            //     })
            // })
            // console.info('appendScriptAtIndex', scriptIndex);
            // if (webpackScripts[scriptGroup][scriptIndex] != undefined) {
            //     this.loadScript(scriptIndex, scriptContainer).then((scriptLoaded) => {
            //         // console.log("script loaded", scriptLoaded);
            //         this.appendScriptAtIndex(++scriptIndex, scriptContainer, config).then(solved => {
            //             console.log(`nested:appendScriptAtIndex ${scriptIndex}`, solved);
            //             solved.scriptIndex.push(scriptIndex);
            //             resolve(solved)
            //         })
            //     })
            // } else {
            //     this.postScript(config); // move this to after App.main()
            //     resolve({
            //         scriptLoaded: true,
            //         scriptIndex: [scriptIndex]
            //     })
            // }
        })
    }

 
    /**
     * @private
     * @param {HTMLDivElement | HTMLElement} scriptContainer - Grapheditor scripts container.
     * @param {GraphInitConfig} [config] - Grapheditor Configuration.
     */
    init(scriptContainer, config) {

        graphEditorRefCount++;

        this.addWebScript('aes.min', './mxgraph/grapheditor/cryptojs/aes.min.js', 1, config);
        this.addWebScript('spin.min', './mxgraph/grapheditor/spin/spin.min.js', 1, config);
        this.addWebScript('pako', './mxgraph/grapheditor/deflate/pako.min.js', 1, config);
        this.addWebScript('base64', './mxgraph/grapheditor/deflate/base64.js', 1, config);
        this.addWebScript('jscolor', './mxgraph/grapheditor/jscolor/jscolor.js', 1, config);
        // this.addWebScript('html_sanitize', './mxgraph/grapheditor/sanitizer/sanitizer.min.js', 1, config);
        // this.addWebScript('croppie.min', './mxgraph/grapheditor/croppie/croppie.min.js', 1, config);
        this.addWebScript('rough.min', './mxgraph/grapheditor/rough/rough.min.js', 1, config);


        this.addWebScript('PreConfig', './mxgraph/grapheditor/PreConfig.js', 2, config);

        // mxscript(drawDevUrl + './mxgraph/grapheditor/diagramly/Init.js');
        // this.addWebScript('diagramly_init', './mxgraph/grapheditor/diagramly/Init.js')

        // mxscript(geBasePath + '/Init.js');
        // this.addWebScript('mxClient', './mxgraph/')

        //Uses grapheditor from devhost
        this.addWebScript('mxClient', './mxgraph/mxClient.js', 3, config);
        this.addWebScript('Editor', './mxgraph/grapheditor/grapheditor/Editor.js', 4, config);
        this.addWebScript('EditorUi', './mxgraph/grapheditor/grapheditor/EditorUi.js', 5, config);
        this.addWebScript('Sidebar', './mxgraph/grapheditor/grapheditor/Sidebar.js', 4, config);
        this.addWebScript('Graph', './mxgraph/grapheditor/grapheditor/Graph.js', 5, config);
        this.addWebScript('Format', './mxgraph/grapheditor/grapheditor/Format.js', 6, config);
        this.addWebScript('Shapes', './mxgraph/grapheditor/grapheditor/Shapes.js', 5, config);
        this.addWebScript('Actions', './mxgraph/grapheditor/grapheditor/Actions.js', 4, config);
        this.addWebScript('Menus', './mxgraph/grapheditor/grapheditor/Menus.js', 6, config);
        this.addWebScript('Toolbar', './mxgraph/grapheditor/grapheditor/Toolbar.js', 4, config);
        this.addWebScript('Dialogs', './mxgraph/grapheditor/grapheditor/Dialogs.js', 4, config);

        // Loads main classes
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar.js', 7, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-ActiveDirectory.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Advanced.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-AlliedTelesis.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Android.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-ArchiMate.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-ArchiMate3.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Arrows2.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Atlassian.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-AWS.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-AWS3.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-AWS3D.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-AWS4.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-AWS4b.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Azure.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Azure2.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Basic.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Bootstrap.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-BPMN.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-C4.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Cabinet.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Cisco.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Cisco19.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-CiscoSafe.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Citrix.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Cumulus.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-DFD.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-EIP.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Electrical.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-ER.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Floorplan.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Flowchart.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-FluidPower.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-GCP.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-GCP2.js', 1007, config);
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-GCP3.js', 1007,config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-GCPIcons.js', 1007,config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Gmdl.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-IBM.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Infographic.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Ios.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Ios7.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Kubernetes.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-LeanMapping.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Mockup.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-MSCAE.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Network.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Office.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-PID.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Rack.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Signs.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Sitemap.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Sysml.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-ThreatModeling.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-UML25.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Veeam.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-Veeam2.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-VVD.js', 1007, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/sidebar/Sidebar-WebIcons.js', 1007, config);

        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/util/mxJsCanvas.js', 8, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/util/mxAsyncCanvas.js', 8, config);

        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/DrawioFile.js', 8, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/LocalFile.js', 9, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/LocalLibrary.js', 10, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/StorageFile.js', 10, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/StorageLibrary.js', 11, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/RemoteFile.js', 10, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/RemoteLibrary.js', 10, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/EmbedFile.js', 10, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/Dialogs.js', 8, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/Editor.js', 8, config);
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/EditorUi.js')
        this.addWebScript(undefined, './mxgraph/webpackExtensions/draw.io.EditorUi.js', 9, config);

        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/DiffSync.js', 7, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/Settings.js', 7, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/DrawioFileSync.js', 7, config);

        // //Comments
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/DrawioComment.js', 7, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/DriveComment.js', 8, config);

        // // Excluded in base.min.js
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/DrawioClient.js', 7, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/DrawioUser.js', 7, config);
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/UrlLibrary.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/DriveFile.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/DriveLibrary.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/DriveClient.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/DropboxFile.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/DropboxLibrary.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/DropboxClient.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/GitHubFile.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/GitHubLibrary.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/GitHubClient.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/OneDriveFile.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/OneDriveLibrary.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/OneDriveClient.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/onedrive/mxODPicker.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/TrelloFile.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/TrelloLibrary.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/TrelloClient.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/GitLabFile.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/GitLabLibrary.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/GitLabClient.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/NotionFile.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/NotionLibrary.js');
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/NotionClient.js');

        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/App.js', 12);
        this.addWebScript(undefined, './mxgraph/webpackExtensions/draw.io.app.js', 12, config);
        this.addWebScript(undefined, './mxgraph/webpackExtensions/draw.io.menu.js', 12, config);
        // this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/Menus.js', 12);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/Pages.js', 12, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/Trees.js', 12, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/Minimal.js', 12, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/DistanceGuides.js', 12, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/mxRuler.js', 12, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/mxFreehand.js', 12, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/DevTools.js', 12, config);

        // Vsdx/vssx support
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/vsdx/VsdxExport.js', 9, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/vsdx/mxVsdxCanvas2D.js', 9, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/vsdx/bmpDecoder.js', 9, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/vsdx/importer.js', 9, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/jszip/jszip.min.js', 9, config);

        // GraphMl Import
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/graphml/mxGraphMlCodec.js', 9, config);

        // P2P Collab
        this.addWebScript(undefined, './mxgraph/grapheditor/diagramly/P2PCollab.js', 9, config);

        // Org Chart Layout
        if (config.orgChartDev === true) {
            this.addWebScript(undefined, './mxgraph/grapheditor/orgchart/bridge.min.js', 9, config);
            this.addWebScript(undefined, './mxgraph/grapheditor/orgchart/bridge.collections.min.js', 1010, config);
            this.addWebScript(undefined, './mxgraph/grapheditor/orgchart/OrgChart.Layout.min.js', 1010, config);
            this.addWebScript(undefined, './mxgraph/grapheditor/orgchart/mxOrgChartLayout.js', 1010, config);
        }

        this.addWebScript(undefined, './mxgraph/grapheditor/shapes-14-6-5.min.js', 9, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/stencils.min.js', 1004, config);
        this.addWebScript(undefined, './mxgraph/grapheditor/extensions.min.js', 1011, config);

        this.addWebScript(undefined, './mxgraph/webpackExtensions/draw.io.extension.js', 12, config);


        // console.log("webpackScripts", webpackScripts)
        return this.appendScriptAtIndex(1, scriptContainer, config);
    }

    /**
     * @private
     * @param {GraphInitConfig} [config] - Grapheditor Configuration.
     */
    preScript(config) {
        // Menus.prototype.defaultMenuItems = ['file', 'edit', 'view', 'arrange', 'extras', 'help'];
        if (config['extraActions'] !== undefined) {
            Object.keys(config.extraActions).forEach(menuName => {
                if (typeof config['extraActions'][menuName] === 'object') {
                    Object.keys(config['extraActions'][menuName]).forEach((subMenuName) => {
                        if (config['extraActions'][menuName][subMenuName]['callback'] !== undefined &&
                            typeof config['extraActions'][menuName][subMenuName]['callback'] === 'function') {
                            let menuFound = Menus.prototype.defaultMenuItems.filter(item => item == menuName);
                            // console.log(menuFound);
                            if (menuFound.length < 1) {
                                Menus.prototype.defaultMenuItems.push(menuName);
                            }
                        }
                    })
                }
            })
        }
    }

    activateSideBar(editorUi) {
        try {
            var activateSiderBarAfterLoad = ['general', 'basic', 'uml', 'er', 'arrows2', 'flowchart', 'misc', 'advanced']
            setTimeout(() => {
                // console.log("entries", editorUi.sidebar.entries, editorUi.sidebar.palettes)
                activateSiderBarAfterLoad.forEach((id, index) => {
                    var config = editorUi.sidebar.palettes[id]; // comment me
                    // var isChecked = config && config[0] && config[0].style.display != "none"; // comment me
                    // console.log("entry status", id, isChecked, config, config[1].children[0]); // comment me
                    config && config[0] && config[0].style.display == "none" && (config[0].style.display = "block");
                    config && config[1] && config[1].style.display == "none" && (config[1].style.display = "block");
                    index == 0 && config && config[1] && config[1].children[0].style.display == "none" && (config[1].children[0].style.display = "block");
                })
            }, 15);
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * @private
     * @param {GraphInitConfig} [config] - Grapheditor Configuration.
     */
    postScript(config) {
        this.preScript(config);
        // Menus.prototype.defaultMenuItems = []; // uncomment if menu need to hide
        DrawIOExtension(config);
        document.body.className += ' geEditor';
        let self = this;
        if (config.navitgateToUrl) {
            Editor.prototype.editBlankUrl = config.navitgateToUrl;
        } else {
            Editor.prototype.editBlankUrl = '';
        }

        /**
         * Creates the keyboard event handler for the current graph and history.
         */
        let menusCreateMenubar = Menus.prototype.createMenubar;
        Menus.prototype.createMenubar = function (container) {

            self.hideMenus.menu.forEach(item => {
                if (config === undefined || (config.actions == undefined || config.actions.menu == undefined) ||
                    (config.actions.menu[item] === undefined || config.actions.menu[item] === false)) {
                    this.defaultMenuItems = this.defaultMenuItems.filter((menu) => menu.toLowerCase() != item)
                }
            })

            return menusCreateMenubar.apply(this, arguments);
        }

        /**
         * Remove actions.
         */
        let editorUiInit = EditorUi.prototype.init;
        // console.log("editorUiInit", editorUiInit.toString());
        // actions: {menu?:{help?:boolean} subMenu? : {new?: boolean, open?: boolean, import?: boolean, export?:boolean,editDiagram?:boolean}}
        EditorUi.prototype.init = function () {

            editorUiInit.apply(this, arguments);
            self.hideMenus.subMenu.forEach(item => {
                // console.log("subMenu", item, config.actions.subMenu[item],!(config.actions.subMenu[item] instanceof Function), (typeof config.actions.subMenu[item]));

                if (config === undefined || (config.actions === undefined || config.actions.subMenu === undefined) ||
                    (config.actions.subMenu[item] === undefined || !(config.actions.subMenu[item] instanceof Function))) {
                    this.actions.removeAction(item);
                }
            })
        }

        /**
         * Extends: EditorUi.prototype.openFile and open GraphXmlData content in TS-Func.
         */
        // let superOpenFile = EditorUi.prototype.openFile;
        EditorUi.prototype.openFile = function () {
            try {
                config.actions.subMenu.open().then(resolve => {
                    console.log("openFile:resolve", resolve);
                    self.setGrapheditorData(resolve.graphData);
                }, reject => {
                    console.log("openFile:reject", reject);
                    // if (reject != undefined && reject.status != undefined) {
                    //     mxUtils.alert(reject.status);
                    // }
                }).catch(e => {
                    console.log(e);
                });
            } catch (e) {}
        };

        EditorUi.prototype.performCallbackForAction = function (callbackFor) {
            console.log("getCallback", callbackFor);

        }

        /**
         * Extends: EditorUi.prototype.saveFile and save GraphXmlData content in TS-Func.
         */
        // let superSaveFile = EditorUi.prototype.saveFile;
        App.prototype.saveFile = function (forceDialog, success) {

            // superSaveFile.apply(this, arguments);
            var file = this.getCurrentFile();

            if (file != null) {
                // FIXME: Invoke for local files
                var done = mxUtils.bind(this, function () {
                    if (EditorUi.enableDrafts) {
                        file.removeDraft();
                    }

                    if (this.getCurrentFile() != file && !file.isModified()) {
                        // Workaround for possible status update while save as dialog is showing
                        // is to show no saved status for device files
                        this.editor.setStatus(mxUtils.htmlEntities(mxResources.get('allChangesSaved')));
                    }
                });

                var filename = (file.getTitle() != null) ? file.getTitle() : this.defaultFilename;
                var xmlData = this.getFileData(true);
                // console.log("saveFile", forceDialog, success, xmlData);
                try {
                    let editable = true;
                    let ignoreSelection = true;
                    let currentPage = true;
                    let transparentBackground = true;
                    var svgRoot = this.editor.graph.getSvg((transparentBackground ? null : "#ffffff"), 1, "0", true, null, true, null, null, null, null, true, null, "diagram");
                    // if (addShadow) {
                    //     this.editor.graph.addSvgShadow(svgRoot);
                    // }
                    if (editable) {
                        svgRoot.setAttribute('content', this.getFileData(true, null, null, null, ignoreSelection,
                            currentPage, null, null, null, false));
                    }

                    let svgData = (Graph.xmlDeclaration + '\n' + ((editable) ? Graph.svgFileComment + '\n' : '') + Graph.svgDoctype + '\n' + mxUtils.getXml(svgRoot));
                    let mime = 'image/svg+xml';
                    let imgBase64Encode = btoa(unescape(encodeURIComponent(svgData)));
                    config && config.actions && config.actions.subMenu && config.actions.subMenu.save && config.actions.subMenu.save({
                        xml: xmlData,
                        name: filename,
                        svg: svgData,
                        image: {
                            base64Encoded: imgBase64Encode,
                            mimeType: mime
                        }
                    }).then(resolve => {
                        // console.log("saveGraphEditor", resolve);
                        done();
                    }, reject => {
                        console.log("saveGraphEditor:reject", reject);
                    }).catch(e => {
                        console.log(e);
                    });
                } catch (e) {
                    this.editor.setStatus(mxUtils.htmlEntities(mxResources.get('errorSavingFile')));
                }

            }
            // if (this.editor.graph.isEditing()) {
            //     this.editor.graph.stopEditing();
            // }



        };
    }

    /**
     * @param {GraphXmlData} graphData - Grapheditor xml.
     * @returns {Promise<GraphEditorData>} Promise<GraphEditorData>
     */
    setGrapheditorData(graphData) {
        return new Promise((resolve, reject) => {
            try {
                // console.log('typeof', this.editorUiObj);
                this.editorUiObj.openLocalFile(graphData.xml, graphData.name, false);

                resolve({
                    status: "Loaded",
                    graphData: graphData
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
     * @private
     * @returns {{menu: menuList,subMenu: subMenuList}} Menu & SubMenu List
     */
    getMenuList() {
        // console.log("menuList", DrawIOExtension.prototype.menuList.sort(), DrawIOExtension.prototype.subMenuList.sort());
        let dE = new DrawIOExtension();
        return {
            menu: [...dE.menuList],
            subMenu: [...dE.subMenuList]
        }
    }

    convertToMermaid(container, scriptContainer, config, mermaidString) {
        return new Promise((resolve, reject) => {
            // App.main((ui) => {
                try {
                    const result = DrawIOMakeMermaid(this.editorUiObj, config, mermaidString);
                    resolve(result); // Resolve with the result if successful
                } catch (error) {
                    reject(error); // Reject with the error if it fails
                }
            // }, null, container);
        });
    }

    /**
     * @param {HTMLDivElement | HTMLElement} container - Grapheditor container.
     * @param {HTMLDivElement | HTMLElement} scriptContainer - Grapheditor scripts container.
     * @param {GraphInitConfig} [config] - Grapheditor Configuration.
     * @returns {Promise<GraphEditorLoaded>} Promise<GraphEditorLoaded>
     */
    initialized(container, scriptContainer, config) {

        return new Promise((resolve, reject) => {
            // console.log('initialized', config);
            this.init(scriptContainer, config).then(res => {
                this.pouplateScriptVars();
                // console.log('script init', res, grapheditorKeys);
                App.main((ui) => {
                    this.editorUiObj = ui;
                    DrawIOOverridUpdateBody(ui, config);
                    DrawIOOverridExport(config, ui);
                    window.addEventListener('message', function (event) {
                        if (event.data && typeof event.data === 'string') {
                            if(event.data === 'DrawIO loaded') return;
                            if(event.data === 'Mermaid Creation Failed') return;
                            if(event.data === 'Mermiad successfully created') return;
                            const mainObj = JSON.parse(event.data);
                            if (mainObj.isMermaid) {
                                try {
                                    const mermiadData = mainObj.data;
                                    DrawIOMakeMermaid(ui, config, mermiadData);
                                }
                                catch (err) {
                                    // console.log("=========err",err);
                                }
                            } else {
                                const xmlData = mainObj.data;
                                this.editorUiObj = ui;
                                this.editorUiObj?.openLocalFile(xmlData, 'data init', false);
                            }
                        }
                    });

                    if (ui != undefined && ui.actions != undefined && ui.actions.actions != undefined) {
                        DrawIOExtension.prototype.subMenuList = [...Object.keys(ui.actions.actions)];
                    }
                    // console.log("menuList", DrawIOExtension.prototype.menuList.sort(), DrawIOExtension.prototype.subMenuList.sort());
                    this.activateSideBar(ui);
                    resolve({
                        status: 'Initialized',
                        graphEditorObj: ui,
                        config: config
                    })
                }, null, container);


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


if (typeof isWebpack !== 'undefined') {
    // grapheditor(document.getElementById('mxgraph-diagram-container'), document.getElementById('mxgraph-scripts-container'));
    // let xmlData = "<mxGraphModel dx=\"1038\" dy=\"381\" grid=\"1\" gridSize=\"10\" guides=\"1\" tooltips=\"1\" connect=\"1\" arrows=\"1\" fold=\"1\" page=\"1\" pageScale=\"1\" pageWidth=\"850\" pageHeight=\"1100\"><root><mxCell id=\"0\"/><mxCell id=\"1\" parent=\"0\"/><mxCell id=\"4\" value=\"\" style=\"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;\" edge=\"1\" parent=\"1\" source=\"2\" target=\"3\"><mxGeometry relative=\"1\" as=\"geometry\"/></mxCell><mxCell id=\"6\" style=\"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;exitX=1;exitY=0.3333333333333333;exitDx=0;exitDy=0;exitPerimeter=0;\" edge=\"1\" parent=\"1\" source=\"2\" target=\"5\"><mxGeometry relative=\"1\" as=\"geometry\"><Array as=\"points\"><mxPoint x=\"440\" y=\"210\"/><mxPoint x=\"590\" y=\"210\"/></Array></mxGeometry></mxCell><mxCell id=\"2\" value=\"Actor\" style=\"shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;\" vertex=\"1\" parent=\"1\"><mxGeometry x=\"410\" y=\"170\" width=\"30\" height=\"60\" as=\"geometry\"/></mxCell><mxCell id=\"3\" value=\"\" style=\"swimlane;startSize=0;\" vertex=\"1\" parent=\"1\"><mxGeometry x=\"120\" y=\"80\" width=\"200\" height=\"200\" as=\"geometry\"/></mxCell><mxCell id=\"5\" value=\"\" style=\"shape=tape;whiteSpace=wrap;html=1;\" vertex=\"1\" parent=\"1\"><mxGeometry x=\"530\" y=\"60\" width=\"120\" height=\"100\" as=\"geometry\"/></mxCell></root></mxGraphModel>";
    // let xmlData = '<mxfile host="app.diagrams.net" modified="2021-12-01T19:48:16.875Z" agent="5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36" etag="HP6KexOF3TBy4hIKSY8U" version="15.8.8" type="device"><diagram id="AyI7jbf7Y4loTYQYZaz9" name="Page-1">xVbBcpswEP0aju1ggWP3GttpDunUM55pk6NstiBXsIwsAvTrK2CFTKldO/FMLzb7pIXV27cPvGCRVp8Vz5MvGIH0mB9VXrD0GJvfzcxvA9QdMAsJiJWIOmjigI34BQT6hBYigsNgo0aUWuRDcIdZBjs9wLhSWA63/UA5fGrOYxgBmx2XY/S7iHRCx5r6Dn8EESf2yROfVlJuNxNwSHiE5REUrLxgoRB1d5VWC5ANd5aXLu/hxGpfmIJMX5Kw/7pms23+c7+WjwzjtT8Psg8h1aZre2CIzPkpRKUTjDHjcuXQe4VFFkFzV99Ebs8TYm7AiQH3oHVNzeSFRgMlOpW0agpW9TPlt8FLE3yc2nBZHS8ua4q6WpsCT1JA0AELtYMz57ZS4ioGfWZf0DfKCBwwBVOPyVMguRavwzo4SS3u9/WpaxSmQubTVISfSBM0FIHViL1FVxdluZ6ai6MyHNR2+oquU8GvXBZ0hJEMjFrz5jLCXZG29N6XidCwyXlLbGmmfdjVbSeLp60F6CGgNFTnGzYm2CbcDYlidu5KN4sTS15yNIdz/3RPBmxeSx27nDrd/v2Lthuw1FsMsRSGF7LUm9XNaZr+F1+phH52TmKil6MVZypNYD2l96LJdV7URmtQwvAF6vYGFVxoUOydBvWuLgejYfhmdCzM29OgC8w0F5khZzQgpUglz+A26g//9Ag2Vj/z/6J+9gb1m9C9sTs7dp89weo3</diagram></mxfile>';
    // let xmlData = '<mxfile host=\"\" modified=\"2021-12-06T19:31:46.338Z\" agent=\"5.0 (Windows)\" etag=\"pzJbhBRwLw9TT0dpwoMQ\" version=\"@DRAWIO-VERSION@\" type=\"device\" pages=\"3\"><diagram id=\"AyI7jbf7Y4loTYQYZaz9\" name=\"Page-1\">xVbBjpswEP0ajq3AkDa9bpLdPWxVpEjt7tGBKTg1DHJMgH59DdgYliZNupFWihTmeQzjN28eOP4qqx8ELdKvGAN3iBvXjr92CPECQpz258ZNj/hB0AOJYLFOssCW/QYNuhotWQyHSaJE5JIVUzDCPIdITjAqBFbTtJ/Ip08taAIzYBtRPkd/sFimPbpcuBZ/BJak5smeq1cyapI1cEhpjNUI8jeOvxKIsr/K6hXwljzDS7/v/sTqUJiAXF6yYf8tJJ93xa99yB8JJqG79PMPuhkH2ZgDQ6zOr0MUMsUEc8o3Fr0TWOYxtHd1VWRznhALBXoK3IOUjW4mLSUqKJUZ16uqYNE86/1d8NIGHxcmXNfjxXWjo/mJNQkHLEUEZ45plENFAvJMnt/ntRyMHqD5fADMQNWjEgRwKtlxqhGqpZYMecPWEJkqmbh6LIIvWhNmKIxGzC36QvUu21N1MSrDQl2nr+i6LvhIeamPMJOBUmvRXsYYlVnH912VMgnbgnZMV2rcp13d9bJ42hngZLuOICTUZwk2q5+mRBEzd5WdRc+Ql47mcOme7smEzWupI5dTJ7u/f9F2A5YGi9EsBcGFLA1mdXOaFu/iKzWTz9ZJVPQyWrGm0gbGUwYv8q7zoi4KQTDFF4g3G5R/oUGRWxvUm7rsz4bhuxItU29Pha4wl5TlipzZgFQs4zSH26g/eO0RZK5+4v5F/eQ/1K9C+8bu7dh+9/ibPw==</diagram><diagram id=\"rl1k0B-hDyAjVCUa-9g7\" name=\"Page-2\">rZPbToQwEIafhksTStF4LeDhQhODh+uGjm21UNLtCuzTW5YpB/fCbGJCwszX6ZT+/xDRrO7vLGvlo+GgoyTmfUTzKElImiTR+MR8mAhN0wkIqzgWLaBUB0AYI90rDrtNoTNGO9VuYWWaBiq3Ycxa023LPozentoyASegrJg+pe+KOznR68t44feghAwnkxhXahaKEewk46ZbIVpENLPGuCmq+wz0KF7Q5fnhxbwWw5P4fDsUeS6UJF8XU7Pbc7bMV7DQuP9tjeZ+M71HvfCubggC+mu3Y+iOr5tOKgdly6qRdX5mPJOu1j4jPsR+YB30vwz44+vJLKmfRTA1ODv4fdiFXqELOIaEYt4tppLglFwbGvxkOEhi7r2I5QPUK6SLrce11c9Bix8=</diagram><diagram id=\"qJsf2gRpfi9BWSCdwc7R\" name=\"Page-3\">rZNNb4MwDIZ/DcdKQNjGuR/rpGmHiUnVdouIS6IFglJTYL9+oThQ1sM0aRIH+4njyO9rArYpu73ltXwxAnQQh6IL2DaI4yiJ42D4QtGPhCXJCAqrBBXNIFNfQDAk2igBp0UhGqNR1UuYm6qCHBeMW2vaZdnR6OWrNS/gBmQ517f0oATKkaZ34cyfQBXSvxyFdFJyX0zgJLkw7RViu4BtrDE4RmW3AT2I53X5ODev5fs2Odh0df8M67do/7kamz3+5co0goUK/7c1mXvmuiG9aFbsvYBu7HoIBUeeobEXvdetVAhZzfPhqHWr45jEUrsscuFRdeCXYcjpGbAI3Q9ffhkqmpR2KwqmBLS9u0dd2AOZ0/t9pbydvZ4clVc+p8Q4rVcxtZ4ldAGp6NPZ7MvZ1S/Ddt8=</diagram></mxfile>';
    let xmlData = '<mxfile host=\"\" modified=\"2021-12-06T19:31:46.338Z\" agent=\"5.0 (Windows)\" etag=\"pzJbhBRwLw9TT0dpwoMQ\" version=\"@DRAWIO-VERSION@\" type=\"device\" pages=\"3\"><diagram id=\"AyI7jbf7Y4loTYQYZaz9\" name=\"Page-1\">xVbBjpswEP0ajq3AkDa9bpLdPWxVpEjt7tGBKTg1DHJMgH59DdgYliZNupFWihTmeQzjN28eOP4qqx8ELdKvGAN3iBvXjr92CPECQpz258ZNj/hB0AOJYLFOssCW/QYNuhotWQyHSaJE5JIVUzDCPIdITjAqBFbTtJ/Ip08taAIzYBtRPkd/sFimPbpcuBZ/BJak5smeq1cyapI1cEhpjNUI8jeOvxKIsr/K6hXwljzDS7/v/sTqUJiAXF6yYf8tJJ93xa99yB8JJqG79PMPuhkH2ZgDQ6zOr0MUMsUEc8o3Fr0TWOYxtHd1VWRznhALBXoK3IOUjW4mLSUqKJUZ16uqYNE86/1d8NIGHxcmXNfjxXWjo/mJNQkHLEUEZ45plENFAvJMnt/ntRyMHqD5fADMQNWjEgRwKtlxqhGqpZYMecPWEJkqmbh6LIIvWhNmKIxGzC36QvUu21N1MSrDQl2nr+i6LvhIeamPMJOBUmvRXsYYlVnH912VMgnbgnZMV2rcp13d9bJ42hngZLuOICTUZwk2q5+mRBEzd5WdRc+Ql47mcOme7smEzWupI5dTJ7u/f9F2A5YGi9EsBcGFLA1mdXOaFu/iKzWTz9ZJVPQyWrGm0gbGUwYv8q7zoi4KQTDFF4g3G5R/oUGRWxvUm7rsz4bhuxItU29Pha4wl5TlipzZgFQs4zSH26g/eO0RZK5+4v5F/eQ/1K9C+8bu7dh+9/ibPw==</diagram><diagram id=\"rl1k0B-hDyAjVCUa-9g7\" name=\"Page-2\">rZPbToQwEIafhksTStF4LeDhQhODh+uGjm21UNLtCuzTW5YpB/fCbGJCwszX6ZT+/xDRrO7vLGvlo+GgoyTmfUTzKElImiTR+MR8mAhN0wkIqzgWLaBUB0AYI90rDrtNoTNGO9VuYWWaBiq3Ycxa023LPozentoyASegrJg+pe+KOznR68t44feghAwnkxhXahaKEewk46ZbIVpENLPGuCmq+wz0KF7Q5fnhxbwWw5P4fDsUeS6UJF8XU7Pbc7bMV7DQuP9tjeZ+M71HvfCubggC+mu3Y+iOr5tOKgdly6qRdX5mPJOu1j4jPsR+YB30vwz44+vJLKmfRTA1ODv4fdiFXqELOIaEYt4tppLglFwbGvxkOEhi7r2I5QPUK6SLrce11c9Bix8=</diagram><diagram id=\"qJsf2gRpfi9BWSCdwc7R\" name=\"Page-3\">rZNNb4MwDIZ/DcdKQNjGuR/rpGmHiUnVdouIS6IFglJTYL9+oThQ1sM0aRIH+4njyO9rArYpu73ltXwxAnQQh6IL2DaI4yiJ42D4QtGPhCXJCAqrBBXNIFNfQDAk2igBp0UhGqNR1UuYm6qCHBeMW2vaZdnR6OWrNS/gBmQ517f0oATKkaZ34cyfQBXSvxyFdFJyX0zgJLkw7RViu4BtrDE4RmW3AT2I53X5ODev5fs2Odh0df8M67do/7kamz3+5co0goUK/7c1mXvmuiG9aFbsvYBu7HoIBUeeobEXvdetVAhZzfPhqHWr45jEUrsscuFRdeCXYcjpGbAI3Q9ffhkqmpR2KwqmBLS9u0dd2AOZ0/t9pbydvZ4clVc+p8Q4rVcxtZ4ldAGp6NPZ7MvZ1S/Ddt8=</diagram></mxfile>';
    let graphEditor = new GraphEditor();

    graphEditor.initialized(
            document.getElementById('mxgraph-diagram-container'),
            document.getElementById('mxgraph-scripts-container'), {
                navitgateToUrl: "https://public_url/route/path",
                orgChartDev: false,
                loadAsync: true,
                svgStyle: {
                    fillColor: "rgb(255, 255, 255)",
                    strokeColor: "rgb(0, 0, 0)"
                },
                actionsButtons: {
                    'Transform Into Logic': {
                        actionType: ActionType.EXPORT,
                        callback: (graphData) => {
                            return new Promise((resolve, reject) => {
                                resolve({
                                    status: "Draw IO graphData get Sucessfully",
                                    graphData: graphData
                                })
                            })
                        },
                        callbackOnError: (graphData) => {
                            return new Promise((resolve, reject) => {
                                resolve({
                                    status: "Draw IO graphData get Failed",
                                    graphData: graphData
                                })
                            })
                        },
                        style: {
                            backgroundColor: '#4d90fe',
                            border: '1px solid #3079ed',
                            backgroundImage: 'linear-gradient(#4d90fe 0,#4787ed 100%)',
                            height: '29px',
                            lineHeight: '27px'
                        }
                    },
                    'Save': {
                        actionType: ActionType.IMPORT,
                        callback: (graphData) => {
                            return new Promise((resolve, reject) => {
                                resolve({
                                    status: "Draw IO graphData get Sucessfully",
                                    graphData: graphData
                                })
                            })
                        },
                        callbackOnError: (graphData) => {
                            return new Promise((resolve, reject) => {
                                resolve({
                                    status: "Draw IO graphData get Failed",
                                    graphData: graphData
                                })
                            })
                        },
                        style: {
                            backgroundColor: '#4d90fe',
                            border: '1px solid #3079ed',
                            backgroundImage: 'linear-gradient(#4d90fe 0,#4787ed 100%)',
                            height: '29px',
                            lineHeight: '27px'
                        }
                    },
                },
                extraActions: {
                    file: {
                        test: {
                            actionType: ActionType.NEW,
                            callback: () => {
                                return new Promise((resolve, reject) => {
                                    resolve({
                                        status: "test Open From TS Func"
                                    })
                                })
                            }
                        },
                        test2: {
                            actionType: ActionType.OPEN,
                            callback: () => {
                                return new Promise((resolve, reject) => {
                                    resolve({
                                        status: "test2 Implementation required",
                                        graphData: {
                                            xml: xmlData,
                                            name: 'import from func'
                                        }
                                    })
                                })
                            }
                        },
                        exportAs: {
                            'Dwp Library': {
                                actionType: ActionType.EXPORT,
                                callback: (graphData) => {
                                    return new Promise((resolve, reject) => {
                                        resolve({
                                            status: "Dwp Library Implementation required",
                                            graphData: graphData
                                        })
                                    })
                                },
                                callbackOnError: (graphData) => {
                                    return new Promise((resolve, reject) => {
                                        resolve({
                                            status: "Dwp Library import error Implementation required",
                                            graphData: graphData
                                        })
                                    })
                                }
                            }
                        },
                        importFrom: {
                            'Dwp Library': {
                                actionType: ActionType.IMPORT,
                                callback: () => {
                                    return new Promise((resolve, reject) => {
                                        resolve({
                                            status: "Dwp Library import Implementation required",
                                            graphData: {
                                                xml: xmlData,
                                                name: 'import from func'
                                            }
                                        })
                                    })
                                },
                                callbackOnFinish: (graphData) => {
                                    return new Promise((resolve, reject) => {
                                        resolve({
                                            status: "Dwp Library import finish Implementation required",
                                            graphData: graphData
                                        })
                                    })
                                }
                            }
                        }
                    },
                    setting: {
                        actionType: ActionType.EXPORTSVG,
                        callback: (graphData) => {
                            return new Promise((resolve, reject) => {
                                resolve({
                                    status: "Dwp Library EXPORTSVG Implementation required",
                                    graphData: graphData
                                })
                            })
                        },
                        callbackOnError: (graphData) => {
                            return new Promise((resolve, reject) => {
                                resolve({
                                    status: "Dwp Library EXPORTSVG error Implementation required",
                                    graphData: graphData
                                })
                            })
                        }
                    },
                    ex: {
                        testSvg: {
                            actionType: ActionType.EXPORTSVG,
                            callback: (graphData) => {
                                return new Promise((resolve, reject) => {
                                    resolve({
                                        status: "Dwp Library EXPORTSVG Implementation required",
                                        graphData: graphData
                                    })
                                })
                            },
                            callbackOnError: (graphData) => {
                                return new Promise((resolve, reject) => {
                                    resolve({
                                        status: "Dwp Library EXPORTSVG error Implementation required",
                                        graphData: graphData
                                    })
                                })
                            }
                        },
                        // test2: {
                        //     actionType: ActionType.DEFAULT,
                        //     callback: () => {
                        //         return new Promise((resolve, reject) => {
                        //             resolve({
                        //                 status: "ex test2 Implementation required"
                        //             })
                        //         })
                        //     }
                        // },
                        // test: {
                        //     actionType: ActionType.CUSTOM,
                        //     callback: () => {
                        //         return new Promise((resolve, reject) => {
                        //             resolve({
                        //                 status: "ex test2 Implementation required"
                        //             })
                        //         })
                        //     }
                        // }
                    }

                },
                actions: {
                    subMenu: {
                        open: () => {
                            return new Promise((resolve, reject) => {
                                resolve({
                                    status: "Open From TS Func",
                                    graphData: {
                                        // xml: "<mxGraphModel dx=\"1038\" dy=\"411\" grid=\"1\" gridSize=\"10\" guides=\"1\" tooltips=\"1\" connect=\"1\" arrows=\"1\" fold=\"1\" page=\"1\" pageScale=\"1\" pageWidth=\"850\" pageHeight=\"1100\"><root><mxCell id=\"0\"/><mxCell id=\"1\" parent=\"0\"/><mxCell id=\"4\" value=\"\" style=\"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;\" parent=\"1\" source=\"2\" target=\"7\" edge=\"1\"><mxGeometry relative=\"1\" as=\"geometry\"><mxPoint x=\"320\" y=\"180\" as=\"targetPoint\"/></mxGeometry></mxCell><mxCell id=\"6\" style=\"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;exitX=1;exitY=0.3333333333333333;exitDx=0;exitDy=0;exitPerimeter=0;\" parent=\"1\" source=\"2\" target=\"5\" edge=\"1\"><mxGeometry relative=\"1\" as=\"geometry\"><Array as=\"points\"><mxPoint x=\"440\" y=\"210\"/><mxPoint x=\"590\" y=\"210\"/></Array></mxGeometry></mxCell><mxCell id=\"2\" value=\"Actor\" style=\"shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;\" parent=\"1\" vertex=\"1\"><mxGeometry x=\"410\" y=\"170\" width=\"30\" height=\"60\" as=\"geometry\"/></mxCell><mxCell id=\"5\" value=\"\" style=\"shape=tape;whiteSpace=wrap;html=1;\" parent=\"1\" vertex=\"1\"><mxGeometry x=\"530\" y=\"60\" width=\"120\" height=\"100\" as=\"geometry\"/></mxCell><mxCell id=\"7\" value=\"Cross-Functional Flowchart\" style=\"shape=table;childLayout=tableLayout;rowLines=0;columnLines=0;startSize=40;collapsible=0;recursiveResize=0;expand=0;pointerEvents=0;fontStyle=1;align=center;\" parent=\"1\" vertex=\"1\"><mxGeometry x=\"260\" y=\"320\" width=\"400\" height=\"400\" as=\"geometry\"/></mxCell><mxCell id=\"8\" value=\"Actor 1\" style=\"swimlane;horizontal=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;startSize=40;collapsible=0;recursiveResize=0;expand=0;pointerEvents=0;fontStyle=1\" parent=\"7\" vertex=\"1\"><mxGeometry y=\"40\" width=\"400\" height=\"120\" as=\"geometry\"/></mxCell><mxCell id=\"9\" value=\"Phase 1\" style=\"swimlane;connectable=0;startSize=40;collapsible=0;recursiveResize=0;expand=0;pointerEvents=0;\" parent=\"8\" vertex=\"1\"><mxGeometry width=\"133\" height=\"120\" as=\"geometry\"><mxRectangle width=\"133\" height=\"120\" as=\"alternateBounds\"/></mxGeometry></mxCell><mxCell id=\"10\" value=\"Phase 2\" style=\"swimlane;connectable=0;startSize=40;collapsible=0;recursiveResize=0;expand=0;pointerEvents=0;\" parent=\"8\" vertex=\"1\"><mxGeometry x=\"133\" width=\"134\" height=\"120\" as=\"geometry\"><mxRectangle width=\"134\" height=\"120\" as=\"alternateBounds\"/></mxGeometry></mxCell><mxCell id=\"11\" value=\"Phase 3\" style=\"swimlane;connectable=0;startSize=40;collapsible=0;recursiveResize=0;expand=0;pointerEvents=0;\" parent=\"8\" vertex=\"1\"><mxGeometry x=\"267\" width=\"133\" height=\"120\" as=\"geometry\"><mxRectangle width=\"133\" height=\"120\" as=\"alternateBounds\"/></mxGeometry></mxCell><mxCell id=\"12\" value=\"Actor 2\" style=\"swimlane;horizontal=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;startSize=40;collapsible=0;recursiveResize=0;expand=0;pointerEvents=0;\" parent=\"7\" vertex=\"1\"><mxGeometry y=\"160\" width=\"400\" height=\"120\" as=\"geometry\"/></mxCell><mxCell id=\"13\" value=\"\" style=\"swimlane;connectable=0;startSize=0;collapsible=0;recursiveResize=0;expand=0;pointerEvents=0;\" parent=\"12\" vertex=\"1\"><mxGeometry width=\"133\" height=\"120\" as=\"geometry\"><mxRectangle width=\"133\" height=\"120\" as=\"alternateBounds\"/></mxGeometry></mxCell><mxCell id=\"14\" value=\"\" style=\"swimlane;connectable=0;startSize=0;collapsible=0;recursiveResize=0;expand=0;pointerEvents=0;\" parent=\"12\" vertex=\"1\"><mxGeometry x=\"133\" width=\"134\" height=\"120\" as=\"geometry\"><mxRectangle width=\"134\" height=\"120\" as=\"alternateBounds\"/></mxGeometry></mxCell><mxCell id=\"15\" value=\"\" style=\"swimlane;connectable=0;startSize=0;collapsible=0;recursiveResize=0;expand=0;pointerEvents=0;\" parent=\"12\" vertex=\"1\"><mxGeometry x=\"267\" width=\"133\" height=\"120\" as=\"geometry\"><mxRectangle width=\"133\" height=\"120\" as=\"alternateBounds\"/></mxGeometry></mxCell><mxCell id=\"16\" value=\"Actor 3\" style=\"swimlane;horizontal=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;startSize=40;collapsible=0;recursiveResize=0;expand=0;pointerEvents=0;\" parent=\"7\" vertex=\"1\"><mxGeometry y=\"280\" width=\"400\" height=\"120\" as=\"geometry\"/></mxCell><mxCell id=\"17\" value=\"\" style=\"swimlane;connectable=0;startSize=0;collapsible=0;recursiveResize=0;expand=0;pointerEvents=0;\" parent=\"16\" vertex=\"1\"><mxGeometry width=\"133\" height=\"120\" as=\"geometry\"><mxRectangle width=\"133\" height=\"120\" as=\"alternateBounds\"/></mxGeometry></mxCell><mxCell id=\"18\" value=\"\" style=\"swimlane;connectable=0;startSize=0;collapsible=0;recursiveResize=0;expand=0;pointerEvents=0;\" parent=\"16\" vertex=\"1\"><mxGeometry x=\"133\" width=\"134\" height=\"120\" as=\"geometry\"><mxRectangle width=\"134\" height=\"120\" as=\"alternateBounds\"/></mxGeometry></mxCell><mxCell id=\"19\" value=\"\" style=\"swimlane;connectable=0;startSize=0;collapsible=0;recursiveResize=0;expand=0;pointerEvents=0;\" parent=\"16\" vertex=\"1\"><mxGeometry x=\"267\" width=\"133\" height=\"120\" as=\"geometry\"><mxRectangle width=\"133\" height=\"120\" as=\"alternateBounds\"/></mxGeometry></mxCell></root></mxGraphModel>"
                                        xml: xmlData
                                    }
                                })
                            })
                        },
                        save: (graphData) => {
                            return new Promise((resolve, reject) => {
                                resolve({
                                    status: "Implementation required",
                                    graphData: graphData
                                })
                            })
                        }
                    }
                }
            })
        .then(resolve => {
            // console.log("init", resolve);
            window.parent.postMessage('DrawIO loaded', "*");
            
            let menuList = graphEditor.getMenuList();
            // console.log("menuList", menuList.menu.sort(), menuList.subMenu.sort())
            // static three page diagram render code
           /*  graphEditor.setGrapheditorData({
                xml: xmlData,
                name: "data init"
            }).then(resolve => {
                console.log("setGraphEditor", resolve)
            }, reject => {
                console.log("setGraphEditor", reject)
            }).catch(e => {
                console.log("setGraphEditor", e)
            }); */
        }, reject => {
            console.log("init", reject)
        }).catch(e => {
            console.log("init", e)
        });
}