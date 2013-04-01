define(function() {
	var Page1 = function(o) {
		var modalWindow = o.options.modalWindow;
		if (modalWindow) {
			modalWindow.width(700);
			modalWindow.cssPosition("absolute");
			this.close = function() {
				modalWindow.destroy();
			}
		}
		else {
			this.close = function() {
				this.destroy();
			}
		}
	}
	return Page1;
});
