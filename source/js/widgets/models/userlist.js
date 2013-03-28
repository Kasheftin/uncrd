define(["jquery","knockout"], function($,ko) {
	var UserList = function(o) {
		var self = this;
		var d = o.options;

		this.modalWindow = d.modalWindow;

		// открепляем to_id
		var to_id = ko.utils.unwrapObservable(d.to_id);
		if (!to_id) to_id = self.core.user() ? self.core.user().id : 0;
		this.to_id = ko.observable(to_id);

		this.limitStep = d.limitStep || 10;
		this.limit = ko.observable(d.limit || this.limitStep);
		this.loading = ko.observable(false);
		this.total = ko.observable(0);
		this.headerUser = ko.observable("");
		this.headerCnt = ko.observable("");

		this.data = {};
		this.dataLimited = ko.observableArray([]);

		this.showMoreEnabled = ko.computed(function() {
			return self.total() > self.limit();
		});

		this.showMore = function() {
			self.limit(self.limit() + self.limitStep);
		}

		this.updateDataLimited = function() {

			// подготовка нового итема для dataLimited
			var getItem = function(id) {
				var rw = self.data[id];
				return $.extend(rw,{
					core: self.core,
					gotoUserProfile: function(context,e) {
						self.core.open({name:"profile",id:rw.id,loading:"after",callback: function() {
							if (self.modalWindow)
								self.modalWindow.destroy();
						}},context,e);
					},
					gotoUserFriends: function(context,e) {
						self.core.open({name:"userlist",to_id:rw.id,loading:"before",windowName:"userlist"},context,e);
					},
					text: function(rw) {
						var tmp = "";
						var rw_city = self.core.common.cities[rw.city_id];
						var rw_country = self.core.common.countries[rw.country_id];
						if (rw_city) tmp += rw_city.name_ru;
						else if (rw_country) tmp += rw_country.name_ru;
						if (rw.ageString && rw.ageString.length > 0)
							tmp += (tmp.length > 0 ? ", ":"") + rw.ageString;
						return tmp;
					}(rw),
					my: ko.computed(function() {
						return self.core.user() && self.core.user().id == rw.id;
					})
				});
			}

			// делаем список id из data, который должен быть показан. в зависимости от limit и фильтра
			var ids2show = [], ids2show_rev = {}, i = 0;
			$.each(self.data,function(id,rw) {
				// Здесь безлимитные условия
				if (self.filter.name().length > 0 && (rw.name+rw.sirname+rw.secondname+rw.nick+rw.status).toLowerCase().indexOf(self.filter.name().toLowerCase()) == -1) return;
				if (self.filter.city().length > 0 && rw.cityText.toLowerCase().indexOf(self.filter.city().toLowerCase()) == -1) return;
				var ageFrom = parseInt(self.filter.ageFrom());
				if (!isNaN(ageFrom) && ageFrom > 0 && rw.age < ageFrom) return;
				var ageTo = parseInt(self.filter.ageTo());
				if (!isNaN(ageTo) && ageTo > 0 && rw.age > ageTo) return;
				var sex = parseInt(self.filter.sex())
				if ((sex == 1 || sex == 2) && rw.sex != sex) return;
				// i - будет идти в total, сколько всего записей без учета limit
				i++;
				// Здесь ограничение на limit
				if (ids2show.length >= self.limit()) return;
				ids2show_rev[id] = ids2show.length;
				ids2show.push(id);
			});
			self.total(i);

			// приводим в соответствие списку ids2show данные из dataLimited, но действуем только splice-ами, чтобы DOM достраивался а не перерисовывался весь

			// 1. Выброс того, чего нет в новом списке и генерация dataLimited_rev
			var old_ids = {};
			for (var i = 0; i < self.dataLimited().length; i++)
				if (!ids2show_rev.hasOwnProperty(self.dataLimited()[i].id)) {
					self.dataLimited.splice(i,1);
					i--;
				}
				else old_ids[self.dataLimited()[i].id] = 1;

			// 2. Добавление новых итемов на свои места, но только новых, т.е. тех, которых нет на каком-нибудь месте в dataLimited
			for (var i = 0; i < ids2show.length; i++) {
				if (self.dataLimited()[i] && (self.dataLimited()[i].id == ids2show[i])) continue;
				if (!old_ids.hasOwnProperty(ids2show[i])) {
					self.dataLimited.splice(i,0,getItem(ids2show[i]));
					old_ids[ids2show[i]] = 1;
				}
			}

			// 3. Новый и старый массивы теперь должны содержать одни и те же элементы, осталось переставить
			for (var i = 0; i < self.dataLimited().length; i++) {
				if (self.dataLimited()[i].id == ids2show[i]) continue;
				self.dataLimited.splice(i,1);
				self.dataLimited.splice(ids2show_rev[ids2show[i]],0,getItem(ids2show[i]));
				i--;
			}
		}

		this.filter = {
			name: ko.observable(""),
			city: ko.observable(""),
			ageFrom: ko.observable(""),
			ageTo: ko.observable(""),
			sex: ko.observable(0)
		}

		this.filter.ageFromValues = ko.computed(function() {
			var out = [""];
			var max = parseInt(self.filter.ageTo());
			if (isNaN(max)) max = 80;
			for (var i = 12; i <= max; i++)
				out.push(i);
			return out;
		});

		this.filter.ageToValues = ko.computed(function() {
			var out = [""];
			var min = parseInt(self.filter.ageFrom());
			if (isNaN(min)) min = 12;
			for (var i = min; i <= 80; i++)
				out.push(i);
			return out;
		});

		this.filter.reset = function() {
			self.filter.name("");
			self.filter.city("");
			self.filter.ageFrom("");
			self.filter.ageTo("");
			self.filter.sex(0);
		}

		this.filter.resetEnabled = ko.computed(function() {
			return self.filter.name().length > 0 || 
				self.filter.city().length > 0 || 
				self.filter.ageFrom().length > 0 || 
				self.filter.ageTo().length > 0 || 
				self.filter.sex() > 0;
		});

		this.updater = ko.computed(function() {
			self.filter.name();
			self.filter.city();
			self.filter.ageFrom();
			self.filter.ageTo();
			self.filter.sex();
			self.limit();
			self.updateDataLimited();
		});

		this.loadData = function() {
			self.core.apiCall({
				data: {
					action: "getUsers",
					formData: {
						to_id: self.to_id(),
						mode: "friends"
					}
				},
				success: function(result) {
					if (result.success) {
						if (self.modalWindow)
							self.modalWindow.width(700);
						self.core.updateCommon(result.data.commonData);
						$.each(result.data.users,function(id,rw) {
							// Генерим cityText, он нужен для формы поиска
							var rw_city = self.core.common.cities[rw.city_id];
							rw.cityText = "";
							var rw_country = self.core.common.countries[rw.country_id];
							if (rw_city) rw.cityText += " " + rw_city.name_ru + " " + rw_city.name_en;
							if (rw_country) rw.cityText += " " + rw_country.name_ru + " " + rw_country.name_en;
							self.data[id] = rw;
						});
						self.headerUser(result.data.headerUser);
						self.headerCnt(result.data.headerCnt);
						self.dataLimited([]);
						self.updateDataLimited();
						self.loading(false);
					}
					if (result.error) {
						self.core.error(result.error,self.modalWindow);
					}
					self.emit("ready");
				} 
			})
		}

		this.requiresLoading = true;
		this.loading(true);
		this.loadData();
	}

	return UserList;
});