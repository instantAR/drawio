About
-----
draw.io, this project, is a configurable diagramming/whiteboarding visualization application. draw.io is jointly owned and developed by JGraph Ltd and draw.io AG.

As well as running this project, we run a production-grade deployment of the diagramming interface at https://app.diagrams.net.
### Library Build
```shell
git clone https://github.com/bhavinmatariya/drawio.git
cd "drawio\src\main\webpack"
npm run build 

### NPM Install
```shell
npm install --save draw.io-angular-new
```
### Update Angular.json
```shell
"assets": [
  .
  .
  {
    "glob": "**/*",
    "input": "./node_modules/draw.io/dist/mxgraph",
    "output": "./mxgraph"
  }
]

"styles": [
  .
  .
  "./node_modules/draw.io/dist/mxgraph/styles/grapheditor.css"
],
```

### TS - Integration
**component.html**
```shell
<div>
    .
    .
    <div>
      <div #mxgraphScriptsContainer id="mxgraph-scripts-container"></div>
      <div #container id="mxgraph-diagram-container"></div>
    </div>
</div>
```
**component.scss**
```shell
:host ::ng-deep {
    #mxgraph-diagram-container {
      .geDialog {
        padding-left: 15px !important;
        padding-right: 15px !important;
        table {
          left : unset !important;
        }
      }
    }
  }
```
**component.ts**
```shell
import { GraphEditor, GraphEditorIn, GraphEditorOut, GraphInitConfig, GraphXmlData, ActionType, GraphEditorSVG, ButtonActionType }from 'draw.io';
...
@ViewChild('container', { static: true }) container: ElementRef<HTMLElement>;
@ViewChild('mxgraphScriptsContainer', { static: true }) mxgraphScriptsContainer: ElementRef<HTMLElement>;
graphEditor: GraphEditor = new GraphEditor();
...

ngOnInit(): void {
let xml = "<mxGraphModel dx=\"1038\" dy=\"381\" grid=\"1\" gridSize=\"10\" guides=\"1\" tooltips=\"1\" connect=\"1\" arrows=\"1\" fold=\"1\" page=\"1\" pageScale=\"1\" pageWidth=\"850\" pageHeight=\"1100\"><root></root></mxGraphModel>";

    //Div container to load Graph Editor
    this.graphEditor.initialized(this.container.nativeElement, this.mxgraphScriptsContainer.nativeElement, {
      actions: {
        subMenu: {
          save: (xml: GraphXmlData | GraphEditorSVG): Promise<GraphEditorOut> => {
            return new Promise((resolve, reject) => {
              //save data here
              resolve({
                status: "Data Saved",
                graphData: xml
              } as GraphEditorOut)
            });
          }
        }
      },
      actionsButtons: {
        'Export Library': {
          title: "Export To App Library",
          actionType: ActionType.EXPORTSVG,
          callback: this.graphEditorLibraryExportEvent,
          callbackOnError: this.graphEditorActionsErrorEvent,
          style: {
            backgroundColor: '#4d90fe',
            border: '1px solid #3079ed',
            backgroundImage: 'linear-gradient(#4d90fe 0,#4787ed 100%)',
            height: '29px',
            lineHeight: '25px'
          }
        } as ButtonActionType,
        'Import Library': {
          title: "Import From App Library",
          actionType: ActionType.OPEN,
          callback: this.graphEditorLibraryImportEvent,
          callbackOnFinish: this.graphEditorLibraryImportFinishEvent,
          style: {
            backgroundColor: '#4d90fe',
            border: '1px solid #3079ed',
            backgroundImage: 'linear-gradient(#4d90fe 0,#4787ed 100%)',
            height: '29px',
            lineHeight: '25px'
          }
        } as ButtonActionType
      },
      extraActions: {
        file: {
          exportAs: {
            'App Library': {
              actionType: ActionType.EXPORTSVG,
              callback: this.graphEditorLibraryExportEvent,
              callbackOnError: this.graphEditorActionsErrorEvent
            }
          },
          importFrom: {
            'App Library': {
              actionType: ActionType.OPEN,
              callback: this.graphEditorLibraryImportEvent,
              callbackOnFinish: this.graphEditorLibraryImportFinishEvent
            }
          }
        }
      }
    } as GraphInitConfig)
  .then(resolve => {
        console.log(resolve)
        //Fetch last saved graph data and set after initialization
        this.graphEditor.setGrapheditorData({ xml: xml } as GraphXmlData).then(resolve => {
          console.log("setGraphEditor", resolve)
        }, reject => {
          console.log("setGraphEditor", reject)
        }).catch(e => {
          console.log("setGraphEditor", e)
        });
  }, reject => {
    console.log(reject);
  })
}

