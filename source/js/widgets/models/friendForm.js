define(["jquery","knockout"], function($,ko) {
	var FriendForm = function(o) {
		var self = this;
		var d = o.options;

		this.data = this.asObservable(d.data,{});
		this.to_id = this.asObservable(d.to_id,0);
		this.loading = ko.observable(false);
		this.modalWindow = o.options.modalWindow;

		// Зачем isFriend: если юзер не зарегин, нажимает добавить друга, вводит логин-пароль и оказывается, что он уже в друзьях, идет запрос на удаление друга а не на добавление
		// поэтому нужно isFriend фиксировать вначале
		this.isFriend = false;
		if (this.data() && this.core.user()) {
			for (var i = 0; i < this.core.user().friends.length; i++)
				if (this.data().id == this.core.user().friends[i]) {
					this.isFriend = true;
					break;
				}
		}

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
						windowName: "loginRegister",
						authCallback: function() {
							self.form.sendAjax();
						}
					});
				}
			},
			sendAjax: function() {
				self.form.ajax = self.core.apiCall({
					data: {
						action: self.isFriend ? "destroyFriend" : "createFriend",
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