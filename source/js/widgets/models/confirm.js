define(["knockout"], function($,ko) {
	var Confirm = function(o) {
		var self = this;
		this.message = o.options.message;
		this.onConfirm = function() {
			self.modalWindow.destroy();
			if (o.options.onConfirm && typeof o.options.onConfirm == "function")
				o.options.onConfirm();
		}
		this.modalWindow = o.options.modalWindow;
		this.modalWindow.footerWidget({
			name: "confirmFooter",
			modalWindow: self.modalWindow,
			onConfirm: self.onConfirm
		});
	}

	return Confirm;
});