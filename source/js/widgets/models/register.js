define(["jquery","knockout"],function($,ko) {
	var RegisterPage = function(o) {
		var self = this;

		this.title = ko.observable(o.options.title || "");

		this.instLogin = ko.observable("");
		this.login = ko.computed(function() {
			return self.instLogin();
		}).extend({throttle:500});
		this.loginValidator = ko.observable({});
		this.login.subscribe(function(value) {
			if (self.checkLoginRequest)
				self.checkLoginRequest.abort();
			if (value.length == 0)
				return self.loginValidator({});
			self.loginValidator({loading:true});
			self.checkLoginRequest = self.core.apiCall({
				data: {
					action: "checkLogin",
					formData: {
						login: value
					}
				},
				success: function(data) {
					if (data.success)
						self.loginValidator({ok: true, type: "success"});
					if (data.error)
						self.loginValidator({ok: false, type: "error", message: data.error});
				},
				error: function() {

				}
			});
		});

		this.instEmail = ko.observable("");
		this.email = ko.computed(function() {
			return self.instEmail();
		}).extend({throttle:500});
		this.emailValidator = ko.computed(function() {
			var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			if (self.email().length == 0) return {};
			return re.test(self.email()) ? {ok: true, type: "success"} : {ok: false, type: "error", message: "Некорректный email"};
		});

		this.instPassword = ko.observable("");
		this.password = ko.computed(function() {
			return self.instPassword();
		}).extend({throttle:1000});
		this.passwordValidator = ko.computed(function() {
			if (self.password().length == 0) return {};
			return self.password().length > 3 ? {ok: true, type: "success"} : {ok: false, type: "error", message: "Слишком короткий пароль"};
		});

		this.instName = ko.observable("");
		this.name = ko.computed(function() {
			return self.instName();
		}).extend({throttle:1000});
		this.nameValidator = ko.computed(function() {
			if (self.name().length == 0) return {};
			return self.name().length > 2 ? {ok: true, type: "success"} : {ok: false, type: "error", message: "Введите имя"};
		});

		this.instSurname = ko.observable("");
		this.surname = ko.computed(function() {
			return self.instSurname();
		}).extend({throttle:1000});

		this.birthDay = ko.observable("");
		this.birthMonth = ko.observable("");
		this.birthYear = ko.observable("");

		this.birth = ko.computed(function() {
			var d = Math.floor(self.birthDay());
			var m = Math.floor(self.birthMonth());
			var y = Math.floor(self.birthYear());
			return "" + y + "-" + (m<10?"0":"") + m + "-" + (d<10?"0":"") + d;
		});

		var ar = [];
		for (var i = 1; i < 32; i++)
			ar.push((i<10?"0":"") + i);
		this.birthDays = ko.observableArray(ar);

		var ar = "января февраля марта апреля мая июня июля августа сентября октября ноября декабря".split(/ /);
		var ar2 = [];
		for (var i = 0; i < ar.length; i++)
			ar2.push({id:i+1,name:ar[i]});
		this.birthMonths = ko.observableArray(ar2);

		var ar = [];
		for (var i = (new Date).getFullYear(); i >= (new Date).getFullYear() - 60; i--)
			ar.push(i);
		this.birthYears = ko.observableArray(ar);

		this.birthValidator = ko.computed(function() {
			if (!self.birthDay() || self.birthDay().length == 0) return {};
			if (!self.birthMonth() || self.birthMonth().length == 0) return {};
			if (!self.birthYear() || self.birthYear().length == 0) return {};
			return {ok: true, type: "success"};
		});

		this.sex = ko.observable(null);
		this.sexValidator = ko.computed(function() {
			if (!self.sex()) return {};
			return {ok: true, type: "success"};
		});

		this.formIsValid = ko.computed(function() {
			if (!self.loginValidator().ok) return false;
			if (!self.emailValidator().ok) return false;
			if (!self.passwordValidator().ok) return false;
			if (!self.nameValidator().ok) return false;
			if (!self.birthValidator().ok) return false;
			if (!self.sexValidator().ok) return false;
			return true;
		})

		this.loading = ko.observable(false);
		this.popover = ko.observable(null);

		this.submit = function() {
			this.loading(true);
			this.popover(null);
			this.core.apiCall({
				data: {
					action: "register",
					formData: {
						login: this.login(),
						email: this.email(),
						password: this.password(),
						name: this.name(),
						surname: this.surname(),
						birth: this.birth(),
						sex: this.sex()
					}
				},
				success: function(data) {
					self.loading(false);
					if (data.error) {
						self.popover({type:"error",message:data.error});
					}
					if (data.success) {
						self.core.user(data.data.user);
						$.cookie("SID",data.data.user.SID,{path:"/"});
					}
				},
				error: function(jqXHR,textStatus,errorThrown) {
					self.loading(false);
					self.popover({type:"error",message:textStatus});
				}
			})
		}


	}

	return RegisterPage;
});