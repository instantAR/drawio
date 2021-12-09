/**
 * @param {GraphInitConfig} [config] - Grapheditor Configuration.
 */
//extraActions: [key:string]: { [key:string] : OptOut | OptIn}
DrawIOExtension = function (config) {
	if (config !== undefined && config['extraActions'] !== undefined) {
		Object.keys(config['extraActions']).forEach((menuName) => {
			// console.log('extraActions', menuName, (typeof config['extraActions'][menuName]));
			if (typeof config['extraActions'][menuName] === 'object') {
				// console.log('extraActions:valid', menuName);
				Object.keys(config['extraActions'][menuName]).forEach((subMenuName) => {
					// console.log('extraActions', menuName, subMenuName, (typeof config['extraActions'][menuName][subMenuName]));
					if (typeof config['extraActions'][menuName][subMenuName] === 'function') {
						// console.log('extraActions:valid', menuName, subMenuName);
						addMenuItem(menuName, subMenuName);
					} else if (typeof config['extraActions'][menuName][subMenuName] === 'object') {
						Object.keys(config['extraActions'][menuName][subMenuName]).forEach((subSubMenuName) => {
							if (typeof config['extraActions'][menuName][subMenuName][subSubMenuName] === 'function') {
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
			if (subSubMenuName != undefined) {
				// console.log("subSubMenuName", subSubMenuName);
				actionMenu = this.get(subMenuName);
				performAction = config['extraActions'][menuName][subMenuName][subSubMenuName];
			} else {
				actionMenu = this.get(menuName);
				performAction = config['extraActions'][menuName][subMenuName];
			}
			if (actionMenu != undefined) {
				let oldActionMenu = actionMenu.funct;
				actionMenu.funct = function (menu, parent) {
					oldActionMenu.apply(this, arguments);
					menu.addSeparator(parent);
					menu.addItem((subSubMenuName ? subSubMenuName : subMenuName), null, function () {
						performAction().then(resolve => {
							console.log("extraActions", resolve)
						}, reject => {
							console.log("extraActions", reject)
						}).catch(e => {
							console.log("extraActions", e)
						});
					}, parent);
				}

				this.put((subSubMenuName ? subMenuName : menuName), actionMenu).isEnabled = isGraphEnabled;
			} else {
				// console.log("actionMenu not found")

				this.put((subSubMenuName ? subMenuName : menuName), new Menu(mxUtils.bind(this, function (menu, parent) {
					menu.addSeparator(parent);
					menu.addItem((subSubMenuName ? subSubMenuName : subMenuName), null, function () {
						performAction().then(resolve => {
							console.log("extraActions", resolve)
						}, reject => {
							console.log("extraActions", reject)
						}).catch(e => {
							console.log("extraActions", e)
						});
					}, parent);
				}), isGraphEnabled))
			}

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

/**
 * Display a color dialog.
 */
EditorUi.prototype.pickColor = function (color, apply) {
	var graph = this.editor.graph;
	var selState = graph.cellEditor.saveSelection();
	var h = 300 + ((Math.ceil(ColorDialog.prototype.presetColors.length / 12) +
		Math.ceil(ColorDialog.prototype.defaultColors.length / 12)) * 17);

	var dlg = new ColorDialog(this, color || 'none', function (color) {
		graph.cellEditor.restoreSelection(selState);
		apply(color);
	}, function () {
		graph.cellEditor.restoreSelection(selState);
	});
	this.showDialog(dlg.container, 300, h, true, false);
	dlg.init();
};