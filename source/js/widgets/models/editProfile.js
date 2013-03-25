define(["jquery","knockout"],function($,ko) {
	var EditProfile = function(o) {
		var self = this;
		var d = o.options;

		this.loading = ko.observable(false);
		this.modalWindow = o.options.modalWindow;
		this.modalWindow.width(600);
		this.modalWindow.header("Редактирование профиля");

		this.name = ko.observable("");
		this.sirname = ko.observable("");
		this.secondname = ko.observable("");
		this.nick = ko.observable("");
		this.country_id = ko.observable(0);
		this.city_id = ko.observable(0);
		this.countries = ko.observableArray([]);
		this.contacts = ko.observableArray([]);

		this.recomputeGeo = function() {
			var keys = [], ar = {}, out = [];
			$.each(self.core.common.countries,function(i,rw) {
				keys.push(rw.name_ru);
				ar[rw.name_ru] = i;
			});
			keys.sort();
			$.each(keys,function(i,key) {
				out.push({id:ar[key],name:key});
			})
			self.countries(out);
		}

		this.cities = ko.computed(function() {
			if (self.country_id() == 0) return [{id:0,name:"Выберите страну"}];
			var keys = [], ar = {}, out = [];
			$.each(self.core.common.cities,function(i,rw) {
				if (rw.country_id == self.country_id()) {
					keys.push(rw.name_ru);
					ar[rw.name_ru] = i;
				}
			});
			keys.sort();
			$.each(keys,function(i,key) {
				out.push({id:ar[key],name:key});
			});
			return out;
		});

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


		this.loadData = function() {
			self.loading(true);
			self.core.apiCall({
				data: {
					action: "editProfile"
				},
				success: function(result) {
					self.loading(false);
					if (result.success) {
						var user = result.data.userData;
						if (user.id != self.core.user().id)
							self.core.error("Ошибка доступа",self.modalWindow);

						self.core.updateCommon(result.data.commonData);
						self.recomputeGeo();

						self.name(user.name_orig);
						self.sirname(user.sirname);
						self.secondname(user.secondname);
						self.nick(user.nick);
						self.country_id(user.country_id);
						self.city_id(user.city_id);

						ar = user.birth.split("-");
						self.birthYear(ar[0]);
						self.birthMonth(ar[1]);
						self.birthDay(ar[2]);

						self.contacts([]);
						$.each(user.contacts,function(i,rw) {
							self.contacts.push({
								type: rw.type,
								field: rw.field,
								title: rw.title,
								value: ko.observable(rw.value)
							});
						});
					}
					if (result.error) {
						self.core.error(result.error,self.modalWindow);
					}
					self.emit("ready");
				}
			});
		}

		if (!this.core.user())
			return this.core.error("Страница доступна только для зарегистрированных пользователей",this.modalWindow);
		this.requiresLoading = true;
		this.loadData();

		this.form = {
			loading: ko.observable(false),
			send: function() {
				self.form.loading(true);
				self.form.ajax = self.core.apiCall({
					data: {
						action: "updateProfile",
						formData: {
							name: self.name(),
							sirname: self.sirname(),
							secondname: self.secondname(),
							nick: self.nick(),
							country_id: self.country_id(),
							city_id: self.city_id(),
							birth: self.birth(),
							contacts: ko.toJS(self.contacts)
						}
					},
					success: function(result) {
						delete self.form.ajax;
						self.form.loading(false);
						if (result.success) {
							self.core.user(result.data.user);
							self.core.open({name:"alert",windowName:"alert",type:"info",message:result.success,callback: function() {
								self.modalWindow.destroy();
							}});
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
			}
		}

		this.modalWindow.footerWidget({
			name: "editProfileFooter",
			modalWindow: self.modalWindow,
			form: self.form
		});

	}

	return EditProfile;
});
