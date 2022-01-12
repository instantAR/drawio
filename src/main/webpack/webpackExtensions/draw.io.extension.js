/**
 * Add embed dialog option.
 */
EmbedDialog.showPreviewOption = false;
/**
 * @param {GraphInitConfig} [config] - Grapheditor Configuration.
 */
DrawIOExtension = function (config) {
	if (config !== undefined && config['extraActions'] !== undefined) {
		Object.keys(config['extraActions']).forEach((menuName) => {

			if (config['extraActions'][menuName]['callback'] !== undefined &&
				typeof config['extraActions'][menuName]['callback'] === 'function') {
				addMenuItem(menuName);
			} else if (typeof config['extraActions'][menuName] === 'object') {
				console.log("keys", Object.keys(config['extraActions'][menuName]));
				Object.keys(config['extraActions'][menuName]).forEach((subMenuName) => {

					if (config['extraActions'][menuName][subMenuName]['callback'] !== undefined &&
						typeof config['extraActions'][menuName][subMenuName]['callback'] === 'function') {
						addMenuItem(menuName, subMenuName);
					} else if (typeof config['extraActions'][menuName][subMenuName] === 'object') {

						Object.keys(config['extraActions'][menuName][subMenuName]).forEach((subSubMenuName) => {

							if (config['extraActions'][menuName][subMenuName][subSubMenuName]['callback'] !== undefined &&
								typeof config['extraActions'][menuName][subMenuName][subSubMenuName]['callback'] === 'function') {
								addMenuItem(menuName, subMenuName, subSubMenuName);
							}
						})
					}
				})
			}
		})
	}

	function addMenuItem(menuName, subMenuName, subSubMenuName) {

		var menusInitExt = Menus.prototype.init;
		Menus.prototype.init = function () {
			menusInitExt.apply(this, arguments);

			var editorUi = this.editorUi;
			var graph = editorUi.editor.graph;
			var isGraphEnabled = mxUtils.bind(graph, graph.isEnabled);
			let actionMenu;
			let performAction;
			let m = (subSubMenuName ? (subMenuName !== undefined ? subMenuName : menuName) : menuName);
			let mTitle = (subSubMenuName ? subSubMenuName : (subMenuName !== undefined ? subMenuName : menuName))
			if (subSubMenuName != undefined) {
				// console.log("subSubMenuName", subSubMenuName);
				actionMenu = this.get(subMenuName);
				performAction = config['extraActions'][menuName][subMenuName][subSubMenuName];
			} else {
				actionMenu = this.get(menuName);
				performAction = subMenuName !== undefined ? config['extraActions'][menuName][subMenuName] : config['extraActions'][menuName];
			}
			if (actionMenu != undefined) {
				let oldActionMenu = actionMenu.funct;
				actionMenu.funct = function (menu, parent) {
					oldActionMenu.apply(this, arguments);
					menu.addSeparator(parent);
					menu.addItem(mTitle, null, function () {
						performCustomAction(editorUi, performAction);
					}, parent);
				}

				this.put(m, actionMenu).isEnabled = isGraphEnabled;
			} else {
				// console.log("actionMenu not found", menuName, subMenuName, subSubMenuName)

				this.put(m, new Menu(mxUtils.bind(this, function (menu, parent) {
					menu.addSeparator(parent);
					menu.addItem(mTitle, null, function () {
						performCustomAction(editorUi, performAction);
					}, parent);
				}), isGraphEnabled))
			}
		}
	}

}

sendErrorResponse = function (customAction, error) {
	if (customAction['callbackOnError'] !== undefined && typeof customAction['callbackOnError'] === 'function') {
		customAction['callbackOnError'](error).then(res => {
			console.log("sendErrorResponse done");
		})
	}
}

sendSuccessResponse = function (customAction, success) {
	if (customAction['callbackOnFinish'] !== undefined && typeof customAction['callbackOnFinish'] === 'function') {
		customAction['callbackOnFinish'](success).then(res => {
			console.log("sendSuccessResponse done", res);
		})
	}
}

getGraphXmlData = function (editorUi) {
	var file = editorUi.getCurrentFile();
	var optOut = {
		xml: null,
		name: null
	}
	if (file != null) {
		optOut.name = (file.getTitle() != null) ? file.getTitle() : this.defaultFilename;
		optOut.xml = editorUi.getFileData(true);
		return optOut;
	} else {
		console.log("file not found");
		return {
			status: "export error",
			graphData: optOut
		}
	}
}

