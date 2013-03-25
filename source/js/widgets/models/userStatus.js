define(["knockout"],function(ko) {
	var UserStatus = function(o) {
		var self = this;

		this.user = o.options.user;

		this.my = ko.computed(function() {
			return self.user() && self.core.user() && self.user().id == self.core.user().id;
		});

		this.status = ko.observable(this.user().status || "");
		this.changingStatus = ko.observable(false);
		this.loading = ko.observable(false);

		this.openForm = function() {
			self.changingStatus(true);
		}

		this.cancel = function() {
			self.changingStatus(false);
			self.status(self.user().status || "");
		}

		this.send = function() {
			self.loading(true);
			self._changeStatusAjax = self.core.apiCall({
				data: {
					action: "setStatus",
					formData: {
						status: self.status()
					}
				},
				success: function(result) {
					delete self._changeStatusAjax;
					self.loading(false);
					if (result.success) {
						var u = self.user();
						u.status = result.data.status;
						self.user(u);
						self.cancel();
					}
					if (result.error)
						self.core.error(result.error);
				},
				error: function() {
					
				}
			});
		}

		this.cancelSend = function() {
			self.loading(false);
			if (self._changeStatusAjax)
				self._changeStatusAjax.abort();
		}
	}

	return UserStatus;
});