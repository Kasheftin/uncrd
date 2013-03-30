define(["knockout"],function(ko) {
	var AboutPage = function(o) {
		var self = this;

		this.modalWindow = o.options.modalWindow;
		this.modalWindow.header("О проекте");
		this.modalWindow.cssPosition("absolute");

		this.requiresLoading = true;

/*
		console.log(options);
		options.modalWindow.header("О проекте");
*/
		this.sampleContent = ko.observable("");
		this.addContent = function() {
			var str = "Sample content.<br>";
			for (var i = 0; i < 20; i++)
				this.sampleContent(this.sampleContent() + str);
			this.modalWindow.recalculatePosition(true);
		}
		this.remContent = function() {
			this.sampleContent("");
			this.modalWindow.recalculatePosition(true);
		}
		this.switchToRegister = function() {
			self.core.open({name:"register"});
//			this.core.windowManager.open("register");
//			this.modalWindow.destroy();
//			this.modalWindow.destroy();
		}
		var self = this;
		this.domInit = function() {
			setTimeout(function() {
				self.emit("ready");
				self.isReady = true;
			},1000);
		}
	}
	return AboutPage;
});