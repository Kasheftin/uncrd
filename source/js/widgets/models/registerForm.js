define(["knockout"],function(ko) {
	var RegisterForm = function(o) {
		o.options.modalWindow.width(500);
		this.modalWindow = o.options.modalWindow;
	}
	return RegisterForm;
})