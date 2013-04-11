define(["knockout"], function($,ko) {
	var ConfirmFooter = function(o) {
		var self = this;
		this.onConfirm = o.options.onConfirm;
		this.modalWindow = o.options.modalWindow;
		this.close = function() {
			self.modalWindow.destroy();
		}
	}

	return ConfirmFooter;
});