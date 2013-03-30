define(["jquery","knockout"], function($,ko) {
	var FriendForm = function(o) {
		var self = this;
		var d = o.options;

		this.data = this.asObservable(d.data,{});
		this.to_id = this.asObservable(d.to_id,0);
		this.loading = ko.observable(false);
		this.modalWindow = d.modalWindow;

		this.action = ko.utils.unwrapObservable(d.action) || "";
		if (this.action.length == 0)
			this.action = this.core.isFriend(this.core.user(),this.to_id()) ? "remove" : "add";

		this.loadData = function() {
			self.loading(true);
			self.core.apiCall({
				data: {
					action: "getUser",
					id: self.to_id()
				},
				success: function(result) {
					self.loading(false);
					if (result.success) {
						self.data(result.data.userData);
					}
					if (result.error) {
						self.core.error(result.error,self.modalWindow);
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
			loading: ko.observable(false),
			send: function() {
				self.form.loading(true);
				if (self.core.user()) {
					self.form.sendAjax();
				}
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
						action: self.action == "remove" ? "destroyFriend" : "createFriend",
						formData: {
							text: self.form.text(),
							to_id: self.to_id()
						}
					},
					success: function(result) {
						delete self.form.ajax;
						self.form.loading(false);
						if (result.success) {
							var u = self.core.user();
							u.friends = result.data.friends;
							self.core.user(u);
							self.core.open({name:"alert",windowName:"alert",type:"info",message:result.success});
							self.modalWindow.destroy();
						}
						if (result.error) {
							self.core.error(result.error);
							self.modalWindow.destroy();
						}
					}
				});
			},
			cancelSend: function() {
				self.form.loading(false);
				if (self.form.ajax)
					self.form.ajax.abort();
				delete self.form.ajax;
			}
		}

		this.modalWindow.footerWidget({
			name: "friendFormFooter",
			modalWindow: self.modalWindow,
			isFriend: self.isFriend,
			form: self.form
		});


	}

	return FriendForm;
});