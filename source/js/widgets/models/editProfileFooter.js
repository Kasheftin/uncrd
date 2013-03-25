define(["jquery","knockout"], function($,ko) {
	var EditProfileFooter = function(o) {
		var self = this;
		var d = o.options;
		this.form = d.form;
		this.modalWindow = d.modalWindow;
		this.close = function() {
			self.modalWindow.destroy();
		}
	}

	return EditProfileFooter;
});