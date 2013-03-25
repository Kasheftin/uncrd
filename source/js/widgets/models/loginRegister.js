define(["jquery","knockout"],function($,ko) {
	var LoginRegister = function(o) {
		var self = this;
		this.auth = this.core.auth;
		this.modalWindow = o.options.modalWindow;
		this.authCallback = o.options.authCallback;

		this.modalWindow.on("destroy",function() {
			if (self.userSubscribe)
				self.userSubscribe.dispose();
		});

		this.userSubscribe = this.core.user.subscribe(function(u) {
			if (u && u.id) {
				if ($.isFunction(self.authCallback))
					self.authCallback();
				self.modalWindow.destroy();
			}
		});

		this.domInit = function(obj,element,firstDomChild) {
			self.modalWindow.width(900);
		}
	}
	return LoginRegister;
})