//TODO: Need to improve it...
performCustomAction = function (editorUi, customAction) {
	switch (customAction['actionType']) {
		case 'import_OptIn':
			try {
				customAction['callback']().then(resolve => {
					editorUi.importFile(resolve.graphData.xml, "text/xml", 0, 0, 240, 160, resolve.graphData.name, function () {
						console.log("done");
						sendSuccessResponse(customAction, {
							status: "import successfully",
							graphData: resolve.graphData
						});
					}, null, false, undefined, undefined);

					console.log("import_OptIn", resolve)

				}, reject => {
					console.log("import_OptIn", reject)
				}).catch(e => {
					console.log("import_OptIn", e)
				});
			} catch (e) {
				console.log(e);
				sendErrorResponse(customAction, {
					status: "something went wrong",
					graphData: null,
					reason: e
				});
			}
			break;
		case 'export_SvG_OptOut':
			try {
				let editable = true;
				let ignoreSelection = true;
				let currentPage = true;
				let transparentBackground = true;
				var svgRoot = editorUi.editor.graph.getSvg((transparentBackground ? null : "#ffffff"), 1, "0", true, null, true, null, null, null, null, true, null, "diagram");
				// if (addShadow) {
				//     this.editor.graph.addSvgShadow(svgRoot);
				// }
				if (editable) {
					svgRoot.setAttribute('content', editorUi.getFileData(true, null, null, null, ignoreSelection,
						currentPage, null, null, null, false));
				}

				let svgData = (Graph.xmlDeclaration + '\n' + ((editable) ? Graph.svgFileComment + '\n' : '') + Graph.svgDoctype + '\n' + mxUtils.getXml(svgRoot));
				let mime = 'image/svg+xml';
				let imgBase64Encode = btoa(unescape(encodeURIComponent(svgData)));
				// let src = ('data:' + mime + ';base64,' + imgBase64Encode);
				// console.log('export_SvG', svgData, src);
				var graphData = getGraphXmlData(editorUi);
				let optOut = {
					...graphData,
					status: 'Exported_SVG_AND_Image',
					svg: svgData,
					image: {
						base64Encoded: imgBase64Encode,
						mimeType: mime,
						getImageSrc: (mimeType, base64Encoded) => {
							return ('data:' + mimeType + ';base64,' + base64Encoded)
						}
					}
				}
				customAction['callback'](optOut).then(resolve => {
					console.log("export_SvG_OptOut", resolve)
				}, reject => {
					console.log("export_SvG_OptOut", reject)
				}).catch(e => {
					console.log("export_SvG_OptOut", e)
				});
			} catch (e) {
				console.log(e);
				sendErrorResponse(customAction, {
					status: "something went wrong",
					svg: null,
					image: null,
					xml: null,
					name: null,
					reason: e
				});
			}
			break;
		case 'export_OptOut':
			try {
				var optOut = getGraphXmlData(editorUi);
				if (optOut && optOut.xml && optOut.name) {
					customAction['callback'](optOut).then(resolve => {
						console.log("export_OptOut", resolve)
					}, reject => {
						console.log("export_OptOut", reject)
					}).catch(e => {
						console.log("export_OptOut", e)
					});
				} else {
					sendErrorResponse(customAction, {
						status: "export error",
						graphData: optOut
					});
				}
			} catch (e) {
				console.log(e);
				sendErrorResponse(customAction, {
					status: "something went wrong",
					graphData: null,
					reason: e
				});
			}
			break;
		case 'open_OptIn':
			try {
				customAction['callback']().then(resolve => {
					console.log("open_OptIn", resolve)
					editorUi.openLocalFile(resolve.graphData.xml, resolve.graphData.name, false);
				}, reject => {
					console.log("open_OptIn", reject)
				}).catch(e => {
					console.log("open_OptIn", e)
				});
			} catch (e) {
				console.log(e);
				sendErrorResponse(customAction, {
					status: "something went wrong",
					graphData: null,
					reason: e
				});
			}
			break;
		case 'new_OptNew':
			try {
				customAction['callback']().then(resolve => {
					console.log("new_OptNew", resolve)
				}, reject => {
					console.log("new_OptNew", reject)
				}).catch(e => {
					console.log("new_OptNew", e)
				});
			} catch (e) {
				console.log(e);
				sendErrorResponse(customAction, {
					status: "something went wrong",
					graphData: null,
					reason: e
				});
			}
			break;
		case 'custom':
		case 'default':
		default:
			try {
				customAction['callback']().then(resolve => {
					console.log("default-custom", resolve)
				}, reject => {
					console.log("default-custom", reject)
				}).catch(e => {
					console.log("default-custom", e)
				});
			} catch (e) {
				console.log(e);
				sendErrorResponse(customAction, {
					status: "something went wrong",
					graphData: enull,
					reason: e
				});
			}
	}

}

