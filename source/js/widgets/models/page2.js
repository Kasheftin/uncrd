define(["knockout"],function(ko) {
	var Page2 = function(o) {
		this.requiresLoading = true;
		this.loading = ko.observable(true);
		this.stringFromServer = ko.observable(null);
	}
	Page2.prototype.domInit = function(self,element,firstDomChild) {
		setTimeout(function() { // Эмуляция ответа с сервера
			self.stringFromServer("Полученные с сервера данные");
			self.loading(false);
			self.emit("ready");
		},1000);
	}
	return Page2;
});