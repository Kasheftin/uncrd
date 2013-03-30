define(function() {
	var AlertPage = function(o) {
		this.message = o.options.message;
		this.type = o.options.type;
		o.options.modalWindow.header(this.type == "error" ? "Ошибка" : "");
	}
	return AlertPage;
});