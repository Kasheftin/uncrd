define(["jquery","knockout"], function($,ko) {
	var BlogFormFooter = function(o) {
		var self = this;
		var d = o.options;
		this.form = d.form;
		this.modalWindow = d.modalWindow;
		this.close = function() {
			self.modalWindow.destroy();
		}
		this.enable = ko.computed(function() {
			if (
				(self.form && self.form.title() && self.form.text()) &&
				(self.form.title().length > 0) &&
				(self.form.text().length > 0) &&
				(self.form.section() > 0 || self.form.newSectionTitle().length > 0)
				) return true;
			return false;
		});
	}

	return BlogFormFooter;
});