DrawIOExtension.prototype.menuList = [];
DrawIOExtension.prototype.subMenuList = [];

/**
 * Creates the keyboard event handler for the current graph and history.
 */
Menus.prototype.createMenubar = function (container) {
	var menubar = new Menubar(this.editorUi, container);
	var menus = this.defaultMenuItems;

	for (var i = 0; i < menus.length; i++) {
		(mxUtils.bind(this, function (menu) {
			DrawIOExtension.prototype.menuList.push((mxResources.get(menus[i]) || menus[i]))
			var elt = menubar.addMenu((mxResources.get(menus[i]) || menus[i]), mxUtils.bind(this, function () {
				// Allows extensions of menu.funct
				menu.funct.apply(this, arguments);
			}));

			this.menuCreated(menu, elt);
		}))(this.get(menus[i]));
	}
	return menubar;
};

/**
 * Disables the export URL function.
 */
Editor.enableExportUrl = false;
/**
 * Remove the action under the given name.
 */
Actions.prototype.removeAction = function (key) {
	// console.log("Actions:removeAction", key, this.actions[key]);
	if (this.actions[key] != undefined) {
		delete this.actions[key];
	}
};

DrawIOOverridExport = function (config, ui) {

	config.actionsButtons && Object.keys(config.actionsButtons).forEach((btnKey) => {
		let shareButton = document.createElement('div');
		shareButton.className = 'geBtn gePrimaryBtn';
		shareButton.style.display = 'inline-block';
		shareButton.style.backgroundColor = '#F2931E';
		shareButton.style.borderColor = '#F08705';
		shareButton.style.backgroundImage = 'none';
		shareButton.style.padding = '2px 10px 0 10px';
		shareButton.style.marginTop = '-10px';
		shareButton.style.height = '28px';
		shareButton.style.lineHeight = '28px';
		shareButton.style.minWidth = '0px';
		shareButton.style.cssFloat = 'right';
		config.actionsButtons[btnKey].title !== undefined && shareButton.setAttribute('title', config.actionsButtons[btnKey].title);

		mxUtils.write(shareButton, btnKey);

		config.actionsButtons[btnKey]['callback'] !== undefined && mxEvent.addListener(shareButton, 'click', mxUtils.bind(this, function () {
			// config.actionsButtons[btnKey]['callback']
			performCustomAction(ui, config.actionsButtons[btnKey])
		}));
		ui.buttonContainer.appendChild(shareButton);
	})
}

DrawIOEmptyDivCreate = function (divContainer, divName, divStyle) {
	if (divName == undefined) {
		divName = (Math.random() + 1).toString(36).substring(7);
	}
	var div = document.createElement('div');
	divStyle && (div.style = divStyle);
	div.className = divName;
	divContainer.appendChild(div);
	return div;
}

DrawIOOverridUpdateBody = function (editorUi, config) {
	/**
	 * Function: showMenu
	 * 
	 * Shows the menu.
	 */
	// mxPopupMenu.prototype.showMenu = function () {
	// 	// Disables filter-based shadow in IE9 standards mode
	// 	if (document.documentMode >= 9) {
	// 		this.div.style.filter = 'none';
	// 	}

	// 	// Fits the div inside the viewport
	// 	editorUi.container.appendChild(this.div) || document.body.appendChild(this.div);
	// 	mxUtils.fit(this.div);
	// };
}

// /**
//  * Display a color dialog.
//  */
// EditorUi.prototype.pickColor = function (color, apply) {
// 	var graph = this.editor.graph;
// 	var selState = graph.cellEditor.saveSelection();
// 	var h = 300 + ((Math.ceil(ColorDialog.prototype.presetColors.length / 12) +
// 		Math.ceil(ColorDialog.prototype.defaultColors.length / 12)) * 17);

// 	var dlg = new ColorDialog(this, color || 'none', function (color) {
// 		graph.cellEditor.restoreSelection(selState);
// 		apply(color);
// 	}, function () {
// 		graph.cellEditor.restoreSelection(selState);
// 	});
// 	this.showDialog(dlg.container, 300, h, true, false);
// 	dlg.init();
// };