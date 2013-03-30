define(["jquery","knockout"], function($,ko) {
	var MessageForm = function(o) {
		var self = this;

		var d = o.options;

		this.to_id = this.asObservable(d.to_id,0);
		this.data = this.asObservable(d.data,{});
		this.showSubmitButton = this.asObservable(d.showSubmitButton,false);

		this.loading = ko.observable(false);
		this.modalWindow = d.modalWindow;

		this.loadData = function() {
			self.loading(true);
			self.core.apiCall({
				data: {
					action: "getUser",
					id: self.to_id(),
				},
				success: function(result) {
					self.loading(false);
					if (result.success)
						self.data({user:result.data.userData});
					if (result.error) {
						self.core.error(result.error);
					}
					self.emit("ready");
				}
			});
		}

		if (!d.hasOwnProperty("data") && this.to_id()) {
			this.requiresLoading = true;
			this.loadData();
		}

		this.form = {
			text: ko.observable(""),
			to_id: self.to_id,
			send: function() {
				if (self.form.text().length == 0) return;
				self.form.loading(true);
				if (self.core.user())
					self.form.sendAjax();
				else {
					self.open({
						name: "loginRegister",
						windowName: "auth",
						authCallback: function() {
							self.form.sendAjax();
						}
					});
				}
			},
			sendAjax: function() {
				self.form.ajax = self.core.apiCall({
					data: {
						action: "createMessage",
						formData: {
							text: self.form.text(),
							to_id: self.to_id()
						}
					},
					success: function(result) {
						delete self.form.ajax;
						self.form.loading(false);
						if (result.success) {
							self.core.open({name:"alert",windowName:"alert",type:"info",message:result.success});
							if (self.modalWindow)
								self.modalWindow.destroy();
						}
						if (result.error) {
							self.core.error(result.error);
						}
					},
					error: function() { }
				});
			},
			cancelSend: function() {
				self.form.loading(false);
				if (self.form.ajax)
					self.form.ajax.abort();
				delete self.form.ajax;
			},
			loading: ko.observable(false),
			reinitialize: function() {
				self.form.text("");
				self.form.loading(false);
			}
		}

		if (this.modalWindow)
			this.modalWindow.footerWidget({
				name: "messageFormFooter",
				modalWindow: self.modalWindow,
				form: self.form
			});
	}

	return MessageForm;
});