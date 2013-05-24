define(["jquery","knockout"], function($,ko) {
	var Stena = function(o) {
		var self = this;

		var d = o.options;

		// порядок вывода - прямой "" или обратный "desc"
		// если прямой, форма для добавления идет под записями, если обратный - над
		this.order = this.asObservable(d.order,"");

		// этот виджет грузит стену и комментарии к фоткам, action - тип, идет в ajax
		this.actions = this.asObservable(d.actions,{get:"getStena",create:"createStena",destroy:"destroyStena"});

		// сколько записей выводить (рутовых, т.е. записей с parent=0 + все ответы на запись тоже выводятся)
		// если unlimited, выводятся все записи и нет контрола на "показать больше/меньше"
		this.unlimited = this.asObservable(d.unlimited,false);
		this.limitStep = d.limitStep || 2;
		this.limit = this.asObservable(d.limit,this.limitStep);

		// в виджет может передаваться data, тогда загрузка не происходит
		this.data = this.asObservable(d.data,{});

		// текст в заголовке (используется в стене, когда "стена пользователя ...")
		this.header = this.asObservable(d.header,"");
		this.showHeader = this.asObservable(d.showHeader,true);
		this.addCommentHeader = this.asObservable(d.addCommentHeader,"");
		this.showNoMessagesAlert = this.asObservable(d.showNoMessagesAlert,false);

		// если data не передана, делается запрос с этими параметрами
		this.to_type = this.asObservable(d.to_type,0);
		this.to_id = this.asObservable(d.to_id,0);

		this.allowDestroy = this.asObservable(d.allowDestroy,false);

		this.loading = ko.observable(false);
		this.modalWindow = o.options.modalWindow;

		// это - дефолтное значение to в форме, к чему добавлять коммент. Если null, то не показывается. Если 0, то покажется как "добавить новый коммент"
		this.to = this.asObservable(d.to,null);

		// Есть 2 варианта - либо  вызвали из профиля и уже передали data, тогда просто ее выводим. Либо вызвали и не передали (и тогда this.data - обычный observable), тогда нужно ее загрузить
		// грузим сразу всю стену или все комменты, с дозагрузкой пока не паримся
		this.loadData = function() {
			self.loading(true);
			self.core.apiCall({
				data: {
					action: self.actions().get,
					formData: {
						to_type: self.to_type(),
						to_id: self.to_id()
					}
				},
				success: function(result) {
					self.loading(false);
					if (result.success) {
						self.data({posts:result.data.posts,users:result.data.users});
					}
					if (result.error) {
						self.core.error(result.error);
					}
					self.emit("ready");
				}
			});
		}

// TODO: доделать на случай изменения to_id
//		this.to_id.subscribe(function(id) {
//			self.loadData();
//		});

		if (!d.hasOwnProperty("data") && this.to_id()) {
			this.requiresLoading = true;
			this.loadData();
		}

		// форма добавления нового комментария и ответа
		this.form = {
			text: ko.observable(""),
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
						action: self.actions().create,
						formData: {
							text: self.form.text(),
							to_type: self.to_type(),
							to_id: self.to_id(),
							parent: self.form.to()
						}
					},
					success: function(result) {
						delete self.form.ajax;
						self.form.loading(false);
						if (result.success) {
							var d = self.data();
							d.posts.push(result.data.post);
							d.users[result.data.postUser.id] = result.data.postUser;
							self.data(d);
							self.form.reinitialize();
							// ставим в 1 чтобы новый пост показался, если limit=0 и посты не показывались
							if (!self.unlimited() && self.limit() == 0) 
								self.limit(1);
						}
						if (result.error) {
							self.core.error(result.error);
						}
					}
				});
			},
			cancelSend: function() {
				self.form.loading(false);
				if (self.form.ajax)
					self.form.ajax.abort();
				delete self.form.ajax;
			},
			to: ko.observable(self.to()),
			loading: ko.observable(false),
			move: function(elem) {
				self.form.to(elem ? (elem.id || 0) : 0);
			},
			reinitialize: function() {
				self.form.to(self.to());
				self.form.text("");
				self.form.loading(false);
			}
		}

		// в stena формируются посты в виде массива-дерева с children-ами
		this.stena = ko.computed(function() {
			if (!self.data()) return [];

			var ar = $.extend(true,[],self.data().posts);
			if (!ar) return [];

			// идем в обратном порядке потому что ответы на комменты появляются позже своих парентов
			for (var i = ar.length - 1; i >= 0; i--) {
				ar[i].user_id = ar[i].user;
				ar[i].form = self.form;
				if (ar[i].user_id) 
					ar[i].user = self.data().users[ar[i].user_id];
				if (!ar[i].user)
					ar[i].user = {id:0,name:"deleted"};
				ar[i].gotoUserProfile = function(id) {
					return function(context,e) {
						if (id > 0)
							self.open({name:"profile",id:id,loading:"after"},context,e);
					}
				}(ar[i].user.id);
				ar[i].allowDestroy = self.allowDestroy;
				ar[i].destroy = function(i,rw) {
					return function(context,e) {
						self.open({name:"confirm",windowName:"confirm",message:"Вы уверены что хотите удалить этот комментарий?",onConfirm:function() {
							self.core.apiCall({
								data: {
									action: self.actions().destroy,
									id: rw.id
								},
								success: function(result) {
									if (result.success)
										self.destroyStena(i);
									if (result.error)
										self.core.error(result.error);
								}
							});
						}});
					}
				}(i,ar[i]);
				if (ar[i].parent > 0) {
					for (var j = 0; j < i; j++)
						if (ar[j].id == ar[i].parent) {
							if (!ar[j].children) ar[j].children = [];
							ar[j].children.unshift($.extend(true,{},ar[i]));
						}
				}
			}
			var out = [];
			for (var i = 0; i < ar.length; i++)
				if (ar[i].parent == 0)
					out.push(ar[i]);
			return out;
		});

		this.destroyStena = function(i) {
			var d = self.data();
			if (i >= 0) d.posts.splice(i,1);
			self.data(d);
			self.data.notifySubscribers();
		}

		this.stenaLimited = ko.computed(function() {
			if (!self.unlimited() && self.limit() <= 0) return [];
			var ar = $.extend(true,[],self.stena());
			if (self.order() == "desc") ar.reverse();
			if (self.unlimited()) return ar;
			return ar.slice(0,self.limit());
		});

		if (this.modalWindow) {
			this.stenaLimited.subscribe(function() {
				self.modalWindow.recalculatePositionTrue();
			});
		}

		this.showMore = function() {
			self.limit((self.limit() || 0) + self.limitStep);
		}

		this.showLess = function() {
			var l = (self.limit() || 0) - self.limitStep;
			if (l < 0) l = 0;
			self.limit(l);
		}

		this.showAll = function() {
			self.limit(self.stena().length);
		}

		this.showNone = function() {
			self.limit(0);
		}

		this.showSwitch = function() {
			if (self.isHidden())
				self.showMore();
			else
				self.showNone();
		}

		this.isHidden = ko.computed(function() {
			return self.limit() == 0;
		});

		this.showMoreEnabled = ko.computed(function() {
			return self.stena().length > 0 && self.limit() > 0 && self.stena().length != self.stenaLimited().length;
		});

		this.showLessEnabled = ko.computed(function() {
			return self.stena().length>0 && self.limit() > 0;
		});

		this.showEnabled = ko.computed(function() {
			return !self.unlimited() && self.stena().length > 0 && self.limit() == 0;
		})
	}

	return Stena;
});