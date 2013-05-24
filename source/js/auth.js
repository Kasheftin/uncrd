define(["jquery","knockout","eventsEmitter"],function($,ko,EventsEmitter) {
	var Auth = function(core) {
		var self = this;

		var ar = window.location.host.split(/\./);
		this.host = ar[ar.length-2] + "." + ar[ar.length-1];
		console.log("host",this.host,ar);


		this.openNotifications = function() {
			if (core.user() && core.user().id > 0) {
				if ((parseInt(core.user().city_id) == 0 || parseInt(core.user().country_id) == 0 || parseInt(core.user().photo_exist) == 0) && !$.cookie("disableNotifications"))
					core.open({name:"userDataNotifications",windowName:"alert"});
			}
		}

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
							core.auth.openNotifications();
							var params = {path:"/",domain:core.auth.host,expires:self.rememberme() ? 14 : null};
							$.cookie("SID",data.data.user.SID,params);
							$.cookie("mss_login",data.data.user.mss_login,$.extend(params,{expires:30}));
							$.cookie("mss_pwd",data.data.user.mss_pwd,$.extend(params,{expires:30}));
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
						$.cookie("SID",null,{path:"/",domain:self.host});
						$.removeCookie("SID");
						$.cookie("mss_login",null,{path:"/",domain:self.host});
						$.removeCookie("mss_login");
						$.cookie("mss_pwd",null,{path:"/",domain:self.host});
						$.removeCookie("mss_pwd");
						console.log($.cookie("mss_login"),$.cookie("mss_pwd"),self.host);
						core.open({name:"alert",windowName:"alert",type:"info",message:data.success});
					}
				}
			});
		}

		this.initialize = function() {
			var SID = $.cookie("SID");
			var mss_login = $.cookie("mss_login");
			var mss_pwd = $.cookie("mss_pwd");
			if (SID && SID.length > 0 || (mss_login && mss_login.length>0 && mss_pwd && mss_pwd.length>0)) {
				core.apiCall({
					data: {
						action: "auth",
						SID: SID,
						mss_login: mss_login,
						mss_pwd: mss_pwd
					},
					success: function(data,textStatus,jqXHR) {
						if (data.success) {
							core.user(data.data.user);
							self.openNotifications();
						}
						else {
							$.cookie("SID",null,{path:"/",domain:self.host});
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