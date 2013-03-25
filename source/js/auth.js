define(["jquery","knockout","eventsEmitter"],function($,ko,EventsEmitter) {
	var Auth = function(core) {
		var self = this;

		// Вставим сюда валидацию данных юзера
		core.user.subscribe(function(rw) {
			console.log("auth user subscribe",rw);
			if (rw && rw.id > 0) {
				if ((parseInt(rw.city_id) == 0 || parseInt(rw.country_id) == 0 || parseInt(rw.photo_exist) == 0) && !$.cookie("disableNotifications"))
					core.open({name:"userDataNotifications",windowName:"alert"});
			}
		});

		var LoginForm = function() {
			var self = this;
			this.login = ko.observable("");
			this.password = ko.observable("");
			this.rememberme = ko.observable(false);
			this.loading = ko.observable(false);
			this.popover = ko.observable(null);

			this.signinEnabled = ko.computed(function() {
				return this.login().length > 0 && this.password().length > 0;
			},this);
			this.submit = function() {
				self.popover(null);
				self.loading(true);
				core.apiCall({
					data: {
						action: "signin",
						formData: {
							login: self.login(),
							password: self.password(),
							rememberme: self.rememberme() ? 1 : 0
						}
					},
					success: function(data,textStatus,jqXHR) {
						self.loading(false);
						if (data.error) {
							self.popover({type:"error",message:data.error});
						}
						if (data.success) {
							core.user(data.data.user);
							$.cookie("SID",data.data.user.SID,{path:"/",expires:self.rememberme() ? 14 : null});
							self.login("");
							self.password("");
						}
					},
					error: function(jqXHR,textStatus,errorThrown) {
						self.loading(false);
						self.popover({type:"error",message:textStatus});
					}
				});
			}
		}

		this.loginForm = new LoginForm();

		this.signout = function() {
			core.apiCall({
				data: {
					action: "signout"
				},
				success: function(data,textStatus,jqXHR) {
					if (data.error)
						core.error(data.error);
					if (data.success) {
						core.user(null);
						$.removeCookie("SID");
						core.open({name:"alert",windowName:"alert",type:"info",message:data.success});
					}
				}
			});
		}

		this.initialize = function() {
			var SID = $.cookie("SID");
			if (SID && SID.length > 0) {
				core.apiCall({
					data: {
						action: "auth",
						SID: SID
					},
					success: function(data,textStatus,jqXHR) {
						if (data.success)
							core.user(data.data.user);
						else {
							$.removeCookie("SID");
							core.user(null);
						}
						self.emit("ready");
					},
					error: function() { 
						self.emit("ready");
					}
				});
			}
			else
				self.emit("ready");
		}
	}

	$.extend(Auth.prototype,EventsEmitter.prototype);

	return Auth;
});