graphEditorLibraryImportFinishEvent = (graphData): Promise<GraphEditorOut> => {
    return new Promise((resolve, reject) => {
      console.log('graphEditorLibraryImportFinishEvent', graphData);
      resolve({
        status: "Import App Library Implementation required",
        graphData: graphData
      })
    })
  }

  graphEditorLibraryImportEvent = (): Promise<GraphEditorIn> => {
    return new Promise((resolve, reject) => {
      this.drawioImport.showDialog((data) => {
        console.log("callback:data", data);
        resolve({
          status: (data && data.drawio_data ? "Okay" : "cancel"),
          graphData: (data && data.drawio_data ? { xml: data.drawio_data.graphXmlData.xml, name: data.legal_name } : null)
        })
      })
    })
  }

  graphEditorActionsErrorEvent = (graphData): Promise<GraphEditorOut> => {
    return new Promise((resolve, reject) => {
      console.log('graphEditorActionsErrorEvent', graphData);
      resolve({
        status: "Export App Library Implementation required",
        graphData: graphData
      })
    })
  }

  graphEditorLibraryExportEvent = (graphData: GraphEditorSVG): Promise<GraphEditorOut> => {
    return new Promise((resolve, reject) => {
      console.log("graphData", graphData);
      resolve({
        status: "TS Export App Library Implementation required",
        graphData: (graphData && graphData.xml ? { xml: graphData.xml, name: graphData.name } : null)
      })
    })
  }
```
License
-----------------

The source code authored by us in this repo is licensed under the Apache v2. The full core is open source, but the are some boundary functions that are difficult to publish in a way we can maintain them.

The JGraph provided icons and diagram templates are licensed under the [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Additional terms may also apply where the icons are originally defined by a third-party copyright holder. We have checked in all cases that the original license allows use in this project. Also see the terms for using the draw.io logo below.

Additional minified JavaScript files and Java libraries are used in this project. All of the licenses are deemed compatible with the Apache 2.0, nothing is GPL or AGPL, due dilgence is performed on all third-party code.

We make no copyright claim on the content you create with this software, regardless of the copyright of individual icons used in such content.

Scope of the Project
--------------------

draw.io is a diagramming or whiteboarding application, depending on which theme is selected. It is not an SVG editing app, the SVG export is designed only for embedding in web pages, not for further editing in other tools.

The application is designed to be used largely as-is. draw.io is not suitable as a framework for building other products from. For this try either [Tldraw](https://github.com/tldraw/tldraw) or [Excalidraw](https://github.com/excalidraw/excalidraw).

Note, in particular, we don't have support for collaborative editing in this project. If this is important, one of the projects above is likely a better choice.

If you are using a draw.io project/product and have issues or questions about the editor itself, the issue tracker and discussion in this GitHub project are likely a good place to look.

Running
-------

One way to run draw.io is to fork this project, [publish the master branch to GitHub pages](https://help.github.com/categories/github-pages-basics/) and the [pages sites](https://jgraph.github.io/drawio/src/main/webapp/index.html) will have the full editor functionality (sans the integrations).

Another way is to use [the recommended Docker project](https://github.com/jgraph/docker-drawio) or to download [draw.io Desktop](https://get.diagrams.net).

The full packaged .war of the client and servlets is built when the project is tagged and available on the [releases page](https://github.com/jgraph/draw.io/releases).

Supported Browsers
------------------

draw.io supports Chrome 70+, Firefox 70+, Safari 11+, Opera 50+, Native Android browser 7x+, the default browser in the current and previous major iOS versions (e.g. 11.2.x and 10.3.x) and Edge 79+.

This project is not open-contribution
------------------------------------------------------

draw.io is also closed to contributions. We follow a development process compliant with our SOC 2 Type II process. We do not have a mechanism where we can accept contributions from non-staff members.

We are grateful for community involvement, bug reports, & feature requests. We do
not wish to come off as anything but welcoming, however, we've
made the decision to keep this project closed to contributions for 
the long term viability of the project.
draw.io is not suitable as a framework for building other products from. For this try either [Tldraw](https://github.com/tldraw/tldraw) or [Excalidraw](https://github.com/excalidraw/excalidraw).

Logo and trademark usage
------------------------

draw.io is a registered EU trademark, #018062448

Do not use the draw.io name or any draw.io logo in a way that suggests you are JGraph, your offering or project is by JGraph, or that JGraph is endorsing you or your offering or project.

Do not use any draw.io logo as the icon or logo for your business/organization, offering, project, domain name, social media account, or website.

Do not modify the permitted draw.io logos, including changing the color, dimensions, or combining with other words or design elements.

Do not use JGraph trademarks or logos without JGraph’s prior written permission.
