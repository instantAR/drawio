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